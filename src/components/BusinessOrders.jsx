// src/components/BusinessOrders.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc, addDoc, getDocs } from 'firebase/firestore';
import { FaClock, FaCheckCircle, FaBox, FaTruck, FaFlagCheckered, FaUtensils } from 'react-icons/fa';
import Notifications from './Notifications';
import { Button } from './ui/button';

export default function BusinessOrders() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'business') {
          // Cargar pedidos del negocio en tiempo real
          const ordersQuery = query(
            collection(db, "orders"),
            where("businessId", "==", currentUser.uid)
          );
          const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          });
          return () => unsubscribeOrders();
        } else {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const handleMarkAsPrepared = async (orderId) => {
    try {
      const orderDocRef = doc(db, "orders", orderId);
      const order = orders.find((o) => o.id === orderId);
      const updatedStatusHistory = [
        ...(order.statusHistory || []),
        { status: 'prepared', timestamp: new Date().toISOString() },
      ];
      await updateDoc(orderDocRef, {
        status: 'prepared',
        statusHistory: updatedStatusHistory,
      });

      // Generar notificación para el administrador
      const adminUsers = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
      const adminIds = adminUsers.docs.map((doc) => doc.id);
      for (const adminId of adminIds) {
        await addDoc(collection(db, "notifications"), {
          userId: adminId,
          type: 'order_prepared',
          message: `El pedido #${orderId} ha sido marcado como preparado por el negocio.`,
          orderId: orderId,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      alert("Pedido marcado como preparado con éxito.");
    } catch (error) {
      console.error("Error al marcar pedido como preparado:", error);
      alert("Hubo un error al marcar el pedido como preparado.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'received':
        return <FaCheckCircle className="text-blue-500" />;
      case 'prepared':
        return <FaUtensils className="text-indigo-500" />;
      case 'collected':
        return <FaBox className="text-purple-500" />;
      case 'inTransit':
        return <FaTruck className="text-orange-500" />;
      case 'delivered':
        return <FaFlagCheckered className="text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'received':
        return 'Recibido';
      case 'prepared':
        return 'Preparado';
      case 'collected':
        return 'Recolectado';
      case 'inTransit':
        return 'En Camino';
      case 'delivered':
        return 'Entregado';
      default:
        return status;
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'pending':
        return 20;
      case 'received':
        return 40;
      case 'prepared':
        return 50;
      case 'collected':
        return 60;
      case 'inTransit':
        return 80;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  };

  if (!user) {
    return <p>Cargando...</p>;
  }

  return (
    <section className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Órdenes de Venta</h3>
        <Notifications userId={user.uid} />
      </div>
      <div className="space-y-4">
        <h4 className="font-semibold">Rastrear Pedidos</h4>
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="p-4 border rounded-lg">
              <p><strong>ID del Pedido:</strong> {order.id}</p>
              <p><strong>Cliente ID:</strong> {order.clientId}</p>
              <p><strong>Total:</strong> ${order.total}</p>
              <p><strong>Estado Actual:</strong> {getStatusLabel(order.status)} {getStatusIcon(order.status)}</p>
              {order.status === 'received' && (
                <Button
                  onClick={() => handleMarkAsPrepared(order.id)}
                  className="mt-2"
                >
                  Marcar como Preparado
                </Button>
              )}
              <div className="mt-2">
                <h4 className="font-semibold">Progreso del Pedido</h4>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                        {getProgressPercentage(order.status)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${getProgressPercentage(order.status)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></div>
                  </div>
                </div>
                <h4 className="font-semibold mt-4">Historial de Estados</h4>
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {order.statusHistory.map((entry, index) => (
                      <li key={index} className="flex items-center">
                        {getStatusIcon(entry.status)} {getStatusLabel(entry.status)} -{' '}
                        {new Date(entry.timestamp).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay historial disponible.</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No tienes pedidos para rastrear.</p>
        )}
      </div>
    </section>
  );
}