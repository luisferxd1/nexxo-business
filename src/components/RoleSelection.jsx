import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from './ui/button';
import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';

export default function RoleSelection() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Verificar si el usuario ya tiene un rol y su perfil está completo
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            // Si el rol es deliveryPerson y el perfil no está completo, redirigir al formulario
            if (data.role === 'deliveryPerson' && !data.profileComplete) {
              navigate('/delivery-person-profile', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          toast.error('Error al verificar tu perfil: ' + error.message);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login', { replace: true });
      }
    };
    fetchUserData();
  }, [user, navigate]);

  const handleRoleSelection = async (role) => {
    if (!user) {
      toast.error('Debes iniciar sesión para seleccionar un rol.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      // Datos básicos para todos los roles
      const userDataUpdate = {
        role,
        profileComplete: role === 'deliveryPerson' ? false : true, // Para deliveryPerson, debe completar el perfil
      };

      // Si el rol es deliveryPerson, inicializamos los campos específicos
      if (role === 'deliveryPerson') {
        userDataUpdate.name = '';
        userDataUpdate.phone = '';
        userDataUpdate.status = 'pending'; // Estado inicial para verificación
        userDataUpdate.available = false; // No disponible hasta que se verifique
        userDataUpdate.deliveryInfo = {
          licenseUrl: '',
          vehicleType: '',
          vehiclePlate: '',
          vehiclePhotoUrl: '',
        };
      }

      await updateDoc(userRef, userDataUpdate);
      toast.success(
        `Rol actualizado a ${
          role === 'client' ? 'Cliente' :
          role === 'business' ? 'Negocio' :
          'Repartidor'
        }.`
      );

      // Redirigir según el rol
      if (role === 'deliveryPerson') {
        navigate('/delivery-person-profile', { replace: true }); // Redirigir al formulario de perfil
      } else {
        navigate(
          role === 'business' ? '/business' :
          role === 'client' ? '/' :
          '/', 
          { replace: true }
        );
      }
    } catch (error) {
      console.error('Error al actualizar el rol:', error);
      toast.error('Error al actualizar el rol: ' + error.message);
    }
  };

  // Si está cargando, mostrar un mensaje de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  // Si el usuario ya tiene un rol y su perfil está completo, redirigir según el rol
  if (userData && userData.role && userData.profileComplete) {
    navigate(
      userData.role === 'business' ? '/business' :
      userData.role === 'deliveryPerson' ? '/delivery' :
      userData.role === 'client' ? '/' :
      '/',
      { replace: true }
    );
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-custom-blue">
          Selecciona tu Rol
        </h2>
        <p className="text-center text-gray-600 mb-4">
          Rol actual: <span className="font-semibold">{userRole || 'No asignado'}</span>
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => handleRoleSelection('client')}
            className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
            disabled={userRole === 'client'}
          >
            Soy Cliente
          </Button>
          <Button
            onClick={() => handleRoleSelection('business')}
            className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
            disabled={userRole === 'business'}
          >
            Soy Negocio
          </Button>
          <Button
            onClick={() => handleRoleSelection('deliveryPerson')}
            className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
            disabled={userRole === 'deliveryPerson'}
          >
            Soy Repartidor
          </Button>
        </div>
        <Button
          onClick={() => navigate('/')}
          className="w-full mt-4 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl"
        >
          Volver
        </Button>
      </div>
    </div>
  );
}