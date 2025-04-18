import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Package } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function TrackOrder() {
  const { user, userRole, loading } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (userRole !== 'business') {
      navigate('/');
      return;
    }

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const ordersQuery = query(
          collection(db, 'orders'),
          where('businessIds', 'array-contains', user.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        const ordersList = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Ordenar pedidos de más reciente a más antiguo
        const sortedOrders = ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        toast.error('Error al cargar los pedidos: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, userRole, loading, navigate]);

  const handleStatusChange = async (orderId, customerId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });

      // Mapear el estado a su texto en español para la notificación
      const statusText =
        newStatus === 'cancelled' ? 'Cancelado' :
        newStatus === 'pending' ? 'Pendiente' :
        newStatus === 'preparing' ? 'En Preparación' :
        newStatus === 'ready_for_pickup' ? 'Listo para recolectar' :
        newStatus === 'picked_up' ? 'Recolectado' :
        newStatus === 'on_the_way' ? 'En camino' :
        'Entregado';

      await addNotification({
        userId: customerId,
        message: `Tu pedido #${orderId} ha sido actualizado a "${statusText}".`,
        type: 'client',
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success('Estado del pedido actualizado correctamente.');
      toast.success('Notificación enviada al cliente.');
    } catch (error) {
      console.error('Error al actualizar el estado del pedido:', error);
      toast.error('Error al actualizar el estado: ' + error.message);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-6 h-6 text-custom-blue animate-spin" />
          <p className="text-lg text-gray-600 font-medium">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white p-4 md:p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-custom-blue text-center">
          Rastrear Pedidos
        </h2>
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 bg-white rounded-2xl shadow-md"
          >
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-base md:text-lg font-medium">
              No tienes pedidos para rastrear.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-md p-4 md:p-6"
              >
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  Pedido #{order.id}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  Fecha: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm md:text-base text-gray-600">
                  Cliente: {order.userEmail}
                </p>
                <p className="text-sm md:text-base text-gray-600">
                  Estado:{' '}
                  <span className={order.status === 'cancelled' ? 'line-through' : ''}>
                    {order.status === 'cancelled' ? 'Cancelado' :
                     order.status === 'pending' ? 'Pendiente' :
                     order.status === 'preparing' ? 'En Preparación' :
                     order.status === 'ready_for_pickup' ? 'Listo para recolectar' :
                     order.status === 'picked_up' ? 'Recolectado' :
                     order.status === 'on_the_way' ? 'En camino' :
                     'Entregado'}
                  </span>
                </p>
                <div className="mt-4">
                  <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
                    Productos:
                  </h4>
                  <ul className="space-y-2">
                    {order.items.map((item, index) => (
                      <li key={index} className="text-sm md:text-base text-gray-600">
                        {item.name} - Cantidad: {item.quantity} - Precio: ${item.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'pending')}
                    className={`text-sm md:text-base ${order.status === 'pending' ? 'bg-gray-300' : 'bg-custom-blue hover:bg-blue-700'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'pending'}
                  >
                    Pendiente
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'preparing')}
                    className={`text-sm md:text-base ${order.status === 'preparing' ? 'bg-gray-300' : 'bg-custom-blue hover:bg-blue-700'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'preparing'}
                  >
                    En Preparación
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'ready_for_pickup')}
                    className={`text-sm md:text-base ${order.status === 'ready_for_pickup' ? 'bg-gray-300' : 'bg-custom-blue hover:bg-blue-700'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'ready_for_pickup'}
                  >
                    Listo para recolectar
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'picked_up')}
                    className={`text-sm md:text-base ${order.status === 'picked_up' ? 'bg-gray-300' : 'bg-custom-blue hover:bg-blue-700'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'picked_up'}
                  >
                    Recolectado
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'on_the_way')}
                    className={`text-sm md:text-base ${order.status === 'on_the_way' ? 'bg-gray-300' : 'bg-custom-blue hover:bg-blue-700'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'on_the_way'}
                  >
                    En camino
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'delivered')}
                    className={`text-sm md:text-base ${order.status === 'delivered' ? 'bg-gray-300' : 'bg-custom-blue hover:bg-blue-700'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'delivered'}
                  >
                    Entregado
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(order.id, order.customerId, 'cancelled')}
                    className={`text-sm md:text-base ${order.status === 'cancelled' ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600'} text-white py-2 px-4 rounded-lg`}
                    disabled={order.status === 'cancelled'}
                  >
                    Cancelado
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}