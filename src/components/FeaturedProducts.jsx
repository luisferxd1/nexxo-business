// src/components/FeaturedProducts.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '../context/SearchContext';
import { useCart } from '../context/CartContext';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { toast } from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { searchQuery } = useSearch();
  const { addToCart, getCartCount } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Cargar productos y categorías
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);

    // Cargar productos
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error al cargar los productos:', error);
      toast.error('Error al cargar los productos.');
      setIsLoading(false);
    });

    // Cargar categorías
    const categoriesQuery = query(collection(db, 'categories'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesData);
    }, (error) => {
      console.error('Error al cargar las categorías:', error);
      toast.error('Error al cargar las categorías.');
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
    };
  }, [user, authLoading, navigate]);

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product, e) => {
    e.stopPropagation(); // Evita que el clic en el botón active la redirección de la tarjeta
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

  const goToCart = () => {
    navigate('/cart');
  };

  const goToProductPage = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="flex-none w-60 md:w-auto bg-white border rounded-2xl overflow-hidden shadow-md flex flex-col animate-pulse">
      <div className="w-full h-32 md:h-48 bg-gray-200" />
      <div className="p-3 md:p-4 flex-1 flex flex-col space-y-2">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="mt-auto h-8 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm md:text-base">Cargando...</p>
      </div>
    );
  }

  return (
    <section className="py-6 px-3 md:py-12 md:px-4">
      <h3 className="text-xl md:text-3xl font-bold text-center mb-4 md:mb-8 text-custom-blue">
        Productos Destacados
      </h3>

      {/* Filtros */}
      <div className="max-w-5xl mx-auto mb-4 md:mb-6 flex flex-col sm:flex-row gap-2 md:gap-4 justify-between items-center">
        <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-2xl px-2 py-1 md:px-3 md:py-2 text-sm md:text-base text-gray-700 focus:outline-none focus:ring focus:ring-custom-blue w-full sm:w-auto"
          >
            <option value="">Todas las Categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          onClick={goToCart}
          className="bg-custom-blue text-white rounded-2xl px-3 py-1 md:px-4 md:py-2 text-sm md:text-base w-full sm:w-auto" style={{ borderRadius: '16px' }}
        >
          Ver Carrito ({getCartCount()})
        </Button>
      </div>

      {/* Lista de Productos */}
      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="flex overflow-x-auto space-x-4 md:space-x-0 md:grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6 snap-x snap-mandatory md:snap-none hide-scrollbar">
            {[...Array(4)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div
            className="flex overflow-x-auto space-x-4 md:space-x-0 md:grid md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-6 snap-x snap-mandatory md:snap-none hide-scrollbar"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  onClick={() => goToProductPage(product.id)} // Redirige al hacer clic en la tarjeta
                  className="flex-none w-60 md:w-auto bg-white border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow snap-center md:snap-none flex flex-col cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative w-full h-32 md:h-48 bg-gray-100">
                    <img
                      src={product.image || 'https://via.placeholder.com/300x200?text=Producto'}
                      alt={product.name || 'Producto sin nombre'}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/300x200?text=Producto')}
                    />
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <h3 className="text-base md:text-lg font-semibold text-custom-blue">
                      {product.name || 'Producto sin nombre'}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600">
                      Categoría: {categories.find((cat) => cat.id === product.category)?.name || 'Sin categoría'}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600">
                      Precio: ${product.price?.toFixed(2) || 0}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 mt-1 md:mt-2">
                      {product.description || 'Sin descripción'}
                    </p>
                    <Button
                      onClick={(e) => handleAddToCart(product, e)} // Pasa el evento para evitar la redirección
                      className="mt-auto bg-custom-blue text-white rounded-3xl hover:bg-blue-600 text-sm md:text-base py-1 md:py-2" style={{ borderRadius: '16px' }}
                    >
                      Añadir al Carrito
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <p className="text-center text-gray-600 text-sm md:text-base">No se encontraron productos.</p>
        )}
      </div>
    </section>
  );
}