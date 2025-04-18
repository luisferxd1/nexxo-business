// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const AuthContext = createContext({
  user: null,
  userRole: null,
  userStatus: null,
  loading: true,
  loginWithGoogle: () => Promise.resolve(),
  loginWithEmail: () => Promise.resolve(),
  registerWithEmail: () => Promise.resolve(),
  logout: () => Promise.resolve(),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        console.log('Usuario autenticado:', currentUser.uid);
        setUser(currentUser);

        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUserRole(userData.role || 'client');
            setUserStatus(userData.status || 'pending');
            console.log('Datos del usuario cargados desde Firestore:', userData);
          } else {
            setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              createdAt: new Date().toISOString(),
              role: 'client',
              status: 'active',
              logo: '',
              profileImage: currentUser.photoURL || '',
            });
            setUserRole('client');
            setUserStatus('active');
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        console.log('Usuario autenticado: No autenticado');
        setUser(null);
        setUserRole(null);
        setUserStatus(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          role: 'client',
          status: 'active',
          logo: '',
          profileImage: user.photoURL || '',
        });
      } else {
        await setDoc(
          userRef,
          {
            lastLogin: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      toast.error('Failed to sign in with Google: ' + error.message);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error al iniciar sesión con correo y contraseña:', error);
      toast.error('Error al iniciar sesión: ' + error.message);
      throw error;
    }
  };

  const registerWithEmail = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: '',
        photoURL: '',
        createdAt: new Date().toISOString(),
        role: 'client',
        status: 'active',
        logo: '',
        profileImage: '',
      });
    } catch (error) {
      console.error('Error al registrarse con correo y contraseña:', error);
      toast.error('Error al registrarse: ' + error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('Cierre de sesión exitoso');
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión: ' + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, userRole, userStatus, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}