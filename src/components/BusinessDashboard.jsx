// src/components/BusinessDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore'; // Eliminamos 'addDoc'
import { FaClock, FaCheckCircle, FaBox, FaTruck, FaFlagCheckered, FaUtensils } from 'react-icons/fa';
import { Button } from './ui/button';

export default function BusinessDashboard() {
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
        navigate('/');
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

  if (!user) {
    return <p>Cargando...</p>;
  }

  return (
    <section className="p-6">
      <h3 className="text-xl font-semibold mb-4">Dashboard del Negocio</h3>
      <div className="space-y-4">
        <h4 className="font-semibold">Pedidos Recientes</h4>
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
            </div>
          ))
        ) : (
          <p>No tienes pedidos recientes.</p>
        )}
      </div>
    </section>
  );
}