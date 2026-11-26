import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const PartnerAuthContext = createContext(null);

/**
 * Normalizes username and generates deterministic synthetic login email
 * Exact specification:
 * const cleanUsername = String(usernameInput || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
 * const loginEmail = `${cleanUsername}@partner.webryza.in`;
 */
export function getDeterministicLoginEmail(usernameInput) {
  const cleanUsername = String(usernameInput || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "");
  return {
    cleanUsername,
    loginEmail: `${cleanUsername}@partner.webryza.in`,
  };
}

export const PartnerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Helper to retrieve and verify partner record from Firestore
   */
  const loadPartnerRecord = async (cleanUsername, authUser) => {
    try {
      // 1. Read partner_usernames/${cleanUsername} to retrieve partnerId
      const usernameDocRef = doc(db, "partner_usernames", cleanUsername);
      const usernameSnap = await getDoc(usernameDocRef);

      let partnerId = null;
      if (usernameSnap.exists()) {
        const uData = usernameSnap.data();
        partnerId = uData.partnerId || uData.partnerCode;
      }

      // Fallback: If not found in partner_usernames, check if cleanUsername itself is the partnerCode
      if (!partnerId) {
        partnerId = cleanUsername.toUpperCase();
      }

      // 2. Read document wedding_partners/${partnerId}
      const partnerDocRef = doc(db, "wedding_partners", partnerId);
      const partnerSnap = await getDoc(partnerDocRef);

      if (!partnerSnap.exists()) {
        return { error: "Partner profile not found. Please contact WebRyza administrator." };
      }

      const partnerData = partnerSnap.data();

      // 3. Verify account is active
      if (partnerData.isActive === false || partnerData.isActive === "false") {
        return { error: "Your partner account has been deactivated. Please contact WebRyza." };
      }

      const partnerCode = partnerData.partnerCode || partnerId;

      // Auto-bind authUid in Firestore if not already bound
      if (!partnerData.authUid || partnerData.authUid !== authUser.uid) {
        try {
          await updateDoc(partnerDocRef, {
            authUid: authUser.uid,
            updatedAt: serverTimestamp(),
          });
        } catch (bindErr) {
          console.warn("Could not auto-bind authUid on client:", bindErr);
        }
      }

      return {
        profile: {
          id: partnerSnap.id,
          partnerId: partnerCode,
          partnerCode: partnerCode,
          shopName: partnerData.shopName || partnerCode,
          ownerName: partnerData.ownerName || "",
          phone: partnerData.phone || "",
          email: partnerData.email || authUser.email,
          username: partnerData.username || cleanUsername,
          isActive: true,
          authUid: authUser.uid,
          role: "partner",
          registrationUrl: `https://cards.webryza.in/?ref=${partnerCode}`,
          alreadyPaid: Number(partnerData.alreadyPaid || partnerData.totalPayouts || partnerData.payoutsTotal || 0),
        },
      };
    } catch (err) {
      console.error("Error loading partner record:", err);
      return { error: "Unable to load partner information. Please check your connection." };
    }
  };

  // Listen to Firebase Auth state changes with persistence
  useEffect(() => {
    // Configure local persistence
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn("Could not set browserLocalPersistence:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const usernamePrefix = String(user.email || "")
          .replace("@partner.webryza.in", "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9_-]/g, "");

        const result = await loadPartnerRecord(usernamePrefix, user);

        if (result.error) {
          console.warn("Session validation failed:", result.error);
          await signOut(auth);
          setCurrentUser(null);
          setPartnerProfile(null);
          setAuthError(result.error);
        } else if (result.profile) {
          setPartnerProfile(result.profile);
          setAuthError(null);
        }
      } else {
        setCurrentUser(null);
        setPartnerProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener for partner active status
  useEffect(() => {
    if (!partnerProfile?.partnerCode) return;

    const partnerDocRef = doc(db, "wedding_partners", partnerProfile.partnerCode);
    const unsub = onSnapshot(
      partnerDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.isActive === false || data.isActive === "false") {
            console.warn("Account deactivated remotely. Signing out partner.");
            await signOut(auth);
            setCurrentUser(null);
            setPartnerProfile(null);
            setAuthError("Your partner account has been deactivated. Please contact WebRyza.");
          } else {
            setPartnerProfile((prev) =>
              prev
                ? {
                    ...prev,
                    shopName: data.shopName || prev.shopName,
                    alreadyPaid: Number(data.alreadyPaid || data.totalPayouts || data.payoutsTotal || 0),
                  }
                : prev
            );
          }
        }
      },
      (err) => {
        console.warn("Partner status watch note:", err);
      }
    );

    return () => unsub();
  }, [partnerProfile?.partnerCode]);

  /**
   * Log in using Username and Password
   * Strict adherence to deterministic synthetic email construction
   */
  const login = async (usernameInput, passwordInput) => {
    setAuthError(null);

    const { cleanUsername, loginEmail } = getDeterministicLoginEmail(usernameInput);

    if (!cleanUsername || !passwordInput) {
      throw new Error("Please enter both username and password.");
    }

    // Set local browser persistence
    await setPersistence(auth, browserLocalPersistence).catch(() => {});

    // Authenticate with Firebase Authentication
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, loginEmail, passwordInput);
    } catch (authErr) {
      console.error("Firebase Auth error:", authErr.code, authErr.message);

      if (
        authErr.code === "auth/invalid-credential" ||
        authErr.code === "auth/user-not-found" ||
        authErr.code === "auth/wrong-password" ||
        authErr.code === "auth/invalid-email"
      ) {
        throw new Error("Invalid username or password. Please check your credentials.");
      } else if (authErr.code === "auth/user-disabled") {
        throw new Error("Your partner account has been deactivated. Please contact WebRyza.");
      } else if (authErr.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please wait a few moments and try again.");
      } else if (authErr.code === "auth/network-request-failed") {
        throw new Error("Authentication service temporarily unavailable. Please check your internet connection.");
      }

      throw new Error("Invalid username or password. Please check your credentials.");
    }

    const authUser = userCredential.user;

    // Verify the partner record in Cloud Firestore
    const result = await loadPartnerRecord(cleanUsername, authUser);

    if (result.error) {
      await signOut(auth);
      throw new Error(result.error);
    }

    setCurrentUser(authUser);
    setPartnerProfile(result.profile);
    return result.profile;
  };

  /**
   * Self-service password change
   */
  const changePassword = async (newPassword) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated partner session found.");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
    } catch (err) {
      console.error("Password update error:", err.code, err.message);
      if (err.code === "auth/requires-recent-login") {
        throw new Error("For security, please log out and log in again before changing your password.");
      }
      throw new Error(err.message || "Failed to update password. Please try again.");
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setPartnerProfile(null);
      setAuthError(null);
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  };

  return (
    <PartnerAuthContext.Provider
      value={{
        currentUser,
        partnerProfile,
        loading,
        authError,
        login,
        logout,
        changePassword,
        isAuthenticated: !!currentUser && !!partnerProfile,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
};

export const usePartnerAuth = () => {
  const context = useContext(PartnerAuthContext);
  if (!context) {
    throw new Error("usePartnerAuth must be used within a PartnerAuthProvider");
  }
  return context;
};
