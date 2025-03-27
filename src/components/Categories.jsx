// src/components/Categories.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Categorías cargadas desde Firestore:', categoriesData);
        setCategories(categoriesData);
        setError(null);
      } catch (error) {
        console.error('Error al cargar las categorías:', error);
        setError('Error al cargar las categorías: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const updateScrollState = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);
      return () => {
        container.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [categories, updateScrollState]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      // Obtener el ancho de una tarjeta y el espaciado
      const firstCard = scrollContainerRef.current.querySelector('a'); // Selecciona la primera tarjeta (Link)
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth; // Ancho de la tarjeta
        const spacing = 24; // space-x-6 en Tailwind = 6 * 4px = 24px (Tailwind usa 4px por unidad)
        const totalWidth = (cardWidth + spacing) * 3; // Ancho total de 3 tarjetas + espaciado
        console.log('Desplazando a la izquierda:', totalWidth);
        scrollContainerRef.current.scrollBy({ left: -totalWidth, behavior: 'smooth' });
      }
    } else {
      console.log('scrollContainerRef.current no está definido');
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      // Obtener el ancho de una tarjeta y el espaciado
      const firstCard = scrollContainerRef.current.querySelector('a'); // Selecciona la primera tarjeta (Link)
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth; // Ancho de la tarjeta
        const spacing = 24; // space-x-6 en Tailwind = 6 * 4px = 24px (Tailwind usa 4px por unidad)
        const totalWidth = (cardWidth + spacing) * 3; // Ancho total de 3 tarjetas + espaciado
        console.log('Desplazando a la derecha:', totalWidth);
        scrollContainerRef.current.scrollBy({ left: totalWidth, behavior: 'smooth' });
      }
    } else {
      console.log('scrollContainerRef.current no está definido');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6 text-center text-custom-blue">Categorías</h2>
      {error ? (
        <p className="text-red-500 mb-4 text-center">{error}</p>
      ) : categories.length > 0 ? (
        <div className="relative">
          {/* Flecha izquierda */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition z-10"
              aria-label="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-6 h-6 text-custom-blue" />
            </button>
          )}

          {/* Contenedor externo para ocultar la barra de desplazamiento */}
          <div className="overflow-hidden">
            {/* Contenedor del carrusel */}
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto space-x-6 py-4 px-2 snap-x snap-mandatory hide-scrollbar"
              style={{
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categories/${category.id}`}
                  className="flex-none w-72 bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition snap-center flex items-center justify-center"
                >
                  <h3 className="text-xl font-semibold text-custom-blue text-center">{category.name}</h3>
                </Link>
              ))}
            </div>
          </div>

          {/* Flecha derecha */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition z-10"
              aria-label="Desplazar a la derecha"
            >
              <ChevronRight className="w-6 h-6 text-custom-blue" />
            </button>
          )}
        </div>
      ) : (
        <p className="text-center">No hay categorías disponibles.</p>
      )}
    </div>
  );
}