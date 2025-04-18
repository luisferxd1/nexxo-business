// src/components/CustomerStats.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function CustomerStats() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (loading) return;

    if (!user || userRole !== 'business') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      const ordersQuery = query(collection(db, 'orders'), where('businessId', '==', user.uid));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const customerIds = [...new Set(ordersData.map((order) => order.userId))];
      const customersData = await Promise.all(
        customerIds.map(async (userId) => {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : {};
          const customerOrders = ordersData.filter((order) => order.userId === userId);
          return {
            id: userId,
            name: userData.clientInfo?.firstName
              ? `${userData.clientInfo.firstName} ${userData.clientInfo.lastName || ''}`
              : 'Desconocido',
            email: userData.email || 'N/A',
            orderCount: customerOrders.length,
            totalSpent: customerOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          };
        })
      );
      setCustomers(customersData);
    };

    fetchData();
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const topCustomers = [...customers].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
  const averageSpend = customers.length > 0
    ? (customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / customers.length).toFixed(2)
    : 0;

  return (
    <section className="min-h-screen bg-gray-50 px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-custom-blue">
            Estadísticas de Clientes
          </h3>
          <button
            onClick={() => navigate('/business/dashboard')}
            className="bg-custom-blue text-white px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Volver al Dashboard
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h4 className="text-lg font-semibold text-custom-blue mb-4">Clientes Más Frecuentes</h4>
            <ul className="space-y-2">
              {topCustomers.map((customer) => (
                <li key={customer.id} className="flex justify-between text-gray-700">
                  <span>{customer.name}</span>
                  <span className="font-semibold">{customer.orderCount} pedidos</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h4 className="text-lg font-semibold text-custom-blue mb-4">Gasto Promedio por Cliente</h4>
            <p className="text-2xl font-bold text-gray-800">${averageSpend}</p>
          </div>
        </div>
      </div>
    </section>
  );
}