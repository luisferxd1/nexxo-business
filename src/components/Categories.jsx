// src/components/Categories.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Categories({ isHeader = false, showProducts = false }) {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);

  // Variables para manejar el arrastre
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  // Cargar categorías desde Firebase
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const categoriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setError('Error al cargar las categorías: ' + err.message);
        setLoading(false);
      }
    }, (err) => {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar las categorías: ' + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Cargar productos destacados (los 4 más recientes)
  useEffect(() => {
    if (!showProducts || isHeader) return;

    const fetchFeaturedProducts = async () => {
      try {
        const productsQuery = query(
          collection(db, 'products'),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeaturedProducts(productsData);
      } catch (err) {
        console.error('Error al cargar productos destacados:', err);
        setError('Error al cargar los productos destacados: ' + err.message);
      }
    };

    fetchFeaturedProducts();
  }, [showProducts, isHeader]);

  // Actualizar estado de los botones de desplazamiento
  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Funciones para desplazamiento
  const scrollLeft = () => {
    if (scrollRef.current) {
      const categoryWidth = scrollRef.current.querySelector('a')?.offsetWidth || 150;
      scrollRef.current.scrollBy({ left: -(categoryWidth + 16), behavior: 'smooth' }); // Ajustado a space-x-4 (16px)
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const categoryWidth = scrollRef.current.querySelector('a')?.offsetWidth || 150;
      scrollRef.current.scrollBy({ left: categoryWidth + 16, behavior: 'smooth' });
    }
  };

  // Manejar arrastre con mouse
  const handleMouseDown = (e) => {
    if (scrollRef.current) {
      setIsDragging(true);
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setScrollLeftStart(scrollRef.current.scrollLeft);
      scrollRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
    updateScrollButtons();
  };

  // Manejar deslizamiento con touch
  const handleTouchStart = (e) => {
    if (scrollRef.current) {
      setIsDragging(true);
      setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
      setScrollLeftStart(scrollRef.current.scrollLeft);
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    updateScrollButtons();
  };

  // Actualizar botones al cargar y al desplazar
  useEffect(() => {
    updateScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', updateScrollButtons);
    }
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm md:text-base text-gray-500">Cargando categorías...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-red-500 text-sm md:text-base">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={isHeader ? 'py-1' : 'py-3 md:py-1'} // Ajustado para coincidir con BusinessCarousel
    >
      <div className="max-w-7xl mx-auto px-3 md:px-3"> {/* Ajustado para coincidir con BusinessCarousel */}
        {/* Mostrar título solo si no está en el header */}
        {!isHeader && (
          <div className="flex justify-between items-center mb-4">
          </div>
        )}

        {/* Contenedor de categorías con botones flotantes */}
        <div className="relative">
          {/* Botón de desplazamiento izquierdo */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10
                ${isHeader ? 'w-8 h-8' : 'w-8 h-8 md:w-8 md:h-8'} 
                rounded-full bg-custom-blue text-white flex items-center justify-center
                shadow-lg hover:bg-blue-700 transition-all duration-300 opacity-70 hover:opacity-100`}
            >
              <ChevronLeft className={isHeader ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} />
            </button>
          )}

          {/* Lista de categorías */}
          <div
            ref={scrollRef}
            className={`flex space-x-4 overflow-x-auto snap-x snap-mandatory ${
              isHeader ? 'py-1' : 'py-2'
            } scrollbar-hidden cursor-grab select-none`} // Ajustado space-x-3 a space-x-4
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className={`flex-shrink-0 snap-center font-medium transition-all duration-300 ${
                  isHeader
                    ? 'px-3 py-1 text-sm rounded-xl bg-white shadow-sm hover:shadow-md text-black border border-gray-200'
                    : 'px-4 py-2 text-base rounded-2xl bg-black bg-opacity-95 backdrop-blur-md text-white border border-white border-opacity-20 shadow-sm hover:bg-opacity-85'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Botón de desplazamiento derecho */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10
                ${isHeader ? 'w-8 h-8' : 'w-8 h-8 md:w-8 md:h-8'} 
                rounded-full bg-custom-blue text-white flex items-center justify-center
                shadow-lg hover:bg-blue-700 transition-all duration-300 opacity-70 hover:opacity-100`}
            >
              <ChevronRight className={isHeader ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} />
            </button>
          )}
        </div>

        {/* Productos destacados (no se muestra si isHeader es true) */}
        {showProducts && !isHeader && (
          <div className="mt-6">
            <h3 className="text-lg md:text-xl font-semibold text-custom-blue mb-4">
              Productos Destacados
            </h3>
            {featuredProducts.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
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
                {featuredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to={`/product/${product.id}`}
                      className="bg-white rounded-xl shadow-md p-4 hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                    >
                      <div className="relative w-full h-40 md:h-48 mb-4">
                        <img
                          src={product.image || 'https://via.placeholder.com/150'}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
                        />
                      </div>
                      <div className="flex flex-col flex-grow">
                        <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 line-clamp-2 mb-2 flex-grow">
                          {product.description}
                        </p>
                        <p className="text-sm md:text-base font-bold text-custom-blue mt-auto">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-gray-500 text-center">
                No hay productos destacados disponibles.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}