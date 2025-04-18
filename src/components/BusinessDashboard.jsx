import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  MessageSquare,
  BarChart2,
  ArrowLeft,
  Users,
  Send,
  Package,
  ShoppingCart,
  Star,
  MessageCircle,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Select from 'react-select';
import { format } from 'date-fns';
import { CSVLink } from 'react-csv';
import { motion } from 'framer-motion';
import Chat from './Chat';

// Función para calcular la distancia entre dos puntos (lat, lon) usando la fórmula de Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en kilómetros
};

// Componente principal
export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  // Estados existentes (sin cambios)
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [metrics, setMetrics] = useState({ totalSales: 0, completedOrders: 0, pendingOrders: 0 });
  const [businessStatus, setBusinessStatus] = useState(null);
  const [businessLogo, setBusinessLogo] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSort, setCustomerSort] = useState('name');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    id: null,
    name: '',
    price: '',
    description: '',
    image: '',
    category: '',
  });
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [bulkMessageContent, setBulkMessageContent] = useState('');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [salesPeriod, setSalesPeriod] = useState('all');

  // Nuevos estados para la asignación de repartidores
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Estilos para react-select (sin cambios)
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: '#d1d5db',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#2563eb',
      },
      padding: '2px',
      fontSize: '0.875rem',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#e5e7eb' : '#fff',
      color: state.isSelected ? '#fff' : '#000',
      fontSize: '0.875rem',
    }),
  };

  // Cargar datos existentes (sin cambios)
  useEffect(() => {
    if (loading) return;

    if (!user || !user.uid) {
      navigate('/login');
      return;
    }

    const fetchBusinessData = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setBusinessStatus(userData.status || 'pending');
          setBusinessLogo(userData.logo || '');
        } else {
          setBusinessStatus('pending');
          setBusinessLogo('');
        }
      } catch (error) {
        console.error('Error al cargar datos del negocio:', error);
        toast.error('Error al cargar datos del negocio.');
        setBusinessStatus('pending');
        setBusinessLogo('');
      } finally {
        setStatusLoading(false);
      }
    };

    fetchBusinessData();
  }, [user, loading, navigate]);

  // Cargar datos principales (incluyendo repartidores)
  useEffect(() => {
    if (loading || statusLoading) return;

    if (userRole !== 'business' || businessStatus !== 'verified') {
      navigate('/');
      return;
    }

    const fetchCategories = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);
        if (categoriesData.length > 0) {
          setCurrentProduct((prev) => ({ ...prev, category: categoriesData[0].id }));
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
        toast.error('Error al cargar las categorías.');
      }
    };

    const productsQuery = query(collection(db, 'products'), where('businessId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(productsData);
      },
      (error) => {
        console.error('Error al cargar productos:', error);
        toast.error('Error al cargar los productos.');
      }
    );

    const ordersQuery = query(collection(db, 'orders'), where('businessIds', 'array-contains', user.uid));
    const unsubscribeOrders = onSnapshot(
      ordersQuery,
      async (snapshot) => {
        const ordersData = await Promise.all(
          snapshot.docs.map(async (orderDoc) => {
            const orderData = { id: orderDoc.id, ...orderDoc.data() };
            const userDocRef = doc(db, 'users', orderData.customerId);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            return {
              ...orderData,
              userId: orderData.customerId,
              customerName: userData.clientInfo?.firstName
                ? `${userData.clientInfo.firstName} ${userData.clientInfo.lastName || ''}`
                : 'Desconocido',
              customerEmail: userData.email || 'N/A',
              customerProfileImage: userData.profileImage || '',
              customerLocation: userData.location || { lat: 0, lng: 0 }, // Añadimos la ubicación del cliente
              createdAt: orderData.createdAt || new Date().toISOString(),
            };
          })
        );
        const sortedOrders = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);

        const totalSales = sortedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const completedOrders = sortedOrders.filter((order) => order.status === 'delivered').length;
        const pendingOrders = sortedOrders.filter((order) => order.status === 'pending' || order.status === 'preparing').length;
        setMetrics({ totalSales, completedOrders, pendingOrders });
      },
      (error) => {
        console.error('Error al cargar pedidos:', error);
        toast.error('Error al cargar los pedidos.');
      }
    );

    const fetchCustomers = async () => {
      try {
        const ordersSnapshot = await getDocs(ordersQuery);
        const customerIds = [...new Set(ordersSnapshot.docs.map((doc) => doc.data().customerId))];
        const customersData = await Promise.all(
          customerIds.map(async (userId) => {
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            const customerOrders = ordersSnapshot.docs
              .filter((doc) => doc.data().customerId === userId)
              .map((doc) => ({ id: doc.id, ...doc.data() }));
            return {
              id: userId,
              name: userData.clientInfo?.firstName
                ? `${userData.clientInfo.firstName} ${userData.clientInfo.lastName || ''}`
                : 'Desconocido',
              email: userData.email || 'N/A',
              profileImage: userData.profileImage || '',
              orderCount: customerOrders.length,
              orders: customerOrders,
            };
          })
        );
        setCustomers(customersData);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        toast.error('Error al cargar los clientes.');
      }
    };

    const reviewsQuery = query(collection(db, 'reviews'), where('businessId', '==', user.uid));
    const unsubscribeReviews = onSnapshot(
      reviewsQuery,
      async (snapshot) => {
        const reviewsData = await Promise.all(
          snapshot.docs.map(async (reviewDoc) => {
            const reviewData = { id: reviewDoc.id, ...reviewDoc.data() };
            const userDocRef = doc(db, 'users', reviewData.customerId);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};
            return {
              ...reviewData,
              customerName: userData.clientInfo?.firstName
                ? `${userData.clientInfo.firstName} ${userData.clientInfo.lastName || ''}`
                : 'Desconocido',
            };
          })
        );
        setReviews(reviewsData);
      },
      (error) => {
        console.error('Error al cargar reseñas:', error);
        toast.error('Error al cargar las reseñas.');
      }
    );

    // Cargar repartidores disponibles
    const fetchDeliveryPersons = async () => {
      try {
        const deliveryQuery = query(
          collection(db, 'users'),
          where('role', '==', 'deliveryPerson'),
          where('availability', '==', true)
        );
        const deliverySnapshot = await getDocs(deliveryQuery);
        const deliveryList = deliverySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDeliveryPersons(deliveryList);
      } catch (error) {
        console.error('Error al cargar repartidores:', error);
        toast.error('Error al cargar los repartidores.');
      }
    };

    fetchCategories();
    fetchCustomers();
    fetchDeliveryPersons();

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeReviews();
    };
  }, [user, userRole, loading, navigate, statusLoading, businessStatus]);

  // Función para asignar un repartidor al pedido
  const assignDeliveryPerson = async (order) => {
    if (!order || !order.id) {
      toast.error('Pedido inválido.');
      return;
    }

    setIsAssigning(true);

    try {
      // Obtener la ubicación del negocio (usuario actual)
      const businessDocRef = doc(db, 'users', user.uid);
      const businessDocSnap = await getDoc(businessDocRef);
      const businessData = businessDocSnap.exists() ? businessDocSnap.data() : {};
      const businessLocation = businessData.location || { lat: 0, lng: 0 };

      // Obtener la ubicación del cliente
      const customerLocation = order.customerLocation || { lat: 0, lng: 0 };

      // Encontrar el repartidor más cercano
      let closestDeliveryPerson = null;
      let minTotalDistance = Infinity;

      for (const deliveryPerson of deliveryPersons) {
        const deliveryLocation = deliveryPerson.location || { lat: 0, lng: 0 };

        // Calcular la distancia total: repartidor -> negocio -> cliente
        const distanceToBusiness = calculateDistance(
          deliveryLocation.lat,
          deliveryLocation.lng,
          businessLocation.lat,
          businessLocation.lng
        );
        const distanceToCustomer = calculateDistance(
          businessLocation.lat,
          businessLocation.lng,
          customerLocation.lat,
          customerLocation.lng
        );
        const totalDistance = distanceToBusiness + distanceToCustomer;

        if (totalDistance < minTotalDistance) {
          minTotalDistance = totalDistance;
          closestDeliveryPerson = deliveryPerson;
        }
      }

      if (!closestDeliveryPerson) {
        toast.error('No hay repartidores disponibles.');
        setIsAssigning(false);
        return;
      }

      // Actualizar el pedido con el repartidor asignado
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        deliveryPersonId: closestDeliveryPerson.id,
        status: 'picked_up', // Cambiar el estado a "Recolectado"
      });

      // Notificar al repartidor
      await addDoc(collection(db, 'notifications'), {
        userId: closestDeliveryPerson.id,
        type: 'delivery',
        message: `Se te ha asignado el pedido #${order.id} para entrega.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Notificar al cliente
      await addDoc(collection(db, 'notifications'), {
        userId: order.customerId,
        type: 'client',
        message: `Tu pedido #${order.id} ha sido asignado a un repartidor y está en camino.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      toast.success(`Pedido asignado a ${closestDeliveryPerson.clientInfo?.firstName || 'Repartidor'}`);
    } catch (error) {
      console.error('Error al asignar repartidor:', error);
      toast.error('Error al asignar repartidor: ' + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  // Resto de las funciones existentes (sin cambios)
  const openProductModal = (product = null) => {
    if (product) {
      setCurrentProduct({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image: product.image,
        category: product.category,
      });
    } else {
      setCurrentProduct({
        id: null,
        name: '',
        price: '',
        description: '',
        image: '',
        category: categories[0]?.id || '',
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!currentProduct.name || !currentProduct.price || !currentProduct.description || !currentProduct.category) {
      toast.error('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      if (currentProduct.id) {
        const productRef = doc(db, 'products', currentProduct.id);
        await updateDoc(productRef, {
          name: currentProduct.name,
          price: parseFloat(currentProduct.price),
          description: currentProduct.description,
          image: currentProduct.image || '',
          category: currentProduct.category,
        });
        toast.success('Producto actualizado exitosamente');
      } else {
        await addDoc(collection(db, 'products'), {
          businessId: user.uid,
          name: currentProduct.name,
          price: parseFloat(currentProduct.price),
          description: currentProduct.description,
          image: currentProduct.image || '',
          category: currentProduct.category,
          createdAt: new Date().toISOString(),
        });
        toast.success('Producto agregado exitosamente');
      }
      setIsProductModalOpen(false);
      setCurrentProduct({
        id: null,
        name: '',
        price: '',
        description: '',
        image: '',
        category: categories[0]?.id || '',
      });
    } catch (error) {
      console.error('Error al guardar producto:', error);
      toast.error('Error al guardar producto.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        toast.success('Producto eliminado exitosamente');
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        toast.error('Error al eliminar producto.');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });

      const order = orders.find((o) => o.id === orderId);
      const statusText =
        newStatus === 'cancelled' ? 'Cancelado' :
        newStatus === 'pending' ? 'Pendiente' :
        newStatus === 'preparing' ? 'En Preparación' :
        newStatus === 'ready_for_pickup' ? 'Listo para recolectar' :
        newStatus === 'picked_up' ? 'Recolectado' :
        newStatus === 'on_the_way' ? 'En camino' :
        'Entregado';
      await addDoc(collection(db, 'notifications'), {
        userId: order.customerId,
        type: 'client',
        message: `El estado de tu pedido #${orderId} ha sido actualizado a "${statusText}".`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      const adminUsers = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      adminUsers.forEach(async (adminDoc) => {
        await addDoc(collection(db, 'notifications'), {
          userId: adminDoc.id,
          type: 'admin',
          message: `El negocio ha actualizado el pedido #${orderId} a "${statusText}".`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      });

      toast.success('Estado del pedido actualizado');
    } catch (error) {
      console.error('Error al actualizar estado del pedido:', error);
      toast.error('Error al actualizar estado del pedido.');
    }
  };

  const handleAddOrderNote = async (orderId, note, isPublic = false) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      if (isPublic) {
        await updateDoc(orderRef, { publicNote: note });
        const order = orders.find((o) => o.id === orderId);
        await addDoc(collection(db, 'notifications'), {
          userId: order.customerId,
          type: 'client',
          message: `Nueva nota en tu pedido #${orderId}: ${note}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        toast.success('Nota pública agregada al pedido');
      } else {
        await updateDoc(orderRef, { internalNote: note });
        toast.success('Nota interna agregada al pedido');
      }
    } catch (error) {
      console.error('Error al agregar nota al pedido:', error);
      toast.error('Error al agregar nota al pedido.');
    }
  };

  const openMessageModal = (customer) => {
    setMessageRecipient(customer);
    setMessageContent('');
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('El mensaje no puede estar vacío.');
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: messageRecipient.id,
        type: 'client',
        message: `Mensaje del negocio: ${messageContent}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      toast.success('Mensaje enviado al cliente');
      setIsMessageModalOpen(false);
      setMessageContent('');
      setMessageRecipient(null);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error('Error al enviar mensaje.');
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessageContent.trim()) {
      toast.error('El mensaje no puede estar vacío.');
      return;
    }

    try {
      await Promise.all(
        customers.map((customer) =>
          addDoc(collection(db, 'notifications'), {
            userId: customer.id,
            type: 'client',
            message: `Mensaje del negocio: ${bulkMessageContent}`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        )
      );
      toast.success('Mensaje masivo enviado a todos los clientes');
      setIsBulkMessageModalOpen(false);
      setBulkMessageContent('');
    } catch (error) {
      console.error('Error al enviar mensaje masivo:', error);
      toast.error('Error al enviar mensaje masivo.');
    }
  };

  const openChatModal = (customer) => {
    setSelectedCustomer(customer);
    setIsChatModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(
      (order) =>
        order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(orderSearch.toLowerCase())
    );

    if (orderFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === orderFilter);
    }

    return filtered;
  }, [orders, orderSearch, orderFilter]);

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearch.toLowerCase())
    );

    if (customerSort === 'orderCount') {
      filtered.sort((a, b) => b.orderCount - a.orderCount);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [customers, customerSearch, customerSort]);

  const salesData = useMemo(() => {
    const now = new Date();
    let filteredOrders = orders;

    if (salesPeriod === 'last7days') {
      const last7Days = new Date(now.setDate(now.getDate() - 7));
      filteredOrders = orders.filter(
        (order) => new Date(order.createdAt) >= last7Days
      );
    } else if (salesPeriod === 'last30days') {
      const last30Days = new Date(now.setDate(now.getDate() - 30));
      filteredOrders = orders.filter(
        (order) => new Date(order.createdAt) >= last30Days
      );
    }

    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const topProducts = filteredOrders
      .flatMap((order) => order.items || [])
      .reduce((acc, item) => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
        return acc;
      }, {});
    const topProductsArray = Object.entries(topProducts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { totalSales, topProducts: topProductsArray };
  }, [orders, salesPeriod]);

  const ordersCSVData = useMemo(() => {
    return filteredOrders.map((order) => ({
      ID: order.id,
      Cliente: order.customerName,
      Correo: order.customerEmail,
      Total: order.total.toFixed(2),
      Estado:
        order.status === 'cancelled' ? 'Cancelado' :
        order.status === 'pending' ? 'Pendiente' :
        order.status === 'preparing' ? 'En Preparación' :
        order.status === 'ready_for_pickup' ? 'Listo para recolectar' :
        order.status === 'picked_up' ? 'Recolectado' :
        order.status === 'on_the_way' ? 'En camino' :
        'Entregado',
      Fecha: format(new Date(order.createdAt), 'dd/MM/yyyy'),
    }));
  }, [filteredOrders]);

  const customersCSVData = useMemo(() => {
    return filteredCustomers.map((customer) => ({
      ID: customer.id,
      Nombre: customer.name,
      Correo: customer.email,
      Pedidos: customer.orderCount,
    }));
  }, [filteredCustomers]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (totalRating / reviews.length).toFixed(1);
  }, [reviews]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 line-through';
      case 'pending':
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800';
      case 'picked_up':
      case 'on_the_way':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderContainerStyles = (status) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 border-2 border-red-400';
      case 'pending':
      case 'preparing':
        return 'bg-yellow-100 border-2 border-yellow-400 animate-pulse';
      case 'ready_for_pickup':
        return 'bg-green-100 border-2 border-green-400 animate-pulse';
      case 'picked_up':
      case 'on_the_way':
        return 'bg-blue-100 border-2 border-blue-400 animate-pulse';
      case 'delivered':
        return 'bg-gray-50 border-2 border-blue-400';
      default:
        return 'bg-gray-50';
    }
  };

  if (loading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-base sm:text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 px-2 sm:px-4 py-4 sm:py-8 rounded-3xl">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado y otras secciones sin cambios */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-2">
            {businessLogo ? (
              <img src={businessLogo} alt="Business Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full" />
            ) : (
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-custom-blue" />
            )}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-custom-blue">
              Dashboard
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              onClick={() => setIsBulkMessageModalOpen(true)}
              className="bg-blue-600 text-white hover:bg-blue-500 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              aria-label="Enviar mensaje masivo a clientes"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" /> Mensaje Masivo
            </Button>
            <Button
              onClick={() => navigate('/business/customer-stats')}
              className="bg-custom-blue text-white hover:bg-gray-600 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
              aria-label="Ver estadísticas de clientes"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5" /> Estadísticas de Clientes
            </Button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-gray-800 hover:text-gray-600 transition-colors duration-200 font-medium text-xs sm:text-sm md:text-base"
              aria-label="Volver a la página principal"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Volver
            </button>
          </div>
        </motion.div>

        {/* Métricas y otras secciones sin cambios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-8"
        >
          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-sm sm:text-lg font-semibold text-custom-blue mb-2 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" /> Ingresos Totales
            </h4>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">${salesData.totalSales.toFixed(2)}</p>
            <Select
              options={[
                { value: 'all', label: 'Todo el tiempo' },
                { value: 'last7days', label: 'Últimos 7 días' },
                { value: 'last30days', label: 'Últimos 30 días' },
              ]}
              value={[
                { value: 'all', label: 'Todo el tiempo' },
                { value: 'last7days', label: 'Últimos 7 días' },
                { value: 'last30days', label: 'Últimos 30 días' },
              ].find((option) => option.value === salesPeriod)}
              onChange={(option) => setSalesPeriod(option.value)}
              styles={selectStyles}
              placeholder="Seleccionar período"
              className="mt-2 w-full"
            />
          </div>
          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-sm sm:text-lg font-semibold text-custom-blue mb-2">Pedidos Completados</h4>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">{metrics.completedOrders}</p>
          </div>
          <div className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <h4 className="text-sm sm:text-lg font-semibold text-custom-blue mb-2">Pedidos Pendientes</h4>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">{metrics.pendingOrders}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm mb-4 sm:mb-8"
        >
          <h4 className="text-base sm:text-xl font-semibold text-custom-blue mb-3 sm:mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" /> Calificación Promedio
          </h4>
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-gray-800">{averageRating}/5</p>
            <div className="flex">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`w-5 h-5 ${index + 1 <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">({reviews.length} reseñas)</p>
          </div>
        </motion.div>

        {salesData.topProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm mb-4 sm:mb-8"
          >
            <h4 className="text-base sm:text-xl font-semibold text-custom-blue mb-3 sm:mb-4">Productos Más Vendidos</h4>
            <ul className="space-y-1 sm:space-y-2">
              {salesData.topProducts.map(([name, quantity], index) => (
                <li key={index} className="flex justify-between text-gray-700 text-xs sm:text-base">
                  <span>{name}</span>
                  <span className="font-semibold">{quantity} unidades</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm mb-4 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h4 className="text-base sm:text-xl font-semibold text-custom-blue">Gestionar Productos</h4>
            <Button
              onClick={() => openProductModal()}
              className="bg-custom-blue text-white hover:bg-blue-700 rounded-2xl flex items-center gap-2 text-xs sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Agregar Producto
            </Button>
          </div>

          <div className="mb-3 sm:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Buscar productos..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 sm:pl-10 rounded-2xl border-gray-300 focus:border-custom-blue text-xs sm:text-base"
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-2 sm:p-4 rounded-2xl bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 sm:w-16 sm:h-16 object-cover rounded-md"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-custom-blue text-xs sm:text-base">{product.name}</p>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        Categoría: {categories.find((cat) => cat.id === product.category)?.name || 'Sin categoría'}
                      </p>
                      <p className="text-gray-600 text-xs sm:text-sm">Precio: ${product.price.toFixed(2)}</p>
                      <p className="text-gray-600 text-xs sm:text-sm">{product.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => openProductModal(product)}
                      className="bg-blue-700 text-black hover:bg-blue-500 rounded-3xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" /> Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-500 text-white hover:bg-red-300 rounded-3xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> Eliminar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-xs sm:text-base">
                  ¡Aún no tienes productos! Agrega uno para empezar a vender.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Gestión de Pedidos Actualizada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm mb-4 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h4 className="text-base sm:text-xl font-semibold text-custom-blue">Gestionar Pedidos</h4>
            <CSVLink
              data={ordersCSVData}
              filename={`pedidos-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 bg-custom-blue text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl hover:bg-blue-700 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Exportar Pedidos
            </CSVLink>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Buscar pedidos..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-9 sm:pl-10 rounded-2xl border-gray-300 focus:border-custom-blue text-xs sm:text-base"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'cancelled', label: 'Cancelado' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'preparing', label: 'En Preparación' },
                { value: 'ready_for_pickup', label: 'Listo para recolectar' },
                { value: 'picked_up', label: 'Recolectado' },
                { value: 'on_the_way', label: 'En camino' },
                { value: 'delivered', label: 'Entregado' },
              ]}
              value={[
                { value: 'all', label: 'Todos' },
                { value: 'cancelled', label: 'Cancelado' },
                { value: 'pending', label: 'Pendiente' },
                { value: 'preparing', label: 'En Preparación' },
                { value: 'ready_for_pickup', label: 'Listo para recolectar' },
                { value: 'picked_up', label: 'Recolectado' },
                { value: 'on_the_way', label: 'En camino' },
                { value: 'delivered', label: 'Entregado' },
              ].find((option) => option.value === orderFilter)}
              onChange={(option) => setOrderFilter(option.value)}
              styles={selectStyles}
              placeholder="Filtrar por estado"
              className="w-full sm:w-40 md:w-48"
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const customer = customers.find((c) => c.id === order.customerId);
                return (
                  <div
                    key={order.id}
                    className={`p-2 sm:p-4 rounded-2xl flex flex-col gap-2 sm:gap-3 hover:bg-gray-100 transition-colors ${getOrderContainerStyles(order.status)}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm">
                      <p className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                        <strong>ID del Pedido:</strong> {order.id}
                      </p>
                      <p className="flex items-center gap-2">
                        <strong>Cliente:</strong>
                        {order.customerProfileImage ? (
                          <img
                            src={order.customerProfileImage}
                            alt={order.customerName}
                            className="w-6 h-6 rounded-full object-cover mr-2"
                          />
                        ) : null}
                        {order.customerName}
                      </p>
                      <p><strong>Correo:</strong> {order.customerEmail}</p>
                      <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
                      <p><strong>Fecha:</strong> {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                      <p className="flex items-center gap-2">
                        <strong>Estado:</strong>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(order.status)}`}>
                          {order.status === 'cancelled' ? 'Cancelado' :
                           order.status === 'pending' ? 'Pendiente' :
                           order.status === 'preparing' ? 'En Preparación' :
                           order.status === 'ready_for_pickup' ? 'Listo para recolectar' :
                           order.status === 'picked_up' ? 'Recolectado' :
                           order.status === 'on_the_way' ? 'En camino' :
                           order.status === 'delivered' ? 'Entregado' :
                           'Pendiente'}
                        </span>
                      </p>
                      {order.deliveryPersonId && (
                        <p>
                          <strong>Repartidor:</strong>{' '}
                          {deliveryPersons.find((dp) => dp.id === order.deliveryPersonId)?.clientInfo?.firstName ||
                            'Asignado'}
                        </p>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm"><strong>Productos:</strong></p>
                    <ul className="list-disc pl-4 sm:pl-5 text-xs sm:text-sm">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <li key={index}>
                            {item.name} - Cantidad: {item.quantity} - Precio: ${item.price.toFixed(2)}
                          </li>
                        ))
                      ) : (
                        <li>No hay productos</li>
                      )}
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm"><strong>Actualizar Estado:</strong></p>
                        <Select
                          options={[
                            { value: 'cancelled', label: 'Cancelado' },
                            { value: 'pending', label: 'Pendiente' },
                            { value: 'preparing', label: 'En Preparación' },
                            { value: 'ready_for_pickup', label: 'Listo para recolectar' },
                            { value: 'picked_up', label: 'Recolectado' },
                            { value: 'on_the_way', label: 'En camino' },
                            { value: 'delivered', label: 'Entregado' },
                          ]}
                          value={[
                            { value: 'cancelled', label: 'Cancelado' },
                            { value: 'pending', label: 'Pendiente' },
                            { value: 'preparing', label: 'En Preparación' },
                            { value: 'ready_for_pickup', label: 'Listo para recolectar' },
                            { value: 'picked_up', label: 'Recolectado' },
                            { value: 'on_the_way', label: 'En camino' },
                            { value: 'delivered', label: 'Entregado' },
                          ].find((option) => option.value === (order.status || 'pending'))}
                          onChange={(option) => handleUpdateOrderStatus(order.id, option.value)}
                          isDisabled={order.status === 'delivered' || order.deliveryPersonId}
                          styles={selectStyles}
                          className="w-36 sm:w-40 md:w-48"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          const note = prompt('Agregar una nota interna para este pedido:');
                          if (note) handleAddOrderNote(order.id, note, false);
                        }}
                        className="bg-blue-700 text-gray-700 hover:bg-gray-300 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                      >
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" /> Nota Interna
                      </Button>
                      <Button
                        onClick={() => {
                          const note = prompt('Agregar una nota pública para el cliente:');
                          if (note) handleAddOrderNote(order.id, note, true);
                        }}
                        className="bg-blue-700 text-blue-700 hover:bg-blue-300 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                      >
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" /> Nota Pública
                      </Button>
                      <Button
                        onClick={() => openMessageModal(customer)}
                        className="bg-custom-blue text-white hover:bg-green-700 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                      >
                        <Send className="w-3 h-3 sm:w-4 sm:h-4" /> Contactar Cliente
                      </Button>
                      {/* Botón de Asignar Pedido */}
                      <Button
                        onClick={() => assignDeliveryPerson(order)}
                        className={`rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 ${
                          order.status === 'ready_for_pickup' && !order.deliveryPersonId
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={order.status !== 'ready_for_pickup' || order.deliveryPersonId || isAssigning}
                      >
                        {isAssigning ? 'Asignando...' : 'Asignar Pedido'}
                      </Button>
                    </div>
                    {order.internalNote && (
                      <p className="text-gray-600 text-xs sm:text-sm"><strong>Nota Interna:</strong> {order.internalNote}</p>
                    )}
                    {order.publicNote && (
                      <p className="text-blue-600 text-xs sm:text-sm"><strong>Nota Pública:</strong> {order.publicNote}</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 sm:py-12">
                <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-xs sm:text-base">
                  ¡Aún no tienes pedidos! Empieza a vender ahora.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Resto del componente sin cambios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm mb-4 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h4 className="text-base sm:text-xl font-semibold text-custom-blue">Clientes</h4>
            <CSVLink
              data={customersCSVData}
              filename={`clientes-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 bg-custom-blue text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl hover:bg-blue-700 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Exportar Clientes
            </CSVLink>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Buscar clientes..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9 sm:pl-10 rounded-2xl border-gray-300 focus:border-custom-blue text-xs sm:text-base"
              />
            </div>
            <Select
              options={[
                { value: 'name', label: 'Ordenar por Nombre' },
                { value: 'orderCount', label: 'Ordenar por Cantidad de Pedidos' },
              ]}
              value={[
                { value: 'name', label: 'Ordenar por Nombre' },
                { value: 'orderCount', label: 'Ordenar por Cantidad de Pedidos' },
              ].find((option) => option.value === customerSort)}
              onChange={(option) => setCustomerSort(option.value)}
              styles={selectStyles}
              placeholder="Ordenar por..."
              className="w-full sm:w-40 md:w-48"
            />
          </div>

          <div className="space-y-3 sm:space-y-4">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-2 sm:p-4 rounded-2xl bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 flex items-center gap-3 sm:gap-4">
                    {customer.profileImage ? (
                      <img
                        src={customer.profileImage}
                        alt={customer.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    )}
                    <div>
                      <p className="font-semibold text-custom-blue text-xs sm:text-base">{customer.name}</p>
                      <p className="text-gray-600 text-xs sm:text-sm">Correo: {customer.email}</p>
                      <p className="text-gray-600 text-xs sm:text-sm">Pedidos: {customer.orderCount}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => openMessageModal(customer)}
                      className="bg-blue-700 text-white hover:bg-green-700 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 w-full sm:w-auto"
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" /> Enviar Mensaje
                    </Button>
                    <Button
                      onClick={() => openChatModal(customer)}
                      className="bg-custom-blue text-white hover:bg-blue-700 rounded-2xl flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 w-full sm:w-auto"
                    >
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" /> Iniciar Chat
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-xs sm:text-base">
                  ¡Aún no tienes clientes! Empieza a vender para construir tu base de clientes.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white p-3 sm:p-6 rounded-2xl shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
            <h4 className="text-base sm:text-xl font-semibold text-custom-blue">Reseñas de Clientes</h4>
            <CSVLink
              data={reviews.map((review) => ({
                ID: review.id,
                Pedido: review.orderId,
                Cliente: review.customerName,
                Calificación: review.rating,
                Comentario: review.comment || 'N/A',
                Fecha: format(new Date(review.createdAt), 'dd/MM/yyyy'),
              }))}
              filename={`reseñas-${format(new Date(), 'yyyy-MM-dd')}.csv`}
              className="flex items-center gap-2 bg-custom-blue text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl hover:bg-blue-700 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Exportar Reseñas
            </CSVLink>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-2 sm:p-4 rounded-2xl bg-gray-50 flex flex-col gap-2 sm:gap-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-custom-blue text-xs sm:text-base">{review.customerName}</p>
                      <div className="flex">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`w-4 h-4 ${index + 1 <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {format(new Date(review.createdAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm"><strong>Pedido:</strong> {review.orderId}</p>
                  {review.comment && (
                    <p className="text-gray-600 text-xs sm:text-sm"><strong>Comentario:</strong> {review.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Star className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-xs sm:text-base">
                  ¡Aún no tienes reseñas! Sigue ofreciendo un excelente servicio.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <Transition appear show={isProductModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsProductModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {currentProduct.id ? 'Editar Producto' : 'Agregar Producto'}
                    </Dialog.Title>
                    <div className="mt-4 space-y-4">
                      <Input
                        placeholder="Nombre del producto"
                        value={currentProduct.name}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                        className="rounded-2xl border-gray-300 focus:border-custom-blue"
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        value={currentProduct.price}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                        className="rounded-2xl border-gray-300 focus:border-custom-blue"
                      />
                      <Input
                        placeholder="Descripción"
                        value={currentProduct.description}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                        className="rounded-2xl border-gray-300 focus:border-custom-blue"
                      />
                      <Input
                        placeholder="URL de la imagen (opcional)"
                        value={currentProduct.image}
                        onChange={(e) => setCurrentProduct({ ...currentProduct, image: e.target.value })}
                        className="rounded-2xl border-gray-300 focus:border-custom-blue"
                      />
                      <Select
                        options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
                        value={categories
                          .map((cat) => ({ value: cat.id, label: cat.name }))
                          .find((option) => option.value === currentProduct.category)}
                        onChange={(option) => setCurrentProduct({ ...currentProduct, category: option.value })}
                        styles={selectStyles}
                        placeholder="Seleccionar categoría"
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        onClick={() => setIsProductModalOpen(false)}
                        className="bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl px-4 py-2"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveProduct}
                        className="bg-custom-blue text-white hover:bg-blue-700 rounded-2xl px-4 py-2"
                      >
                        {currentProduct.id ? 'Actualizar' : 'Agregar'}
                      </Button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <Transition appear show={isMessageModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsMessageModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Enviar Mensaje a {messageRecipient?.name}
                    </Dialog.Title>
                    <div className="mt-4">
                      <Textarea
                        placeholder="Escribe tu mensaje..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="w-full h-32 rounded-2xl border-gray-300 focus:border-custom-blue"
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        onClick={() => setIsMessageModalOpen(false)}
                        className="bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl px-4 py-2"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        className="bg-green-600 text-white hover:bg-green-700 rounded-2xl px-4 py-2"
                      >
                        Enviar
                      </Button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <Transition appear show={isBulkMessageModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsBulkMessageModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Enviar Mensaje Masivo
                    </Dialog.Title>
                    <div className="mt-4">
                      <Textarea
                        placeholder="Escribe tu mensaje para todos los clientes..."
                        value={bulkMessageContent}
                        onChange={(e) => setBulkMessageContent(e.target.value)}
                        className="w-full h-32 rounded-2xl border-gray-300 focus:border-custom-blue"
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                      <Button
                        onClick={() => setIsBulkMessageModalOpen(false)}
                        className="bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl px-4 py-2"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSendBulkMessage}
                        className="bg-green-600 text-white hover:bg-green-700 rounded-2xl px-4 py-2"
                      >
                        Enviar a Todos
                      </Button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        <Transition appear show={isChatModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => setIsChatModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md sm:max-w-2xl transform overflow-hidden text-left align-middle transition-all">
                    {selectedCustomer && (
                      <Chat
                        currentUserId={user.uid}
                        otherUserId={selectedCustomer.id}
                        currentUserRole="business"
                        setIsChatOpen={setIsChatModalOpen}
                      />
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </section>
  );
}