// src/components/Notifications.jsx
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function Notifications({ embedded = false }) {
  const { user, userRole, loading } = useAuth();
  const { notifications, unreadNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  // Log para depurar las notificaciones recibidas y el rol del usuario
  useEffect(() => {
    console.log('Notifications.jsx - Rol del usuario:', userRole);
    console.log('Notifications.jsx - Notificaciones recibidas:', notifications);
    console.log('Notifications.jsx - Notificaciones no leídas:', unreadNotifications);
  }, [notifications, unreadNotifications, userRole]);

  // Filtrar notificaciones según el rol
  const filteredNotifications = notifications.filter((notification) => {
    const notificationType = notification.type || (userRole === 'admin' ? 'admin' : userRole === 'business' ? 'business' : 'client');

    if (userRole === 'admin') {
      return (
        notificationType === 'admin' ||
        notificationType === 'success' ||
        notificationType === 'error'
      );
    } else if (userRole === 'business') {
      return (
        notificationType === 'business' ||
        notificationType === 'success' ||
        notificationType === 'error'
      );
    } else {
      return (
        notificationType === 'client' ||
        notificationType === 'custom' ||
        notificationType === 'success' ||
        notificationType === 'error'
      );
    }
  });

  // Ordenar las notificaciones de la más reciente a la más antigua
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA; // Orden descendente (más reciente primero)
  });

  // Función para manejar el clic en una notificación
  const handleNotificationClick = (notification) => {
    console.log('Clic en notificación:', notification);
    if (notification.chatId && userRole === 'client') {
      console.log('Redirigiendo a /client con chatId:', notification.chatId);
      markAsRead(notification.id);
      navigate('/client', { state: { openChatId: notification.chatId } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md text-center">
        <p className="text-gray-600 text-sm sm:text-base">Por favor, inicia sesión para ver tus notificaciones.</p>
      </div>
    );
  }

  // Diseño para página independiente (/notifications)
  if (!embedded) {
    return (
      <section className="min-h-screen bg-white px-2 sm:px-4 py-6 sm:py-8 rounded-2xl">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center text-custom-blue">
            Notificaciones
          </h3>
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md">
            {sortedNotifications.length === 0 ? (
              <p className="text-center text-gray-600 text-sm sm:text-base">No tienes notificaciones.</p>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 gap-2">
                  <h4 className="text-base sm:text-lg font-semibold text-custom-blue">
                    Notificaciones ({unreadNotifications} no leídas)
                  </h4>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-custom-blue hover:underline text-xs sm:text-sm font-medium flex items-center"
                    >
                      <Check size={14} className="mr-1" /> Marcar todas como leídas
                    </button>
                  )}
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {sortedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-2 sm:p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 ${
                        notification.read ? 'bg-gray-50' : 'bg-blue-50'
                      } ${notification.chatId && userRole === 'client' ? 'cursor-pointer' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                        {notification.type === 'success' ? (
                          <FaCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                        ) : notification.type === 'error' ? (
                          <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                        ) : (
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-custom-blue flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p
                            className={`font-semibold text-sm sm:text-base ${
                              notification.read ? 'text-gray-600' : 'text-custom-blue'
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-custom-blue hover:underline text-xs sm:text-sm flex items-center"
                          >
                            <Check size={12} className="mr-1 sm:mr-1.5 text-custom-blue" /> Marcar como leída
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-500 hover:underline text-xs sm:text-sm flex items-center"
                        >
                          <Trash2 size={12} className="mr-1 sm:mr-1.5 text-gray-500" /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Diseño para uso embebido (por ejemplo, en Profile.jsx)
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <h4 className="text-base sm:text-lg font-semibold text-custom-blue">Tus Notificaciones</h4>
        {unreadNotifications > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-custom-blue hover:underline text-xs sm:text-sm flex items-center"
          >
            <Check size={12} className="mr-1 sm:mr-1.5" /> Marcar todas como leídas
          </button>
        )}
      </div>
      {sortedNotifications.length === 0 ? (
        <p className="text-gray-600 text-sm sm:text-base">No tienes notificaciones.</p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-2 sm:p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 ${
                notification.read ? 'bg-gray-50' : 'bg-blue-50'
              } ${notification.chatId && userRole === 'client' ? 'cursor-pointer' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                {notification.type === 'success' ? (
                  <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                ) : notification.type === 'error' ? (
                  <FaTimesCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-custom-blue flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-xs sm:text-sm ${
                      notification.read ? 'text-gray-600' : 'text-custom-blue'
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="text-custom-blue hover:underline text-xs sm:text-sm flex items-center"
                  >
                    <Check size={12} className="mr-1 sm:mr-1.5 text-custom-blue" /> Marcar como leída
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="text-gray-500 hover:underline text-xs sm:text-sm flex items-center"
                >
                  <Trash2 size={12} className="mr-1 sm:mr-1.5 text-gray-500" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}