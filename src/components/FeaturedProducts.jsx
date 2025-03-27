// src/components/FeaturedProducts.jsx
import { useEffect, useState } from 'react';
import { useSearch } from '../context/SearchContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const { searchQuery } = useSearch();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (error) {
        console.error('Error al cargar los productos:', error);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    (product.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span>Producto agregado con éxito</span>
      </div>,
      {
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #10b981',
        },
        icon: null, // Desactivamos el ícono por defecto de react-hot-toast
      }
    );
  };

  return (
    <section className="py-12">
      <h2 className="text-3xl font-bold text-center mb-8">Productos Destacados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={product.image || 'https://via.placeholder.com/150'}
                alt={product.name || 'Producto sin nombre'}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">{product.name || 'Producto sin nombre'}</h3>
                <p className="text-gray-600">${product.price || 0}</p>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-600"
                >
                  Añadir al Carrito
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full">No se encontraron productos.</p>
        )}
      </div>
    </section>
  );
}