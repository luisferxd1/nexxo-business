import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function TrackOrder() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
      }, (err) => {
        setError('Error al cargar los pedidos: ' + err.message);
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (!user) {
    return <p className="text-center mt-10">Por favor, inicia sesión para rastrear tus pedidos.</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center mt-10">{error}</p>;
  }

  return (
    <section className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Rastrea tus Pedidos</h2>
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 shadow-md">
              <p><strong>ID del pedido:</strong> {order.id}</p>
              <p><strong>Estado:</strong> {order.status || 'Pendiente'}</p>
              <p><strong>Productos:</strong></p>
              <ul className="list-disc pl-5">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} - Cantidad: {item.quantity}
                    </li>
                  ))
                ) : (
                  <li>No hay productos</li>
                )}
              </ul>
              <p><strong>Dirección de entrega:</strong> {order.addressLabel || ''} - {order.address || ''}, {order.district || ''}, {order.department || ''} (Ref: {order.referencePoint || 'N/A'})</p>
              <p><strong>Fecha de entrega estimada:</strong> {order.deliveryDate || 'N/A'}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No tienes pedidos actualmente.</p>
      )}
    </section>
  );
}