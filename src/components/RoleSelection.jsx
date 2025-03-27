import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function RoleSelection() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');

  // Redirigir si el usuario ya tiene un rol asignado
  useEffect(() => {
    if (!loading && user) {
      if (user.role && user.role !== 'user') {
        navigate('/'); // Redirige al inicio si ya tiene un rol
      }
    }
  }, [user, loading, navigate]);

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setError('Por favor, selecciona un rol.');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        role: selectedRole,
        status: selectedRole === 'business' ? 'pending' : '',
      });
      navigate('/'); // Redirige al inicio después de seleccionar el rol
    } catch (err) {
      setError('Error al guardar el rol: ' + err.message);
    }
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Selecciona tu Rol</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="space-y-4">
          <button
            onClick={() => setSelectedRole('client')}
            className={`w-full py-2 rounded-lg ${
              selectedRole === 'client' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Cliente
          </button>
          <button
            onClick={() => setSelectedRole('business')}
            className={`w-full py-2 rounded-lg ${
              selectedRole === 'business' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Negocio
          </button>
          <button
            onClick={handleRoleSelection}
            className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}