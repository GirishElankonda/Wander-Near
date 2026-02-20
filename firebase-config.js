// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// REPLACE these with your actual Firebase project config keys
const firebaseConfig = {
  apiKey: "AIzaSyBR0p54ZFxAEd6fvlYXocBET9pXFGYikao",
  authDomain: "travelhelper-c030c.firebaseapp.com",
  projectId: "travelhelper-c030c",
  storageBucket: "travelhelper-c030c.firebasestorage.app",
  messagingSenderId: "762643126460",
  appId: "1:762643126460:web:cf290bb423eb6a73cc18b9",
  measurementId: "G-3LVXV2YMCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
