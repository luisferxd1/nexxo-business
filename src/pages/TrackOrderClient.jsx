import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function TrackOrderClient() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('TrackOrderClient - Usuario:', user);
    console.log('TrackOrderClient - Rol del usuario:', userRole);
    console.log('TrackOrderClient - Estado de carga:', loading);

    if (loading) return;

    if (!user || userRole !== 'client') {
      toast.error('Debes ser un cliente para rastrear tus pedidos.');
      navigate('/login');
      return;
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid)
    );

    console.log('TrackOrderClient - UID del usuario:', user.uid);
    console.log('TrackOrderClient - Consulta de pedidos:', ordersQuery);

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setIsLoading(false);
        console.log('TrackOrderClient - Pedidos del cliente:', ordersData);
      },
      (err) => {
        console.error('TrackOrderClient - Error al cargar los pedidos:', err);
        setError(
          err.message.includes('Missing or insufficient permissions')
            ? 'No tienes permiso para ver tus pedidos. Verifica tu cuenta o contacta al soporte.'
            : 'Error al cargar los pedidos: ' + err.message
        );
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userRole, loading, navigate]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-base sm:text-lg text-gray-700">Cargando pedidos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-red-500 text-sm md:text-base">{error}</p>
      </div>
    );
  }

  return (
    <section className="p-6 md:p-12 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-500 text-sm md:text-base hover:text-custom-blue transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Volver</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Mis Pedidos
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-2">
            Aquí puedes ver el estado de tus pedidos.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-2 md:mb-0">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900">
                        Pedido #{order.id}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500">
                        Fecha: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <div className="mt-2">
                        <h4 className="text-xs md:text-sm font-medium text-gray-700">Productos:</h4>
                        <ul className="list-disc list-inside text-xs md:text-sm text-gray-600">
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.name} - Cantidad: {item.quantity} - Precio: ${item.price} (Negocio: {item.businessId})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs md:text-sm font-medium px-2 py-1 rounded-full ${
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800 line-through' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'ready_for_pickup' ? 'bg-green-100 text-green-800' :
                          order.status === 'picked_up' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'on_the_way' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status === 'cancelled' ? 'Cancelado' :
                         order.status === 'pending' ? 'Pendiente' :
                         order.status === 'preparing' ? 'En Preparación' :
                         order.status === 'ready_for_pickup' ? 'Listo para recolectar' :
                         order.status === 'picked_up' ? 'Recolectado' :
                         order.status === 'on_the_way' ? 'En camino' :
                         order.status === 'delivered' ? 'Entregado' :
                         'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white border border-gray-100 rounded-lg shadow-sm">
              <p className="text-gray-500 text-base md:text-lg font-medium">
                No tienes pedidos para rastrear en este momento.
              </p>
              <p className="text-gray-400 text-sm md:text-base mt-2">
                Realiza un pedido para verlo aquí.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}