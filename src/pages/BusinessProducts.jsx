// src/pages/BusinessProducts.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, onSnapshot, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';

export default function BusinessProducts() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user, userRole, loading } = useAuth(); // Ignoramos la advertencia para 'user'
  const { addToCart } = useCart();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (userRole === 'business') {
      navigate('/business');
      return;
    }

    if (userRole === 'admin') {
      navigate('/admin');
      return;
    }

    // Cargar datos del negocio
    const fetchBusiness = async () => {
      try {
        const businessDocRef = doc(db, 'users', businessId);
        const businessDocSnap = await getDoc(businessDocRef);
        if (businessDocSnap.exists()) {
          setBusiness({ id: businessDocSnap.id, ...businessDocSnap.data() });
        } else {
          toast.error('Negocio no encontrado.');
          navigate('/');
        }
      } catch (error) {
        console.error('Error al cargar el negocio:', error);
        toast.error('Error al cargar el negocio.');
        navigate('/');
      }
    };

    // Cargar productos del negocio
    const fetchProducts = async () => {
      const productsQuery = query(
        collection(db, 'products'),
        where('businessId', '==', businessId)
      );
      const unsubscribe = onSnapshot(
        productsQuery,
        (snapshot) => {
          const productsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProducts(productsData);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error al cargar los productos:', error);
          toast.error('Error al cargar los productos.');
          setIsLoading(false);
        }
      );

      return unsubscribe;
    };

    fetchBusiness();
    fetchProducts();
  }, [businessId, userRole, loading, navigate]);

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar productos al carrito.');
      navigate('/login');
      return;
    }

    addToCart(product);
    toast.success(
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
        <span className="text-sm md:text-base">Producto agregado con éxito</span>
      </div>,
      {
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #10b981',
        },
        icon: null,
      }
    );
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-base sm:text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <section className="p-6 md:p-12 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Botón de Volver */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-500 text-sm md:text-base hover:text-custom-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Volver</span>
          </button>
        </motion.div>

        {/* Información del Negocio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.clientInfo?.businessName || 'Negocio'}
              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-full"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500 text-xs md:text-sm">Sin logo</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
              {business.clientInfo?.businessName || 'Negocio Desconocido'}
            </h2>
            <p className="text-sm md:text-base text-gray-500">Productos disponibles</p>
          </div>
        </motion.div>

        {/* Lista de Productos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.length > 0 ? (
            products.map((product) => (
              <motion.div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white border border-gray-100 rounded-lg flex flex-col cursor-pointer transition-all duration-300 hover:border-gray-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative w-full h-40 md:h-48 bg-gray-50">
                  <img
                    src={product.image || 'https://via.placeholder.com/300x200?text=Producto'}
                    alt={product.name || 'Producto sin nombre'}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/300x200?text=Producto')}
                  />
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-sm md:text-base font-medium text-gray-900">
                    {product.name || 'Producto sin nombre'}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    ${product.price?.toFixed(2) || 0}
                  </p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation(); // Evita que el clic en el botón dispare el evento del div
                      handleAddToCart(product);
                    }}
                    className="mt-2 bg-custom-blue text-white rounded-2xl hover:bg-blue-600 text-xs md:text-sm py-1.5 transition-all duration-300"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" /> Añadir al Carrito
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-sm md:text-base">
                Este negocio no tiene productos disponibles.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}