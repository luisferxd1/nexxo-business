// src/components/RegisterBusiness.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function RegisterBusiness() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
    } else if (userRole !== 'business') {
      navigate('/role-selection');
    }
  }, [user, userRole, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("RegisterBusiness: Enviando formulario...");

    if (!businessName || !businessAddress) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      // Actualizar el estado del usuario a 'pending'
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          role: 'business',
          status: 'pending',
          businessInfo: {
            name: businessName,
            address: businessAddress,
          },
        },
        { merge: true }
      );

      // Crear una solicitud en la colección 'businessRequests'
      await addDoc(collection(db, 'businessRequests'), {
        userId: user.uid,
        businessName,
        businessAddress,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      setSuccessMessage('Tu solicitud de negocio ha sido enviada con éxito.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Error al enviar la solicitud: ' + err.message);
    }
  };

  const handleGoHome = () => {
    console.log("RegisterBusiness: Redirigiendo a / sin modificar el estado del usuario");
    navigate('/');
  };

  if (loading) {
    return <div className="text-center text-gray-600">Cargando...</div>;
  }

  return (
    <section className="p-6 flex flex-col items-center">
      <h3 className="text-xl font-semibold mb-4">Registra tu Negocio</h3>
      {successMessage ? (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg">
          {successMessage}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
          {error && <p className="text-red-500">{error}</p>}
          <Input
            placeholder="Nombre del Negocio"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
          <Input
            placeholder="Dirección del Negocio"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
          />
          <Button type="submit" className="w-full">
            Enviar Solicitud
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoHome}
          >
            Inicio
          </Button>
        </form>
      )}
    </section>
  );
}