import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function CompleteProfile() {
  const { user, isNewUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    phoneNumber: '',
    email: user?.email || '', // Extraemos el correo de la cuenta de Google
  });
  const [error, setError] = useState('');

  // Redirigir si el perfil ya está completo
  useEffect(() => {
    if (!isNewUser || (user && user.profileComplete)) {
      navigate('/role-selection'); // Redirige a selección de rol si el perfil ya está completo
    }
  }, [isNewUser, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, birthDate, phoneNumber } = formData;

    if (!name || !birthDate || !phoneNumber) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name,
        birthDate,
        phoneNumber,
        email: user.email,
        profileComplete: true,
      });
      navigate('/role-selection'); // Redirige a selección de rol después de completar el perfil
    } catch (err) {
      setError('Error al guardar los datos: ' + err.message);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Completa tu Perfil</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Teléfono</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-lg p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className="mt-1 block w-full border rounded-lg p-2 bg-gray-100"
              disabled
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Guardar y Continuar
          </button>
        </form>
      </div>
    </div>
  );
}