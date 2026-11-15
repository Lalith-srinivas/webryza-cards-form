// Firebase Configuration for WebRyza Cards Form
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB0klqmY-B4RwyoPdMSmC2zILlrPD27bU8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "webryza-admin.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "webryza-admin",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "webryza-admin.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "812029553523",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:812029553523:web:cfa165843b1745c31a7306",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-46ZVVN789J"
};

// Singleton initialization to prevent multiple instances
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Analytics conditionally (only in supported browser environments)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Graceful fallback if analytics is blocked or unsupported
  });
}

export default app;
