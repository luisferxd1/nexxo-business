// src/components/CTA.jsx
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function CTA() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    if (loading || !user) return;

    const fetchUserStatus = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserStatus(userDoc.data().status || null);
      }
    };

    fetchUserStatus();
  }, [user, loading]);

  if (loading) {
    return <div className="text-center text-gray-600">Cargando...</div>;
  }

  const showSellButton = !userRole || userRole === 'business';

  return (
    <section className="bg-custom-blue text-white p-8 text-center shadow-lg rounded-tl-2xl rounded-tr-2xl">
      <h2 className="text-3xl font-bold mb-4">¿Listo para vender con nosotros?</h2>
      {userRole === 'business' ? (
        userStatus === 'pending' ? (
          <p className="text-sm">
            Tu solicitud de negocio está en revisión.{' '}
            <a href="/contact" className="underline">
              Contacta al soporte
            </a>{' '}
            para más información.
          </p>
        ) : userStatus === 'verified' ? (
          <div>
            <p className="text-sm mb-4">
              ¡Ya eres un negocio verificado! Administra tus productos desde tu panel.
            </p>
            <button
              onClick={() => navigate('/business')}
              className="bg-white text-blue-500 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Ir al Panel de Negocio
            </button>
          </div>
        ) : null
      ) : showSellButton ? (
        <button
          onClick={() => navigate('/role-selection')}
          className="bg-white text-custom-blue px-6 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
        >
          Vender en NEXXO
        </button>
      ) : (
        <p className="text-sm">
          Ya eres un cliente. Si deseas vender, por favor{' '}
          <a href="/contact" className="underline">
            contacta al soporte
          </a>{' '}
          para cambiar tu rol.
        </p>
      )}
    </section>
  );
}

/*
Notas Adicionales:
1. **Estilos Conservados**:
   - Contenedor: `bg-blue-500 text-white p-8 text-center rounded-2xl shadow-lg`
   - Título: `text-3xl font-bold mb-4`
   - Botones: `bg-white text-blue-500 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors`
   - Mensajes: `text-sm` para el texto pequeño, y `underline` para los enlaces.

2. **Funcionalidades Añadidas**:
   - Obtiene el estado del usuario (`status`) desde Firestore para mostrar mensajes condicionales.
   - Muestra mensajes personalizados según el rol y estado del usuario.
   - Incluye un enlace para contactar al soporte en los mensajes relevantes.

3. **Verificación**:
   - Si los estilos no coinciden exactamente con lo que esperas, verifica si hay estilos globales en `index.css` o `App.css` que podrían estar afectando.
   - Asegúrate de que las clases de Tailwind (`bg-blue-500`, `text-blue-500`, etc.) estén disponibles en tu configuración de `tailwind.config.js`.

4. **Próximos Pasos**:
   - **Historial de Pedidos**: Guardar un historial de pedidos en Firestore al hacer clic en "Pagar".
   - **Panel de Administrador**: Crear un panel para aprobar/rechazar solicitudes de negocio.
   - **Filtros Adicionales**: Añadir filtros por precio o categoría en `FeaturedProducts.jsx`.
*/