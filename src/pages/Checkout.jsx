// src/pages/Checkout.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Checkout() {
  const { cartItems: cart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'client') {
      toast.error('Solo los clientes pueden realizar pedidos.');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Tu carrito está vacío.');
      return;
    }

    setLoading(true);
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const businessIds = [...new Set(cart.map(item => item.businessId))];
      const items = cart.map(item => ({
        productId: item.id,
        businessId: item.businessId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }));

      const orderData = {
        customerId: user.uid,
        items,
        businessIds,
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      toast.success('Pedido creado con éxito.');
      navigate('/track-client'); // Redirigir a /track-client para clientes
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      toast.error('Error al crear el pedido: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">Finalizar Compra</h2>
      {cart.length === 0 ? (
        <p className="text-gray-500">Tu carrito está vacío.</p>
      ) : (
        <div>
          <ul className="space-y-4">
            {cart.map(item => (
              <li key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="text-sm md:text-base text-gray-900">{item.name}</p>
                  <p className="text-xs md:text-sm text-gray-500">
                    Cantidad: {item.quantity} | Precio: ${item.price.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm md:text-base text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between items-center">
            <p className="text-lg md:text-xl font-semibold text-gray-900">
              Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
            </p>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="bg-custom-blue text-white rounded-2xl hover:bg-blue-600 text-sm md:text-base py-2 px-6 transition-all duration-300 disabled:bg-gray-400"
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}