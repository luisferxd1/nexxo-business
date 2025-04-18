// src/components/OrderHistory.jsx (ejemplo)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import OrderReview from './OrderReview';

export default function OrderHistory() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (loading) return;

    if (!user || userRole !== 'client') {
      navigate('/login');
      return;
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
      },
      (error) => {
        console.error('Error al cargar el historial de pedidos:', error);
      }
    );

    return () => unsubscribe();
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-custom-blue mb-4">Historial de Pedidos</h2>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-4 bg-white rounded-2xl shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                <p><strong>ID del Pedido:</strong> {order.id}</p>
                <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                <p><strong>Estado:</strong> {order.status}</p>
                <p><strong>Fecha:</strong> {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              <p className="text-sm mt-2"><strong>Productos:</strong></p>
              <ul className="list-disc pl-5 text-sm">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} - Cantidad: {item.quantity} - Precio: ${item.price.toFixed(2)}
                    </li>
                  ))
                ) : (
                  <li>No hay productos</li>
                )}
              </ul>
              {order.status === 'Entregado' && (
                <OrderReview orderId={order.id} businessId={order.businessIds[0]} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No tienes pedidos en tu historial.</p>
      )}
    </div>
  );
}