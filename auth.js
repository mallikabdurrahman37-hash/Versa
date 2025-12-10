import { auth, db } from '../firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const authForm = document.getElementById('auth-form');
const showLoginBtn = document.getElementById('show-login');
const toggleAuth = document.getElementById('toggle-auth');
const authTitle = document.getElementById('auth-title');
const nameField = document.getElementById('name-field');

let isSignup = false;

// Initialize EmailJS
(function() {
    emailjs.init("gcu0l6BmpxemB5JOE");
})();

// Toggle Sign Up / Login UI
if(toggleAuth) {
    toggleAuth.addEventListener('click', (e) => {
        e.preventDefault();
        isSignup = !isSignup;
        authTitle.innerText = isSignup ? "Sign Up" : "Login";
        nameField.classList.toggle('hidden', !isSignup);
        toggleAuth.innerText = isSignup ? "Already have an account? Login" : "Need an account? Sign Up";
        document.getElementById('signup-name').required = isSignup;
    });
}

// Handle Form Submit
if(authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('signup-name').value;

        try {
            if (isSignup) {
                // Sign Up
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Update Display Name
                await updateProfile(user, { displayName: name });

                // Create User Doc in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    displayName: name,
                    email: email,
                    role: "client",
                    freeTrialsRemaining: 5,
                    createdAt: new Date()
                });
                alert("Account created! Redirecting...");
            } else {
                // Login
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error) {
            alert(error.message);
        }
    });
}

// Auth State Observer (Routing)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in, check role
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentPath = window.location.pathname;

            if (userData.role === 'admin') {
                if (!currentPath.includes('admin.html')) window.location.href = 'admin.html';
            } else {
                if (!currentPath.includes('dashboard.html')) window.location.href = 'dashboard.html';
            }
        }
    } else {
        // No user, prevent access to protected pages
        if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
            window.location.href = 'index.html';
        }
    }
});

// Logout Helper
const logoutBtn = document.getElementById('logout-btn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'index.html');
    });
}
