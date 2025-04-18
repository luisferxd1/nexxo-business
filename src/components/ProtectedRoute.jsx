// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRole, children }) {
  const { user, userRole, loading } = useAuth();

  // Normalizar userRole y allowedRole para evitar problemas con espacios o mayúsculas/minúsculas
  const normalizedUserRole = userRole ? userRole.trim().toLowerCase() : null;
  const normalizedAllowedRole = allowedRole ? allowedRole.trim().toLowerCase() : null;

  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - userRole:', userRole, 'normalizedUserRole:', normalizedUserRole);
  console.log('ProtectedRoute - allowedRole:', allowedRole, 'normalizedAllowedRole:', normalizedAllowedRole);
  console.log('ProtectedRoute - userRole === allowedRole:', normalizedUserRole === normalizedAllowedRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (normalizedAllowedRole && normalizedUserRole !== normalizedAllowedRole) {
    console.log('ProtectedRoute - Role mismatch, redirecting to /');
    return <Navigate to="/" replace />;
  }

  return children;
}