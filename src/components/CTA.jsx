import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function CTA() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [userStatus, setUserStatus] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Obtener el estado del usuario desde Firestore
  useEffect(() => {
    if (loading || !user) return;

    const fetchUserStatus = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserStatus(userDoc.data().status || null);
        } else {
          setFetchError('No se encontró el perfil del usuario.');
        }
      } catch (error) {
        console.error('Error al obtener el estado del usuario:', error);
        setFetchError('Error al cargar los datos del usuario.');
      }
    };

    fetchUserStatus();
  }, [user, loading]);

  // Mostrar un indicador de carga mientras se obtienen los datos
  if (loading || (user && userStatus === null && !fetchError)) {
    return (
      <section className="bg-custom-blue text-white py-6 px-4 text-center shadow-lg rounded-tl-2xl rounded-tr-2xl">
        <p className="text-sm md:text-base">Cargando...</p>
      </section>
    );
  }

  // Mostrar un mensaje de error si falla la consulta
  if (fetchError) {
    return (
      <section className="bg-custom-blue text-white py-6 px-4 text-center shadow-lg rounded-tl-2xl rounded-tr-2xl">
        <p className="text-sm md:text-base">{fetchError}</p>
      </section>
    );
  }

  // Determinar si se debe mostrar el botón de "Vender"
  const showSellButton = !userRole || userRole === 'business';

  return (
    <section className="bg-custom-blue text-white py-6 px-4 md:py-10 md:px-8 text-center shadow-lg rounded-tl-2xl rounded-tr-2xl">
      <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6">
        ¿Listo para vender con nosotros?
      </h2>

      {userRole === 'business' ? (
        userStatus === 'pending' ? (
          <p className="text-xs md:text-sm max-w-md mx-auto">
            Tu solicitud de negocio está en revisión.{' '}
            <a href="/contact" className="underline hover:text-gray-200">
              Contacta al soporte
            </a>{' '}
            para más información.
          </p>
        ) : userStatus === 'verified' ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs md:text-sm max-w-md mx-auto">
              ¡Ya eres un negocio verificado! Administra tus productos desde tu panel.
            </p>
            <button
              onClick={() => navigate('/business')}
              className="bg-white text-custom-blue px-4 py-2 md:px-6 md:py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors text-sm md:text-base"
            >
              Ir al Panel de Negocio
            </button>
          </div>
        ) : null
      ) : showSellButton ? (
        <button
          onClick={() => navigate('/role-selection')}
          className="bg-white text-custom-blue px-4 py-2 md:px-6 md:py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors text-sm md:text-base"
        >
          Vender en NEXXO
        </button>
      ) : (
        <p className="text-xs md:text-sm max-w-md mx-auto">
          Ya eres un cliente. Si deseas vender, por favor{' '}
          <a href="/contact" className="underline hover:text-gray-200">
            contacta al soporte
          </a>{' '}
          para cambiar tu rol.
        </p>
      )}
    </section>
  );
}