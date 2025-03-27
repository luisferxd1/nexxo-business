// src/context/NotificationsContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const { user, loading } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (loading || !user) {
      setUnreadNotifications(0);
      return;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const count = snapshot.docs.length;
      console.log('Notificaciones no leídas (contexto):', count); // Depuración
      setUnreadNotifications(count);
    }, (error) => {
      console.error('Error al escuchar notificaciones:', error);
    });

    return () => unsubscribeNotifications();
  }, [user, loading]);

  const markAllAsRead = () => {
    console.log('markAllAsRead ejecutado en el contexto'); // Depuración
    setUnreadNotifications(0);
  };

  return (
    <NotificationsContext.Provider value={{ unreadNotifications, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}