// src/components/CustomerOrders.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

export default function CustomerOrders() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (loading) return;

    if (!user || userRole !== 'business') {
      navigate('/');
      return;
    }

    const fetchCustomerData = async () => {
      const userDocRef = doc(db, 'users', customerId);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};
      setCustomer({
        id: customerId,
        name: userData.clientInfo?.firstName
          ? `${userData.clientInfo.firstName} ${userData.clientInfo.lastName || ''}`
          : 'Desconocido',
        email: userData.email || 'N/A',
      });

      const ordersQuery = query(
        collection(db, 'orders'),
        where('businessId', '==', user.uid),
        where('userId', '==', customerId)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    };

    fetchCustomerData();
  }, [user, userRole, loading, navigate, customerId]);

  if (loading || !customer) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <section className="min-h-screen bg-gray-50 px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-custom-blue">
            Pedidos de {customer.name}
          </h3>
          <button
            onClick={() => navigate('/business/dashboard')}
            className="bg-custom-blue text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Volver al Dashboard
          </button>
        </div>
        <p className="text-gray-600 mb-4">Correo: {customer.email}</p>
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-gray-50 flex flex-col gap-3 hover:bg-gray-100 transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p><strong>ID del Pedido:</strong> {order.id}</p>
                  <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                  <p><strong>Fecha:</strong> {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                  <p><strong>Estado:</strong> {order.status}</p>
                </div>
                <p className="text-sm"><strong>Productos:</strong></p>
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
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">Este cliente no tiene pedidos.</p>
          )}
        </div>
      </div>
    </section>
  );
}