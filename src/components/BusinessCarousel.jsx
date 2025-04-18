// src/components/BusinessCarousel.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function BusinessCarousel() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar negocios desde Firestore
  useEffect(() => {
    const businessesQuery = query(collection(db, 'users'), where('role', '==', 'business'));
    const unsubscribe = onSnapshot(
      businessesQuery,
      (snapshot) => {
        const businessesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBusinesses(businessesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar los negocios:', error);
        setError('No se pudieron cargar los negocios. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Mostrar un skeleton loader mientras se cargan los datos
  if (loading) {
    return (
      <div className="py-6 md:py-8 max-w-7xl mx-auto">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 px-4 md:px-6">
          Explora Negocios
        </h2>
        <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory hide-scrollbar px-4 md:px-6">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-none flex flex-col items-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-200 rounded-full animate-pulse" />
              <div className="mt-2 h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mostrar un mensaje de error si falla la carga
  if (error) {
    return (
      <div className="py-6 md:py-8 max-w-7xl mx-auto">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 px-4 md:px-6">
          Explora Negocios
        </h2>
        <p className="text-red-500 text-sm md:text-base px-4 md:px-6">{error}</p>
      </div>
    );
  }

  // No mostramos nada si no hay negocios
  if (businesses.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="py-6 md:py-8 max-w-7xl mx-auto"
    >
      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 px-4 md:px-6">
        Explora Negocios
      </h2>
      <div className="flex overflow-x-auto space-x-4 snap-x snap-mandatory hide-scrollbar px-4 md:px-6">
        {businesses.map((business) => (
          <motion.div
            key={business.id}
            onClick={() => navigate(`/business/${business.id}`)}
            className="flex-none flex flex-col items-center cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full overflow-hidden">
              {business.logo ? (
                <img
                  src={business.logo}
                  alt={business.clientInfo?.businessName || 'Negocio'}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=Logo')}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Sin logo</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs md:text-sm text-gray-600 text-center max-w-[80px] md:max-w-[100px] truncate">
              {business.clientInfo?.businessName || 'Negocio Desconocido'}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}