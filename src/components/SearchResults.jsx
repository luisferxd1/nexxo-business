// src/components/SearchResults.jsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from './ui/button';

export default function SearchResults() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const location = useLocation();

  // Obtener el término de búsqueda de la URL
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('query') || '';

  // Cargar productos desde Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);

        // Extraer categorías únicas
        const uniqueCategories = [...new Set(productsData.map((product) => product.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error al cargar los productos:', error);
      }
    };

    fetchProducts();
  }, []);

  // Filtrar productos según la búsqueda, categoría y rango de precio
  useEffect(() => {
    let results = products;

    // Filtrar por término de búsqueda
    if (query) {
      results = results.filter((product) =>
        (product.name || '').toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory) {
      results = results.filter((product) => product.category === selectedCategory);
    }

    // Filtrar por rango de precio
    results = results.filter((product) => {
      const price = product.price || 0;
      return price >= priceRange.min && price <= (priceRange.max === Infinity ? 999999 : priceRange.max);
    });

    setFilteredProducts(results);
  }, [products, query, selectedCategory, priceRange]);

  // Manejar cambios en el rango de precio
  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setPriceRange((prev) => ({
      ...prev,
      [name]: value === '' ? (name === 'min' ? 0 : Infinity) : Number(value),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto py-12"
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-custom-blue">
        Resultados de Búsqueda para "{query || 'Todos los productos'}"
      </h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filtros */}
        <div className="md:w-1/4 bg-white rounded-2xl p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-custom-blue">Filtros</h3>

          {/* Filtro por Categoría */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-custom-blue"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Rango de Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Precio</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="min"
                value={priceRange.min === 0 ? '' : priceRange.min}
                onChange={handlePriceRangeChange}
                placeholder="Mín"
                className="w-1/2 border rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-custom-blue"
              />
              <input
                type="number"
                name="max"
                value={priceRange.max === Infinity ? '' : priceRange.max}
                onChange={handlePriceRangeChange}
                placeholder="Máx"
                className="w-1/2 border rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-custom-blue"
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="md:w-3/4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white"
                >
                  <img
                    src={product.image || 'https://via.placeholder.com/150'}
                    alt={product.name || 'Producto sin nombre'}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-custom-blue">
                      {product.name || 'Producto sin nombre'}
                    </h3>
                    <p className="text-gray-600">${product.price || 0}</p>
                    <p className="text-sm text-gray-500">{product.category || 'Sin categoría'}</p>
                    <Button className="mt-2 w-full bg-custom-blue text-white rounded-2xl hover:bg-blue-600">
                      Ver Detalles
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">No se encontraron productos.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}