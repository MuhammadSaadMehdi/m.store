import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { browserLocalPersistence, getAuth, setPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
    "apiKey": "AIzaSyDxzflbAO43oTi54Ty9_NZBVIy7oR9SlEI",
    "authDomain": "maqboolstore-f9839.firebaseapp.com",
    "projectId": "maqboolstore-f9839",
    "storageBucket": "maqboolstore-f9839.firebasestorage.app",
    "messagingSenderId": "316132269431",
    "appId": "1:316132269431:web:320058f177f96a46519572"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(() => {});

window.db = db; // make accessible
window.auth = auth;