// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// YOUR PROVIDED CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBna3TIolv0sHC40k0KF6Th4HZw4DxSQLA",
  authDomain: "versa-c7cd9.firebaseapp.com",
  projectId: "versa-c7cd9",
  storageBucket: "versa-c7cd9.firebasestorage.app",
  messagingSenderId: "891162708524",
  appId: "1:891162708524:web:65b5dd845dd432df205f89",
  measurementId: "G-SSNW218TP4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// EmailJS Configuration
export const emailConfig = {
    serviceID: "Service_8aax3v2",
    templateID: "Template_3o3w1sf",
    publicKey: "gcu0l6BmpxemB5JOE"
};
