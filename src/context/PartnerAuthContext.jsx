import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const PartnerAuthContext = createContext(null);

/**
 * Normalizes username to lowercase and trims whitespace
 * Exactly matches WebRyza Admin backend logic
 */
export function normalizeUsername(username) {
  if (!username || typeof username !== "string") return "";
  return username.toLowerCase().trim();
}

export const PartnerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Helper to retrieve and verify partner profile from Firestore
   */
  const fetchPartnerProfile = async (user) => {
    if (!user) return null;

    try {
      // 1. Force refresh token to get latest Custom Claims
      const tokenResult = await user.getIdTokenResult(true);
      let partnerCode = tokenResult.claims?.partnerCode || tokenResult.claims?.partnerId;

      // 2. If partnerCode is not in custom claims, derive from email or partner_usernames
      if (!partnerCode && user.email) {
        const usernamePrefix = user.email
          .replace("@partner.webryza.in", "")
          .replace("@webryza.in", "")
          .toLowerCase()
          .trim();

        try {
          const usernameDoc = await getDoc(doc(db, "partner_usernames", usernamePrefix));
          if (usernameDoc.exists()) {
            partnerCode = usernameDoc.data().partnerCode || usernameDoc.data().partnerId;
          }
        } catch (err) {
          console.warn("Could not read partner_usernames during profile lookup:", err);
        }

        if (!partnerCode) {
          partnerCode = usernamePrefix.toUpperCase();
        }
      }

      if (!partnerCode) return null;

      // 3. Fetch the verified partner document from wedding_partners
      const partnerSnap = await getDoc(doc(db, "wedding_partners", partnerCode));

      if (!partnerSnap.exists()) {
        console.warn(`Partner document '${partnerCode}' not found in wedding_partners.`);
        return null;
      }

      const partnerData = partnerSnap.data();

      // 4. Verify account is active
      const isActive = partnerData.isActive === true || partnerData.isActive === "true";
      if (!isActive) {
        console.warn(`Partner account '${partnerCode}' is deactivated.`);
        return { isDeactivated: true };
      }

      return {
        partnerId: partnerCode,
        partnerCode: partnerCode,
        shopName: partnerData.shopName || partnerCode,
        ownerName: partnerData.ownerName || "",
        phone: partnerData.phone || "",
        email: partnerData.email || user.email,
        username: partnerData.username || partnerCode.toLowerCase(),
        isActive: true,
        authUid: user.uid,
        role: "partner",
      };
    } catch (err) {
      console.error("Error retrieving partner profile:", err);
      return null;
    }
  };

  // Listen to Firebase Auth state changes (Session Restoration)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchPartnerProfile(user);

        if (profile?.isDeactivated) {
          await signOut(auth);
          setCurrentUser(null);
          setPartnerProfile(null);
          setAuthError("Your partner account has been deactivated. Please contact WebRyza Admin.");
        } else if (profile) {
          setPartnerProfile(profile);
          setAuthError(null);
        } else {
          // Could not verify partner record
          setCurrentUser(user);
          setPartnerProfile(null);
        }
      } else {
        setCurrentUser(null);
        setPartnerProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time listener: if partner account is deactivated by WebRyza Admin, kick out immediately
  useEffect(() => {
    if (!partnerProfile?.partnerCode) return;

    const partnerRef = doc(db, "wedding_partners", partnerProfile.partnerCode);
    const unsub = onSnapshot(
      partnerRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isActive = data.isActive === true || data.isActive === "true";
          if (!isActive) {
            console.warn("Live deactivation detected. Logging out partner session.");
            await signOut(auth);
            setCurrentUser(null);
            setPartnerProfile(null);
            setAuthError("Your partner account has been deactivated. Please contact WebRyza Admin.");
          }
        }
      },
      (err) => {
        console.warn("Real-time partner status watch notice:", err);
      }
    );

    return () => unsub();
  }, [partnerProfile?.partnerCode]);

  /**
   * Log in with Username and Password
   * Seamlessly resolves username to the internal Firebase Auth identifier
   */
  const login = async (usernameOrId, password) => {
    setAuthError(null);

    const rawInput = (usernameOrId || "").trim();
    if (!rawInput || !password) {
      throw new Error("Please enter both username and password.");
    }

    const cleanUsername = normalizeUsername(rawInput);
    let emailToUse = "";

    // 1. Resolve identifier
    if (cleanUsername.includes("@")) {
      // User entered an email address directly
      emailToUse = cleanUsername;
    } else {
      // Step A: Check partner_usernames collection
      try {
        const usernameSnap = await getDoc(doc(db, "partner_usernames", cleanUsername));
        if (usernameSnap.exists()) {
          const uData = usernameSnap.data();
          emailToUse = uData.internalEmail || `${cleanUsername}@partner.webryza.in`;
        }
      } catch (e) {
        console.warn("Notice checking partner_usernames:", e);
      }

      // Step B: If not found as username, check if user entered Partner ID (e.g. SHOP001)
      if (!emailToUse) {
        try {
          const partnerSnap = await getDoc(doc(db, "wedding_partners", cleanUsername.toUpperCase()));
          if (partnerSnap.exists()) {
            const pData = partnerSnap.data();
            const resolvedUsername = normalizeUsername(pData.username);
            if (resolvedUsername) {
              emailToUse = `${resolvedUsername}@partner.webryza.in`;
            }
          }
        } catch (e) {
          console.warn("Notice checking wedding_partners by partner code:", e);
        }
      }

      // Step C: Deterministic mapping matching WebRyza Admin backend Cloud Functions
      if (!emailToUse) {
        emailToUse = `${cleanUsername}@partner.webryza.in`;
      }
    }

    // 2. Authenticate via Firebase Authentication
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (authError) {
      console.error("Firebase Auth sign-in failed:", authError.code, authError.message);

      if (
        authError.code === "auth/invalid-credential" ||
        authError.code === "auth/user-not-found" ||
        authError.code === "auth/wrong-password" ||
        authError.code === "auth/invalid-email"
      ) {
        throw new Error("Incorrect username or password. Please verify your credentials and try again.");
      } else if (authError.code === "auth/user-disabled") {
        throw new Error("Your partner account has been deactivated. Please contact WebRyza Admin.");
      } else if (authError.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please wait a few moments before trying again.");
      } else if (authError.code === "auth/network-request-failed") {
        throw new Error("Authentication service temporarily unavailable. Please check your internet connection.");
      }

      throw new Error("Incorrect username or password. Please verify your credentials and try again.");
    }

    const user = userCredential.user;

    // 3. Verify Partner Account Record & Active Status
    const profile = await fetchPartnerProfile(user);

    if (profile?.isDeactivated) {
      await signOut(auth);
      throw new Error("Your partner account has been deactivated. Please contact WebRyza Admin.");
    }

    if (!profile) {
      // Fallback baseline profile while custom claims or Firestore mapping synchronizes
      const derivedCode = cleanUsername.toUpperCase();
      const fallbackProfile = {
        partnerId: derivedCode,
        partnerCode: derivedCode,
        shopName: derivedCode,
        ownerName: "",
        phone: "",
        email: user.email,
        username: cleanUsername,
        isActive: true,
        authUid: user.uid,
        role: "partner",
      };
      setPartnerProfile(fallbackProfile);
      setCurrentUser(user);
      return user;
    }

    setPartnerProfile(profile);
    setCurrentUser(user);
    return user;
  };

  /**
   * Log out securely
   */
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setPartnerProfile(null);
      setAuthError(null);
    } catch (err) {
      console.error("Logout failed:", err);
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
