// src/pages/ProductPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'react-hot-toast';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [business, setBusiness] = useState({ name: '', logo: '' });
  const [categories, setCategories] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    // Cargar categorías
    const categoriesQuery = query(collection(db, 'categories'));
    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const categoriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);
      },
      (error) => {
        console.error('Error al cargar las categorías:', error);
        toast.error('Error al cargar las categorías.');
      }
    );

    // Cargar producto y datos del negocio
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() };
          setProduct(productData);

          // Obtener los datos del negocio usando el businessId del producto
          try {
            const businessDocRef = doc(db, 'users', productData.businessId);
            const businessDocSnap = await getDoc(businessDocRef);
            if (businessDocSnap.exists()) {
              const businessData = businessDocSnap.data();
              setBusiness({
                name: businessData.clientInfo?.businessName || 'Negocio Desconocido',
                logo: businessData.logo || '',
              });
            } else {
              setBusiness({ name: 'Negocio Desconocido', logo: '' });
            }
          } catch (businessError) {
            console.error('Error al cargar los datos del negocio:', businessError);
            setBusiness({ name: 'Negocio Desconocido', logo: '' }); // Valor por defecto si falla
          }

          // Cargar productos similares (misma categoría, con similitud en nombre o descripción)
          if (productData.category) {
            const similarQuery = query(
              collection(db, 'products'),
              where('category', '==', productData.category)
            );
            const unsubscribeSimilar = onSnapshot(
              similarQuery,
              (snapshot) => {
                const similarData = snapshot.docs
                  .map((doc) => ({ id: doc.id, ...doc.data() }))
                  .filter((p) => p && p.id !== productData.id)
                  .filter((p) => {
                    if (!p.name && !p.description) return false;
                    const nameWords = (productData.name || '').toLowerCase().split(/\s+/);
                    const descWords = (productData.description || '').toLowerCase().split(/\s+/);
                    if (!nameWords.length && !descWords.length) return false;
                    const pNameWords = (p.name || '').toLowerCase().split(/\s+/);
                    const pDescWords = (p.description || '').toLowerCase().split(/\s+/);
                    const hasCommonName = nameWords.some(
                      (word) => pNameWords.includes(word) && word.length > 3
                    );
                    const hasCommonDesc = descWords.some(
                      (word) => pDescWords.includes(word) && word.length > 3
                    );
                    return hasCommonName || hasCommonDesc;
                  });

                setSimilarProducts(similarData.slice(0, 4));
              },
              (error) => {
                console.error('Error al cargar productos similares:', error);
              }
            );

            return () => unsubscribeSimilar();
          }
        } else {
          setError('Producto no encontrado.');
        }
      } catch (error) {
        console.error('Error al cargar el producto:', error);
        setError('Error al cargar el producto: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      unsubscribeCategories();
    };
  }, [productId, user, authLoading, navigate]);

  const handleAddToCart = () => {
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

  const goToProductPage = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Skeleton Loader Component
  const SkeletonProduct = () => (
    <div className="max-w-5xl mx-auto">
      <div className="animate-pulse">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 h-64 md:h-96 bg-gray-200 rounded-lg" />
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded-2xl w-full md:w-1/2 mt-4" />
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || authLoading) {
    return (
      <section className="p-6 md:p-12 bg-white min-h-screen">
        <SkeletonProduct />
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 md:p-12 bg-white min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-red-500 text-sm md:text-base">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-custom-blue text-sm md:text-base hover:text-blue-600 transition-colors"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="p-6 md:p-12 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Botón de Volver Minimalista (estilo Apple) */}
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

        {/* Detalles del Producto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Imagen del Producto */}
            <div className="w-full md:w-1/2">
              <img
                src={product.image || 'https://via.placeholder.com/300x200?text=Producto'}
                alt={product.name || 'Producto sin nombre'}
                className="w-full h-64 md:h-96 object-contain rounded-lg bg-gray-50 transition-transform duration-300 hover:scale-105"
                loading="lazy"
                onError={(e) => (e.target.src = 'https://via.placeholder.com/300x200?text=Producto')}
              />
            </div>

            {/* Detalles del Producto */}
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="text-2xl md:text-4xl font-light text-gray-900">{product.name || 'Producto sin nombre'}</h2>

              {/* Mostrar el Nombre del Negocio y el Logo */}
              <div className="flex items-center gap-3">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-xs md:text-sm">Sin logo</span>
                  </div>
                )}
                <p className="text-sm md:text-base text-gray-500">
                  Negocio: {business.name}
                </p>
              </div>

              <p className="text-sm md:text-base text-gray-500">
                Categoría: {categories.find((cat) => cat.id === product.category)?.name || product.category || 'Sin categoría'}
              </p>
              <p className="text-xl md:text-2xl font-semibold text-gray-900">
                ${product.price?.toFixed(2) || 0}
              </p>
              {/* Indicador de Stock */}
              {product.stock !== undefined && (
                <p className={`text-sm md:text-base ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `En stock: ${product.stock} unidades` : 'Sin stock'}
                </p>
              )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleAddToCart}
                  className="bg-custom-blue text-white rounded-2xl hover:bg-blue-600 text-sm md:text-base py-2 px-6 transition-all duration-300"
                  disabled={product.stock === 0}
                >
                  Añadir al Carrito
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Descripción del Producto */}
          {product.description && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8"
            >
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-sm md:text-base text-gray-500">{product.description}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Productos Similares */}
        {similarProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Productos Similares
            </h2>
            <div className="flex overflow-x-auto space-x-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 snap-x snap-mandatory md:snap-none hide-scrollbar">
              {similarProducts.map((similarProduct) => (
                <motion.div
                  key={similarProduct.id}
                  onClick={() => goToProductPage(similarProduct.id)}
                  className="flex-none w-56 md:w-auto bg-white border border-gray-100 rounded-lg flex flex-col cursor-pointer transition-all duration-300 hover:border-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative w-full h-40 md:h-48 bg-gray-50">
                    <img
                      src={similarProduct.image || 'https://via.placeholder.com/300x200?text=Producto'}
                      alt={similarProduct.name || 'Producto sin nombre'}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/300x200?text=Producto')}
                    />
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <h3 className="text-sm md:text-base font-medium text-gray-900">
                      {similarProduct.name || 'Producto sin nombre'}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      ${similarProduct.price?.toFixed(2) || 0}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}