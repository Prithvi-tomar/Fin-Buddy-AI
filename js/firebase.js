// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase Configuration

const firebaseConfig = {

  apiKey: "AIzaSyDmuOFv8mb6YKui6cyS8addWtwq5YLCT_U",

  authDomain: "finbuddy-ai-347f8.firebaseapp.com",

  projectId: "finbuddy-ai-347f8",

  storageBucket: "finbuddy-ai-347f8.firebasestorage.app",

  messagingSenderId: "929612638987",

  appId: "1:929612638987:web:784e022530bc3624e9100e",

  measurementId: "G-SJZZ91KEVK"

};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

// Services

export const auth = getAuth(app);

export const db = getFirestore(app);