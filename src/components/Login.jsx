// src/components/Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { Button } from './ui/button';

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(null);

  // Manejar el resultado de la redirección
  useEffect(() => {
    async function handleRedirectResult() {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Inicio de sesión exitoso:', result.user.uid, result.user.email);
          setIsRedirecting(false);
        }
      } catch (error) {
        console.error('Error al procesar el resultado de la redirección:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje de error:', error.message);
        if (error.code === 'auth/unauthorized-domain') {
          setError('El dominio actual no está autorizado. Por favor, contacta al administrador o intenta de nuevo más tarde.');
        } else {
          setError(`Error al iniciar sesión: ${error.message} (${error.code}). Por favor, intenta de nuevo.`);
        }
        setIsRedirecting(false);
      }
    }

    if (!authLoading && !user) {
      handleRedirectResult();
    }
  }, [authLoading, user]);

  // Redirigir si el usuario está autenticado
  useEffect(() => {
    if (authLoading) return;

    console.log('Login.jsx - Estado de autenticación:', user ? user.uid : 'No hay usuario autenticado');
    if (user) {
      console.log('Redirigiendo a /role-selection');
      navigate('/role-selection');
    } else {
      console.log('Usuario no autenticado, permaneciendo en /login');
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsRedirecting(true);
    console.log('Iniciando sesión con Google (redirect)...');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      if (error.code === 'auth/unauthorized-domain') {
        setError('El dominio actual no está autorizado. Por favor, contacta al administrador o intenta de nuevo más tarde.');
      } else {
        setError(`Error al iniciar sesión: ${error.message} (${error.code}). Por favor, intenta de nuevo.`);
      }
      setIsRedirecting(false);
    }
  };

  if (authLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-custom-blue">Iniciar Sesión</h2>
        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}
        <Button
          onClick={handleGoogleLogin}
          className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
          disabled={isRedirecting}
        >
          Iniciar Sesión con Google
        </Button>
      </div>
    </div>
  );
}