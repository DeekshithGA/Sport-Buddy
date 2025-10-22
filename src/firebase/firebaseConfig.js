// src/firebase/firebaseConfig.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Keep if you use analytics
import { getAuth } from "firebase/auth"; // <--- IMPORT THIS
import { getFirestore } from "firebase/firestore"; // <--- IMPORT THIS

// Your web app's Firebase configuration
const firebaseConfig = {
    const firebaseConfig = {
apiKey: "YOUR_API_KEY",
authDomain: "YOUR_AUTH_DOMAIN",
projectId: "YOUR_PROJECT_ID",
storageBucket: "YOUR_STORAGE_BUCKET",
messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
appId: "YOUR_APP_ID"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
const auth = getAuth(app); // <--- INITIALIZE AUTH
const db = getFirestore(app); // <--- INITIALIZE FIRESTORE

// Optional: Initialize Analytics if you plan to use it
const analytics = getAnalytics(app);

// Export all necessary services
export { app, auth, db, analytics }; // <--- EXPORT AUTH AND DB
