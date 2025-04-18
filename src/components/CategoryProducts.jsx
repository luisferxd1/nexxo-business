// src/components/CategoryProducts.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CategoryProducts() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        const categoryDocRef = doc(db, 'categories', categoryId);
        const categoryDocSnap = await getDoc(categoryDocRef);
        if (categoryDocSnap.exists()) {
          setCategoryName(categoryDocSnap.data().name || 'Categoría Desconocida');
        } else {
          setError('Categoría no encontrada');
          setLoading(false);
          return;
        }

        const productsQuery = query(
          collection(db, 'products'),
          where('category', '==', categoryId)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los productos: ' + err.message);
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-t-custom-blue border-gray-200 rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-red-50 p-4 sm:p-6 rounded-lg shadow-md max-w-sm sm:max-w-md text-center">
          <p className="text-red-600 text-base sm:text-lg font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center text-gray-800 hover:text-gray-600 transition-colors duration-200 font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver a Categorías
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 min-h-screen bg-gray-50"
    >
      <div className="max-w-6xl mx-auto">
        {/* Encabezado con botón de "Volver" y contador de productos */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-custom-blue flex items-center">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mr-2 sm:mr-3 text-custom-blue" />
            Productos en {categoryName}
          </h2>
          <div className="flex items-center gap-2 sm:gap-3">
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Mostrando {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </p>
            <button
              onClick={() => navigate('/categories')}
              className="inline-flex items-center text-gray-800 hover:text-gray-600 transition-colors duration-200 font-medium text-xs sm:text-sm md:text-base"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Volver a Categorías
            </button>
          </div>
        </div>

        {/* Cuadrícula de Productos */}
        {products.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            <AnimatePresence>
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    to={`/product/${product.id}`}
                    className="bg-white rounded-xl shadow-md p-3 sm:p-4 hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                  >
                    <div className="relative w-full h-32 sm:h-40 md:h-48 mb-3 sm:mb-4">
                      <img
                        src={product.image || 'https://via.placeholder.com/150'}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
                      />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-clamp-2 mb-2 flex-grow">
                        {product.description}
                      </p>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-custom-blue mt-auto">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg font-medium mb-4">
              No hay productos en esta categoría.
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-custom-blue text-white rounded-3xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Explorar Otras Categorías
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}