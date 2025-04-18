// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Configuración de Firebase usando las credenciales proporcionadas
const firebaseConfig = {
  apiKey: "AIzaSyAhsVwcVcO-q2fTpWCJBMx6XjQzxBWb8_k",
  authDomain: "nexxobusiness-c38b4.firebaseapp.com",
  projectId: "nexxobusiness-c38b4",
  storageBucket: "nexxobusiness-c38b4.firebasestorage.app",
  messagingSenderId: "274046324841",
  appId: "1:274046324841:web:5de5f39cdda45ca3ca92f8",
  measurementId: "G-W4SZD9M1G5",
};

// Verificar que las variables de entorno estén definidas
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error("Faltan variables de entorno de Firebase. Verifica tu archivo .env");
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

// Inicializar Functions
const functions = getFunctions(app, 'us-central1');

// Conectar a los emuladores en modo desarrollo
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// Exportar las instancias
export { app, auth, db, storage, functions, googleProvider, signInWithGoogle };