import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { Loader2, LogIn, Mail, Lock, UserPlus } from 'lucide-react';
import googleLogo from '../assets/google-logo.svg';
import { toast } from 'react-hot-toast';

export default function Login() {
  const { user, loading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/role-selection', { replace: true });
    } catch (error) {
      toast.error('Error al iniciar sesión con Google: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      toast.success('¡Inicio de sesión exitoso!');
      navigate('/', { replace: true }); // La redirección según el rol se maneja en App.js
    } catch (error) {
      toast.error('Error al iniciar sesión: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, ingresa tu correo y contraseña.');
      return;
    }
    setIsSubmitting(true);
    try {
      await registerWithEmail(email, password);
      toast.success('¡Cuenta creada exitosamente! Selecciona tu rol para continuar.');
      // Retrasar el cambio de estado para que el toast sea visible
      setTimeout(() => {
        navigate('/role-selection', { replace: true });
      }, 1500);
    } catch (error) {
      toast.error('Error al crear la cuenta: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-6 h-6 text-blue-700 animate-spin" />
          <p className="text-lg text-gray-600 font-medium">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  if (user) {
    navigate('/', { replace: true }); // La redirección según el rol se maneja en App.js
    return null;
  }

  return (
    <section className="min-h-screen bg-white rounded-3xl flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-sm sm:max-w-md"
      >
        {/* Ícono en la parte superior */}
        <div className="flex justify-center mb-6">
          {isRegistering ? (
            <UserPlus className="w-12 h-12 text-custom-blue" />
          ) : (
            <LogIn className="w-12 h-12 text-custom-blue" />
          )}
        </div>

        {/* Título y mensaje de bienvenida */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          {isRegistering ? 'Crear Cuenta' : '¡Bienvenido!'}
        </h2>
        <p className="text-center text-gray-500 text-sm sm:text-base mb-6">
          {isRegistering
            ? 'Regístrate para comenzar'
            : 'Inicia sesión para explorar nuestra app'}
        </p>

        {/* Formulario de correo y contraseña */}
        <form onSubmit={isRegistering ? handleRegister : handleEmailLogin} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-blue text-sm sm:text-base"
              disabled={isSubmitting}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-blue text-sm sm:text-base"
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-custom-blue text-white hover:bg-blue-700 py-3 sm:py-4 text-sm sm:text-base font-medium transition-all duration-300 rounded-lg"
            style={{ borderRadius: '9999px' }}
          >
            {isSubmitting ? 'Procesando...' : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Botón para alternar entre login y registro */}
        <div className="text-center mb-6">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-custom-blue hover:underline text-sm sm:text-base"
            disabled={isSubmitting}
          >
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia sesión'
              : '¿No tienes una cuenta? Regístrate'}
          </button>
        </div>

        {/* Separador */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">O</span>
          </div>
        </div>

        {/* Botón de Google */}
        <Button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 bg-white text-custom-blue border border-gray-300 hover:bg-gray-50 py-3 sm:py-4 text-sm sm:text-base font-medium transition-all duration-300 shadow-sm hover:shadow-md"
          style={{ borderRadius: '9999px' }}
        >
          <img src={googleLogo} alt="Google Logo" className="w-5 h-5" />
          Continuar con Google
        </Button>

        {/* Texto adicional */}
        <p className="text-center text-gray-400 text-xs sm:text-sm mt-6">
          Al {isRegistering ? 'registrarte' : 'iniciar sesión'}, aceptas nuestros{' '}
          <a href="/terms" className="text-blue-700 hover:underline">
            Términos y Condiciones
          </a>
        </p>
      </motion.div>
    </section>
  );
}