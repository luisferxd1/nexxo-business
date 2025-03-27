// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Tu configuración de Firebase (reemplaza con tus credenciales)
const firebaseConfig = {
    apiKey: "AIzaSyAhsVwcVcO-q2fTpWCJBMx6XjQzxBWb8_k",
    authDomain: "nexxobusiness-c38b4.firebaseapp.com",
    projectId: "nexxobusiness-c38b4",
    storageBucket: "nexxobusiness-c38b4.firebasestorage.app",
    messagingSenderId: "274046324841",
    appId: "1:274046324841:web:5de5f39cdda45ca3ca92f8",
}
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
const auth = getAuth(app);

// Proveedor de Google para autenticación
const googleProvider = new GoogleAuthProvider();

// Función para iniciar sesión con Google
const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar Storage
const storage = getStorage(app);

// Exportar las instancias
export { auth, db, googleProvider, signInWithGoogle, storage };