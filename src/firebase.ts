import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCI4BfKrhF522itpBdVH1OCLfthZ2kXPnU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oscar-studio-mangament.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oscar-studio-mangament",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oscar-studio-mangament.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "271857499022",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:271857499022:web:69eff6d4b89ffa123342df"
};

// Initialize Firebase only if we have the API Key
let app;
let db: any = null;
let auth: any = null;

try {
  if (firebaseConfig.apiKey) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } else {
    console.warn("Firebase API Key is missing. Firebase features will be disabled.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { db, auth };
export default app;
