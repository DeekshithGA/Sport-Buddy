// Firebase initialization
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "sports-buddy.firebaseapp.com",
  projectId: "sports-buddy",
  storageBucket: "sports-buddy.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const loggingCollection = db.collection("logs");
const usersCollection = db.collection("users");
const sportsCollection = db.collection("sports");
