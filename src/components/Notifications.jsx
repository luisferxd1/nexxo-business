// src/components/Notifications.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function Notifications({ embedded = false }) {
  const { user, loading } = useAuth();
  const { markAllAsRead } = useNotifications();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (loading || !user) return;

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      console.log('Notificaciones cargadas:', notifs); // Depuración
    });

    return () => unsubscribe();
  }, [user, loading]);

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((notif) => !notif.read);
      console.log('Notificaciones no leídas a marcar:', unreadNotifications); // Depuración
      for (const notif of unreadNotifications) {
        const notifRef = doc(db, "notifications", notif.id);
        await updateDoc(notifRef, { read: true });
        console.log(`Notificación ${notif.id} marcada como leída`); // Depuración
      }
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      markAllAsRead();
      console.log('Todas las notificaciones marcadas como leídas'); // Depuración
    } catch (error) {
      console.error('Error al marcar las notificaciones como leídas:', error);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Cargando...</div>;
  }

  if (!user) {
    return <p>Por favor, inicia sesión para ver tus notificaciones.</p>;
  }

  // Diseño para página independiente (/notifications)
  if (!embedded) {
    return (
      <section className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Notificaciones</h3>
          {notifications.some((notif) => !notif.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-custom-blue hover:underline"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p>No tienes notificaciones.</p>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg flex items-center space-x-4 ${
                  notification.read ? 'bg-gray-100' : notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {notification.type === 'success' ? (
                  <FaCheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <FaTimesCircle className="w-6 h-6 text-red-500" />
                )}
                <p className="flex-1">{notification.message}</p>
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // Diseño para uso embebido (por ejemplo, en Profile.jsx)
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Notificaciones</h4>
        {notifications.some((notif) => !notif.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-custom-blue hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p>No tienes notificaciones.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 border rounded-lg flex items-center space-x-3 ${
                notification.read ? 'bg-gray-100' : notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              {notification.type === 'success' ? (
                <FaCheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <FaTimesCircle className="w-5 h-5 text-red-500" />
              )}
              <p className="flex-1 text-sm">{notification.message}</p>
              <button
                onClick={() => handleDeleteNotification(notification.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}