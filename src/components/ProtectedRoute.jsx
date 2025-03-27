import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isNewUser } = useAuth();

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Si el usuario es nuevo y no ha completado su perfil, redirigir a /complete-profile
  if (isNewUser || !user.profileComplete) {
    return <Navigate to="/complete-profile" />;
  }

  // Si la ruta requiere un rol específico y el usuario no lo tiene, redirigir al inicio
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}