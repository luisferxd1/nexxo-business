// src/pages/CategoryPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CategoryPage() {
  const { categoryId } = useParams(); // Obtener el ID de la categoría desde la URL
  const navigate = useNavigate(); // Para el botón de "Volver"
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar el nombre de la categoría
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
        if (categoryDoc.exists()) {
          setCategory({ id: categoryDoc.id, ...categoryDoc.data() });
        } else {
          setError('Categoría no encontrada.');
        }
      } catch (error) {
        console.error('Error al cargar la categoría:', error);
        setError('Error al cargar la categoría: ' + error.message);
      }
    };

    fetchCategory();
  }, [categoryId]);

  // Cargar productos de la categoría
  useEffect(() => {
    setLoading(true);

    const productsQuery = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      try {
        const productsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtrar productos por el ID de la categoría
        const filteredProducts = productsData.filter(
          (product) => product.category === categoryId
        );

        setProducts(filteredProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar productos:', error);
        setError('Error al cargar los productos: ' + error.message);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error al cargar productos:', error);
      setError('Error al cargar los productos: ' + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryId]); // Dependencia cambiada a categoryId

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-600 text-lg font-semibold mb-2">{error}</p>
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
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
      className="p-4 md:p-8 min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto">
        {/* Encabezado con botón de "Volver" */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl font-bold text-custom-blue flex items-center">
            <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 mr-3 text-custom-blue" />
            Productos en {category ? category.name : 'Categoría'}
          </h2>
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center text-custom-blue hover:text-blue-700 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Categorías
          </button>
        </div>

        {/* Cuadrícula de Productos */}
        {products.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
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
                    className="bg-white rounded-2xl shadow-md p-4 hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative w-full h-48 mb-4">
                      <img
                        src={product.image || 'https://via.placeholder.com/150'}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
                      />
                    </div>
                    <h4 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                      {product.name}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-500 mb-2">{category ? category.name : 'Sin categoría'}</p>
                    <p className="text-sm md:text-base font-bold text-custom-blue">
                      ${product.price.toFixed(2)}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg font-medium mb-4">
              No hay productos en esta categoría.
            </p>
            <Link
              to="/categories"
              className="inline-flex items-center px-4 py-2 bg-custom-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Explorar Otras Categorías
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}