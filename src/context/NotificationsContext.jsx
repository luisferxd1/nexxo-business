// src/context/NotificationsContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (loading || !user) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    console.log('Configurando listener de notificaciones para user.uid:', user.uid);
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const notifs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log('Notificaciones recibidas del snapshot:', notifs);
        setNotifications(notifs);
        const unreadCount = notifs.filter((notif) => !notif.read).length;
        setUnreadNotifications(unreadCount);
        console.log('Notificaciones no leídas (contexto):', unreadCount);
      },
      (error) => {
        console.error('Error al escuchar notificaciones:', error);
      }
    );

    return () => {
      console.log('Desuscribiendo el listener de notificaciones');
      unsubscribe();
    };
  }, [user, loading]);

  const addNotification = async (notification) => {
    try {
      const notificationData = {
        userId: notification.userId,
        message: notification.message,
        type: notification.type, // Aseguramos que el type se incluya
        read: false,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'notifications'), notificationData);
      console.log('Notificación agregada en Firestore:', notificationData);
    } catch (error) {
      console.error('Error al agregar la notificación:', error);
      throw error;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadNotifications((prev) => prev - 1);

      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      console.log('Notificación marcada como leída en Firestore:', notificationId);
    } catch (error) {
      console.error('Error al marcar la notificación como leída:', error);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: false } : notif
        )
      );
      setUnreadNotifications((prev) => prev + 1);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadNotifications(0);

      const unreadNotifs = notifications.filter((notif) => !notif.read);
      for (const notif of unreadNotifs) {
        const notificationRef = doc(db, 'notifications', notif.id);
        await updateDoc(notificationRef, { read: true });
      }
      console.log('Todas las notificaciones marcadas como leídas en Firestore');
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          !notif.read ? { ...notif, read: false } : notif
        )
      );
      const unreadCount = notifications.filter((notif) => !notif.read).length;
      setUnreadNotifications(unreadCount);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const notifToDelete = notifications.find((notif) => notif.id === notificationId);
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notif) => notif.id !== notificationId)
      );
      if (!notifToDelete.read) {
        setUnreadNotifications((prev) => prev - 1);
      }

      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('Notificación eliminada:', notificationId);
    } catch (error) {
      console.error('Error al eliminar la notificación:', error);
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        notifications.find((notif) => notif.id === notificationId),
      ]);
      if (!notifications.find((notif) => notif.id === notificationId).read) {
        setUnreadNotifications((prev) => prev + 1);
      }
    }
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, setNotifications, unreadNotifications, addNotification, markAsRead, markAllAsRead, deleteNotification }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}