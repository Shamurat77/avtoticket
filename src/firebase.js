// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBk_ghWKwK7RZHfndHetI7rCkxZY7B06KM",
  authDomain: "avtoticket001.firebaseapp.com",
  projectId: "avtoticket001",
  storageBucket: "avtoticket001.firebasestorage.app",
  messagingSenderId: "86727515299",
  appId: "1:86727515299:web:0b9f0070401fe95cf0f316",
  measurementId: "G-97D35PWPDT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);