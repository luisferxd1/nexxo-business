// src/components/AdCarousel.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdCarousel() {
  const ads = [
    {
      image: 'https://via.placeholder.com/1200x200?text=Anuncio+1',
      alt: 'Anuncio 1',
      title: '¡Oferta Especial!',
      description: '20% de descuento en toda la tienda.',
      link: '#',
    },
    {
      image: 'https://via.placeholder.com/1200x200?text=Anuncio+2',
      alt: 'Anuncio 2',
      title: 'Nuevo Producto',
      description: 'Descubre nuestra última colección.',
      link: '#',
    },
    {
      image: 'https://via.placeholder.com/1200x200?text=Anuncio+3',
      alt: 'Anuncio 3',
      title: 'Envío Gratis',
      description: 'En compras superiores a $50.',
      link: '#',
    },
  ];

  const [currentAd, setCurrentAd] = useState(0);

  // Rotar anuncios cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const goToPrevious = () => {
    setCurrentAd((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const goToNext = () => {
    setCurrentAd((prev) => (prev + 1) % ads.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 pt-0 relative"
    >
      <a href={ads[currentAd].link} target="_blank" rel="noopener noreferrer">
        <div className="relative">
          <img
            src={ads[currentAd].image}
            alt={ads[currentAd].alt}
            className="w-full h-32 md:h-48 object-cover rounded-2xl shadow-md"
          />
          <div className="absolute bottom-0 left-0 p-4 bg-black bg-opacity-50 text-white rounded-bl-2xl">
            <h3 className="text-sm md:text-lg font-semibold">{ads[currentAd].title}</h3>
            <p className="text-xs md:text-sm">{ads[currentAd].description}</p>
          </div>
        </div>
      </a>
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
      >
        <ChevronLeft className="w-5 h-5 text-custom-blue" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition"
      >
        <ChevronRight className="w-5 h-5 text-custom-blue" />
      </button>
    </motion.div>
  );
}