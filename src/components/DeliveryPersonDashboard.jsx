import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot, query, collection, where, getDoc, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { User, Phone, MapPin, Package, CheckCircle, XCircle, ToggleLeft, ToggleRight, History, Navigation } from 'lucide-react';
import { Button } from './ui/button';

// Configuración de la API de Google Maps
const libraries = ['places'];

const ActiveOrderItem = ({ order, currentLocation, setCurrentLocation, onMarkAsDelivered, onCancelOrder, googleMapsLoaded }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const defaultCenter = {
    lat: 13.7183, // Centro de Sonsonate, El Salvador
    lng: -89.7228,
  };

  // Definir íconos personalizados solo si la API de Google Maps está cargada
  const deliveryIcon = googleMapsLoaded
    ? {
        url: 'https://cdn-icons-png.flaticon.com/512/3097/3097997.png', // Ícono de motocicleta
        scaledSize: new window.google.maps.Size(40, 40),
      }
    : null;

  const customerIcon = googleMapsLoaded
    ? {
        url: 'https://cdn-icons-png.flaticon.com/512/3097/3097995.png', // Ícono de casa
        scaledSize: new window.google.maps.Size(40, 40),
      }
    : null;

  const directionsService = googleMapsLoaded ? new window.google.maps.DirectionsService() : null;
  const [directions, setDirections] = useState(null);

  // Actualización en tiempo real de la ubicación del repartidor
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está soportada en este dispositivo.', {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
      },
      (error) => {
        console.error('Error al obtener la ubicación en tiempo real:', error);
        toast.error('No se pudo obtener tu ubicación en tiempo real: ' + error.message, {
          style: {
            background: '#EF4444',
            color: '#FFFFFF',
          },
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setCurrentLocation]);

  // Calcular la ruta
  useEffect(() => {
    if (!googleMapsLoaded || !directionsService) return;

    const areCoordinatesValid = (location) => {
      return location && typeof location.lat === 'number' && typeof location.lng === 'number' && location.lat !== 0 && location.lng !== 0;
    };

    if (
      currentLocation &&
      areCoordinatesValid(currentLocation) &&
      order.businessLocation &&
      areCoordinatesValid(order.businessLocation) &&
      order.customerLocation &&
      areCoordinatesValid(order.customerLocation)
    ) {
      const waypoints = [
        {
          location: new window.google.maps.LatLng(order.businessLocation.lat, order.businessLocation.lng),
          stopover: true,
        },
      ];

      directionsService.route(
        {
          origin: new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng),
          destination: new window.google.maps.LatLng(order.customerLocation.lat, order.customerLocation.lng),
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          } else {
            console.error('Error al calcular la ruta:', status);
            toast.error('No se pudo calcular la ruta. Verifica las ubicaciones.');
          }
        }
      );
    } else {
      console.warn('No se puede calcular la ruta: una o más ubicaciones son inválidas.', {
        currentLocation,
        businessLocation: order.businessLocation,
        customerLocation: order.customerLocation,
      });
      toast.error('Faltan ubicaciones válidas para calcular la ruta.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, order.businessLocation, order.customerLocation, googleMapsLoaded, directionsService]);

  if (!googleMapsLoaded) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-xl">
        <p className="text-gray-600 text-base">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-gray-300 rounded-xl p-4 shadow-sm bg-gray-50"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">
            Pedido #{order.id}
          </h3>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded-full ${
            order.status === 'picked_up'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-blue-100 text-blue-800'
          }`}
        >
          {order.status === 'picked_up' ? 'Recolectado' : 'En Camino'}
        </span>
      </div>
      <div className="space-y-2 text-sm text-gray-800">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-gray-700" />
          <p className="truncate">
            <span className="font-medium">Dirección de Entrega:</span>{' '}
            {order.customerAddress}
          </p>
        </div>
        <p>
          <span className="font-medium">Negocio:</span> {order.businessName}
        </p>
        <p>
          <span className="font-medium">Cliente:</span> {order.customerName}
        </p>
        <p>
          <span className="font-medium">Fecha:</span>{' '}
          {order.createdAt
            ? format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: es })
            : 'No disponible'}
        </p>
        <div className="space-y-2">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={currentLocation && currentLocation.lat ? currentLocation : defaultCenter}
            zoom={14}
          >
            {currentLocation && currentLocation.lat && (
              <Marker
                position={currentLocation}
                label="Tú"
                icon={deliveryIcon}
              />
            )}
            {order.customerLocation && order.customerLocation.lat && (
              <Marker
                position={order.customerLocation}
                label="Cliente"
                icon={customerIcon}
              />
            )}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: {
                    strokeColor: '#1D4ED8', // Color azul para la ruta
                    strokeWeight: 6, // Línea más gruesa para mejor visibilidad
                  },
                }}
              />
            )}
          </GoogleMap>
          {/* Mostrar ubicaciones exactas */}
          <div className="text-sm text-gray-600">
            {currentLocation && currentLocation.lat && (
              <p>
                <span className="font-medium">Tu ubicación:</span> Lat {currentLocation.lat.toFixed(4)}, Lng {currentLocation.lng.toFixed(4)}
              </p>
            )}
            {order.customerLocation && order.customerLocation.lat && (
              <p>
                <span className="font-medium">Ubicación del cliente:</span> Lat {order.customerLocation.lat.toFixed(4)}, Lng {order.customerLocation.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button
          onClick={() => onMarkAsDelivered(order.id)}
          className="flex-1 bg-green-600 text-white hover:bg-green-700 rounded-2xl px-4 py-2 text-sm transition-colors"
        >
          <CheckCircle className="w-5 h-5 mr-2" /> Entregado
        </Button>
        <Button
          onClick={() => onCancelOrder(order.id)}
          className="flex-1 bg-red-600 text-white hover:bg-red-700 rounded-2xl px-4 py-2 text-sm transition-colors"
        >
          <XCircle className="w-5 h-5 mr-2" /> Cancelar
        </Button>
      </div>
    </motion.div>
  );
};

const DeliveryPersonDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);
  const [hasAcceptedOrder, setHasAcceptedOrder] = useState(false);

  // Cargar la API de Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Usa una variable de entorno
    libraries,
  });

  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const defaultCenter = {
    lat: 13.7183, // Centro de Sonsonate, El Salvador
    lng: -89.7228,
  };

  // Definir ícono personalizado para el repartidor solo si la API está cargada
  const deliveryIcon = isLoaded
    ? {
        url: 'https://cdn-icons-png.flaticon.com/512/3097/3097997.png',
        scaledSize: new window.google.maps.Size(40, 40),
      }
    : null;

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está soportada en este dispositivo.', {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = { lat: latitude, lng: longitude };
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            location: location,
            locationUpdatedAt: new Date().toISOString(),
          });
          setCurrentLocation(location);
        } catch (error) {
          console.error('Error al actualizar la ubicación automáticamente:', error);
          toast.error('Error al actualizar la ubicación: ' + error.message, {
            style: {
              background: '#EF4444',
              color: '#FFFFFF',
            },
          });
        }
      },
      (error) => {
        console.error('Error al obtener la ubicación automáticamente:', error);
        toast.error('No se pudo obtener tu ubicación: ' + error.message, {
          style: {
            background: '#EF4444',
            color: '#FFFFFF',
          },
        });
      }
    );
  }, [user.uid]);

  useEffect(() => {
    if (!user) {
      setError('Usuario no autenticado.');
      setLoading(false);
      navigate('/login');
      return;
    }

    setLoading(true);

    const checkUserRole = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('No se encontró el documento del usuario en la colección users.');
        }
        const userData = userDoc.data();
        if (userData.role !== 'deliveryPerson') {
          throw new Error('No tienes permiso para acceder a esta página. Debes ser un repartidor (deliveryPerson).');
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
        navigate('/profile');
        return false;
      }
      return true;
    };

    const loadData = async () => {
      const hasCorrectRole = await checkUserRole();
      if (!hasCorrectRole) return;

      const userRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setProfile(data);
          setIsOnline(data.status === 'online');
          setCurrentLocation(data.location || null);
        } else {
          toast.error('No se encontró el perfil del usuario.');
          setError('No se encontró el perfil del usuario.');
        }
        setLoading(false);
      }, (error) => {
        toast.error('Error al cargar el perfil: ' + error.message);
        setError('Error al cargar el perfil: ' + error.message);
        setLoading(false);
      });

      const activeOrdersQuery = query(
        collection(db, 'orders'),
        where('deliveryPersonId', '==', user.uid),
        where('status', 'in', ['picked_up', 'on_the_way'])
      );
      const unsubscribeActiveOrders = onSnapshot(activeOrdersQuery, async (snapshot) => {
        try {
          const ordersData = await Promise.all(
            snapshot.docs.map(async (orderDoc) => {
              const orderData = { id: orderDoc.id, ...orderDoc.data() };
              
              const customerDocRef = doc(db, 'users', orderData.customerId);
              const customerDoc = await getDoc(customerDocRef);
              const customerData = customerDoc.exists() ? customerDoc.data() : {};

              let customerLocation = { lat: 0, lng: 0 };
              if (customerData.addresses && Array.isArray(customerData.addresses)) {
                const matchingAddress = customerData.addresses.find(
                  (addr) => addr.address === orderData.deliveryAddress
                );
                if (matchingAddress && matchingAddress.location) {
                  customerLocation = matchingAddress.location;
                }
              }

              let businessName = 'Desconocido';
              let businessLocation = { lat: 0, lng: 0 };
              if (orderData.businessIds && orderData.businessIds.length > 0) {
                const businessDocRef = doc(db, 'users', orderData.businessIds[0]);
                const businessDoc = await getDoc(businessDocRef);
                const businessData = businessDoc.exists() ? businessDoc.data() : {};
                businessName = businessData.clientInfo?.firstName
                  ? `${businessData.clientInfo.firstName} ${businessData.clientInfo.lastName || ''}`
                  : 'Desconocido';
                if (businessData.addresses && Array.isArray(businessData.addresses) && businessData.addresses.length > 0) {
                  businessLocation = businessData.addresses[0].location || { lat: 0, lng: 0 };
                }
              }

              return {
                ...orderData,
                customerName: customerData.clientInfo?.firstName
                  ? `${customerData.clientInfo.firstName} ${customerData.clientInfo.lastName || ''}`
                  : 'Desconocido',
                customerLocation: customerLocation,
                customerAddress: orderData.deliveryAddress || 'No disponible',
                businessName,
                businessLocation,
              };
            })
          );
          setActiveOrders(ordersData);
          setHasAcceptedOrder(ordersData.length > 0);
        } catch (error) {
          toast.error('Error al cargar pedidos activos: ' + error.message);
          setError('Error al cargar pedidos activos: ' + error.message);
        }
      }, (error) => {
        toast.error('Error al cargar pedidos activos: ' + error.message);
        setError('Error al cargar pedidos activos: ' + error.message);
      });

      const completedOrdersQuery = query(
        collection(db, 'orders'),
        where('deliveryPersonId', '==', user.uid),
        where('status', '==', 'delivered')
      );
      const unsubscribeCompletedOrders = onSnapshot(completedOrdersQuery, async (snapshot) => {
        try {
          const ordersData = await Promise.all(
            snapshot.docs.map(async (orderDoc) => {
              const orderData = { id: orderDoc.id, ...orderDoc.data() };
              
              const customerDocRef = doc(db, 'users', orderData.customerId);
              const customerDoc = await getDoc(customerDocRef);
              const customerData = customerDoc.exists() ? customerDoc.data() : {};

              let businessName = 'Desconocido';
              if (orderData.businessIds && orderData.businessIds.length > 0) {
                const businessDocRef = doc(db, 'users', orderData.businessIds[0]);
                const businessDoc = await getDoc(businessDocRef);
                const businessData = businessDoc.exists() ? businessDoc.data() : {};
                businessName = businessData.clientInfo?.firstName
                  ? `${businessData.clientInfo.firstName} ${businessData.clientInfo.lastName || ''}`
                  : 'Desconocido';
              }

              return {
                ...orderData,
                customerName: customerData.clientInfo?.firstName
                  ? `${customerData.clientInfo.firstName} ${customerData.clientInfo.lastName || ''}`
                  : 'Desconocido',
                businessName,
              };
            })
          );
          setCompletedOrders(ordersData);
        } catch (error) {
          toast.error('Error al cargar pedidos completados: ' + error.message);
          setError('Error al cargar pedidos completados: ' + error.message);
        }
      }, (error) => {
        toast.error('Error al cargar pedidos completados: ' + error.message);
        setError('Error al cargar pedidos completados: ' + error.message);
      });

      let locationInterval;
      if (isOnline) {
        updateLocation();
        locationInterval = setInterval(() => {
          updateLocation();
        }, 60 * 1000);
      }

      return () => {
        unsubscribeProfile();
        unsubscribeActiveOrders();
        unsubscribeCompletedOrders();
        if (locationInterval) clearInterval(locationInterval);
      };
    };

    loadData();
  }, [user, navigate, isOnline, updateLocation]);

  const handleToggleStatus = async () => {
    if (!profile) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const newStatus = isOnline ? 'offline' : 'online';
      await updateDoc(userRef, {
        status: newStatus,
        availability: newStatus === 'online',
      });
      setIsOnline(!isOnline);
      toast.success(`Estado actualizado a ${newStatus === 'online' ? 'En Línea' : 'Desconectado'}`, {
        style: {
          background: newStatus === 'online' ? '#10B981' : '#EF4444',
          color: '#FFFFFF',
        },
      });
    } catch (error) {
      toast.error('Error al actualizar el estado: ' + error.message, {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
    }
  };

  const handleUpdateLocation = () => {
    updateLocation();
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const order = activeOrders.find(o => o.id === orderId);

      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: order.customerId,
        type: 'client',
        message: `Tu pedido #${orderId} ha sido entregado.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (order.businessIds && order.businessIds.length > 0) {
        await addDoc(collection(db, 'notifications'), {
          userId: order.businessIds[0],
          type: 'business',
          message: `El pedido #${orderId} ha sido entregado por el repartidor.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      toast.success('Pedido marcado como entregado.', {
        style: {
          background: '#10B981',
          color: '#FFFFFF',
        },
      });
      setHasAcceptedOrder(false);
    } catch (error) {
      toast.error('Error al actualizar el pedido: ' + error.message, {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const order = activeOrders.find(o => o.id === orderId);

      await updateDoc(orderRef, {
        status: 'cancelled',
        deliveryPersonId: null,
      });

      await addDoc(collection(db, 'notifications'), {
        userId: order.customerId,
        type: 'client',
        message: `Tu pedido #${orderId} ha sido cancelado por el repartidor.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      if (order.businessIds && order.businessIds.length > 0) {
        await addDoc(collection(db, 'notifications'), {
          userId: order.businessIds[0],
          type: 'business',
          message: `El pedido #${orderId} ha sido cancelado por el repartidor y necesita ser reasignado.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      toast.success('Pedido cancelado exitosamente.', {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
      setHasAcceptedOrder(false);
    } catch (error) {
      toast.error('Error al cancelar el pedido: ' + error.message, {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 text-base">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-red-600 text-base">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-600 text-base">No se encontró el perfil.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-red-600 text-base">Error al cargar el mapa: {loadError.message}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 max-w-4xl mx-auto min-h-screen bg-gray-100"
    >
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900">
        Dashboard del Repartidor
      </h1>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Mi Perfil</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-gray-700" />
            <p className="text-base text-gray-800">
              <span className="font-medium">Nombre:</span> {profile.name || 'No disponible'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6 text-gray-700" />
            <p className="text-base text-gray-800">
              <span className="font-medium">Teléfono:</span> {profile.phone || 'No disponible'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-medium text-base text-gray-800">Estado:</span>
            <Button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition-colors ${
                isOnline
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isOnline ? (
                <>
                  <ToggleRight className="w-5 h-5" /> En Línea
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" /> Desconectado
                </>
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleUpdateLocation}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors"
            >
              <Navigation className="w-5 h-5" /> Actualizar Ubicación
            </Button>
            {currentLocation && !hasAcceptedOrder && isLoaded ? (
              <>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={currentLocation || defaultCenter}
                  zoom={15}
                >
                  <Marker
                    position={currentLocation}
                    label="Tú"
                    icon={deliveryIcon}
                  />
                </GoogleMap>
                <p className="text-sm text-gray-600">
                  Ubicación actual: Lat {currentLocation.lat.toFixed(4)}, Lng {currentLocation.lng.toFixed(4)}
                </p>
              </>
            ) : (
              !hasAcceptedOrder && (
                <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-xl">
                  <p className="text-gray-600 text-base">Cargando mapa...</p>
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Pedidos Activos</h2>
        {activeOrders.length > 0 ? (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <ActiveOrderItem
                key={order.id}
                order={order}
                currentLocation={currentLocation}
                setCurrentLocation={setCurrentLocation}
                onMarkAsDelivered={handleMarkAsDelivered}
                onCancelOrder={handleCancelOrder}
                googleMapsLoaded={isLoaded}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600 text-base">
            No tienes pedidos activos actualmente.
          </p>
        )}
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white border border-gray-200 rounded-2xl p-5 shadow-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Historial de Pedidos</h2>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl px-4 py-2 text-sm transition-colors"
          >
            <History className="w-5 h-5" /> {showHistory ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {completedOrders.length > 0 ? (
                completedOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border border-gray-300 rounded-xl p-4 shadow-sm bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <Package className="w-6 h-6 text-gray-700" />
                        <h3 className="text-base font-semibold text-gray-900">
                          Pedido #{order.id}
                        </h3>
                      </div>
                      <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-800">
                        Entregado
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-800">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-700" />
                        <p className="truncate">
                          <span className="font-medium">Dirección de Entrega:</span>{' '}
                          {order.deliveryAddress || 'No disponible'}
                        </p>
                      </div>
                      <p>
                        <span className="font-medium">Negocio:</span> {order.businessName}
                      </p>
                      <p>
                        <span className="font-medium">Cliente:</span> {order.customerName}
                      </p>
                      <p>
                        <span className="font-medium">Entregado el:</span>{' '}
                        {order.deliveredAt
                          ? format(new Date(order.deliveredAt), 'dd MMM yyyy, HH:mm', { locale: es })
                          : 'No disponible'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-gray-600 text-base">
                  No tienes pedidos completados.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default DeliveryPersonDashboard;