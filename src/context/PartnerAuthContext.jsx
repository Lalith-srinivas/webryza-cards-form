import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const PartnerAuthContext = createContext(null);

export const PartnerAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Helper to retrieve partner profile from Firestore
   */
  const fetchPartnerDoc = async (user) => {
    if (!user) return null;

    try {
      // 1. Try querying wedding_partners by uid
      const uidQuery = query(
        collection(db, "wedding_partners"),
        where("uid", "==", user.uid)
      );
      const uidSnap = await getDocs(uidQuery);

      if (!uidSnap.empty) {
        const docSnap = uidSnap.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }

      // 2. Try querying by email
      if (user.email) {
        const emailQuery = query(
          collection(db, "wedding_partners"),
          where("email", "==", user.email.toLowerCase())
        );
        const emailSnap = await getDocs(emailQuery);

        if (!emailSnap.empty) {
          const docSnap = emailSnap.docs[0];
          return { id: docSnap.id, ...docSnap.data() };
        }
      }

      // 3. Try checking document directly if docId matches username/prefix
      const emailPrefix = user.email ? user.email.split("@")[0] : "";
      if (emailPrefix) {
        const directDoc = await getDoc(doc(db, "wedding_partners", emailPrefix));
        if (directDoc.exists()) {
          return { id: directDoc.id, ...directDoc.data() };
        }

        const directDocUpper = await getDoc(
          doc(db, "wedding_partners", emailPrefix.toUpperCase())
        );
        if (directDocUpper.exists()) {
          return { id: directDocUpper.id, ...directDocUpper.data() };
        }

        // Try querying by partnerId or username
        const partnerIdQuery = query(
          collection(db, "wedding_partners"),
          where("partnerId", "==", emailPrefix.toUpperCase())
        );
        const partnerIdSnap = await getDocs(partnerIdQuery);
        if (!partnerIdSnap.empty) {
          const docSnap = partnerIdSnap.docs[0];
          return { id: docSnap.id, ...docSnap.data() };
        }
      }

      // 4. Try direct doc ID by user.uid
      const uidDirect = await getDoc(doc(db, "wedding_partners", user.uid));
      if (uidDirect.exists()) {
        return { id: uidDirect.id, ...uidDirect.data() };
      }

      return null;
    } catch (err) {
      console.error("Error fetching partner profile:", err);
      return null;
    }
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchPartnerDoc(user);

        if (profile) {
          // Check if active
          const isActive = profile.isActive === true || profile.isActive === "true";
          if (!isActive) {
            console.warn("Partner account is deactivated. Signing out.");
            await signOut(auth);
            setCurrentUser(null);
            setPartnerProfile(null);
            setAuthError("Your partner account has been deactivated. Please contact WebRyza Admin.");
          } else {
            setPartnerProfile(profile);
            setAuthError(null);
          }
        } else {
          // User exists in Auth, construct baseline partner profile from email/UID
          const emailPrefix = user.email ? user.email.split("@")[0] : "SHOP";
          const fallbackProfile = {
            partnerId: emailPrefix.toUpperCase(),
            shopName: emailPrefix.toUpperCase(),
            username: emailPrefix,
            email: user.email,
            isActive: true,
          };
          setPartnerProfile(fallbackProfile);
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

  /**
   * Log in with username or email and password
   */
  const login = async (usernameOrEmail, password) => {
    setAuthError(null);
    const trimmedInput = usernameOrEmail.trim();

    if (!trimmedInput || !password) {
      throw new Error("Please enter both username and password.");
    }

    let emailToUse = trimmedInput;

    // If no '@', resolve username to email
    if (!trimmedInput.includes("@")) {
      try {
        // Look up partner in wedding_partners
        const usernameQuery = query(
          collection(db, "wedding_partners"),
          where("username", "==", trimmedInput)
        );
        const userSnap = await getDocs(usernameQuery);

        if (!userSnap.empty) {
          const data = userSnap.docs[0].data();
          if (data.email) {
            emailToUse = data.email;
          } else if (data.authEmail) {
            emailToUse = data.authEmail;
          } else {
            emailToUse = `${trimmedInput.toLowerCase()}@webryza.in`;
          }
        } else {
          // Check partnerId or code
          const partnerIdQuery = query(
            collection(db, "wedding_partners"),
            where("partnerId", "==", trimmedInput.toUpperCase())
          );
          const pSnap = await getDocs(partnerIdQuery);

          if (!pSnap.empty) {
            const data = pSnap.docs[0].data();
            emailToUse = data.email || data.authEmail || `${trimmedInput.toLowerCase()}@webryza.in`;
          } else {
            // Check direct document ID
            const directSnap = await getDoc(doc(db, "wedding_partners", trimmedInput));
            if (directSnap.exists()) {
              const data = directSnap.data();
              emailToUse = data.email || data.authEmail || `${trimmedInput.toLowerCase()}@webryza.in`;
            } else {
              // Default convention: username@webryza.in
              emailToUse = `${trimmedInput.toLowerCase()}@webryza.in`;
            }
          }
        }
      } catch (err) {
        console.warn("Could not query partner collection during email resolution, trying standard auth:", err);
        emailToUse = `${trimmedInput.toLowerCase()}@webryza.in`;
      }
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
      const user = userCredential.user;

      // Verify active partner profile
      const profile = await fetchPartnerDoc(user);

      if (profile) {
        const isActive = profile.isActive === true || profile.isActive === "true";
        if (!isActive) {
          await signOut(auth);
          throw new Error("This partner account has been deactivated. Please contact WebRyza Admin.");
        }
        setPartnerProfile(profile);
      } else {
        // Fallback profile if Firestore doc mapping is pending
        const emailPrefix = user.email ? user.email.split("@")[0] : trimmedInput;
        const fallbackProfile = {
          partnerId: trimmedInput.toUpperCase() || emailPrefix.toUpperCase(),
          shopName: trimmedInput.toUpperCase(),
          username: trimmedInput,
          email: user.email,
          isActive: true,
        };
        setPartnerProfile(fallbackProfile);
      }

      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error("Login failed:", err);
      let message = err.message;

      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        message = "Invalid username or password. Please verify your credentials provided by WebRyza Admin.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Please wait a few moments and try again.";
      } else if (err.message.includes("deactivated")) {
        message = err.message;
      }

      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * Log out
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
