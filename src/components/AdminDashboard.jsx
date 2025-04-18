import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, getDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  Users,
  ShoppingBag,
  Star,
  BarChart2,
  Bell,
  Download,
  Edit,
  Trash,
  CheckCircle,
  X,
  Plus,
  MoreVertical,
  Search,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const COLORS = ['gray', 'green', '#1D4ED8', 'red', 'red'];

export default function AdminDashboard() {
  const { user, userRole, loading } = useAuth();
  const { addNotification } = useNotifications();
  const [activeSection, setActiveSection] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [businessPage, setBusinessPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [deliveryPersonsPage, setDeliveryPersonsPage] = useState(1);
  const [businessSearch, setBusinessSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewProductFilter, setReviewProductFilter] = useState('');
  const [deliveryPersonSearch, setDeliveryPersonSearch] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editUser, setEditUser] = useState({});
  const [showEditBusinessModal, setShowEditBusinessModal] = useState(false);
  const [editBusiness, setEditBusiness] = useState({});
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '', business: '' });
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState({});
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ userId: '', message: '' });
  const [showEditDeliveryPersonModal, setShowEditDeliveryPersonModal] = useState(false);
  const [editDeliveryPerson, setEditDeliveryPerson] = useState({});
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const itemsPerPage = 5;

  useEffect(() => {
    if (loading) return;

    if (!user || userRole !== 'admin') {
      window.location.href = '/';
      return;
    }

    // Cargar usuarios
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    // Cargar pedidos
    const ordersQuery = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const enrichedOrders = await Promise.all(
        ordersData.map(async (order) => {
          let userName = 'Desconocido';
          let userEmail = 'N/A';
          if (order.customerId) {
            const userDocRef = doc(db, 'users', order.customerId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              userName = userData.clientInfo?.firstName
                ? `${userData.clientInfo.firstName} ${userData.clientInfo.lastName || ''}`
                : userData.name || 'Desconocido';
              userEmail = userData.email || 'N/A';
            }
          }

          let businessName = 'Desconocido';
          let businessId = 'N/A';
          const businessUid = order.businessIds?.[0] || order.businessId;
          if (businessUid) {
            const businessDocRef = doc(db, 'users', businessUid);
            const businessDocSnap = await getDoc(businessDocRef);
            if (businessDocSnap.exists()) {
              const businessData = businessDocSnap.data();
              businessName = businessData.clientInfo?.businessName || 'Desconocido';
              businessId = businessUid;
            }
          }

          return {
            ...order,
            userName,
            userEmail,
            businessName,
            businessId,
          };
        })
      );

      setOrders(enrichedOrders);
    });

    // Cargar productos
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(productsData);
    });

    // Cargar reseñas
    const reviewsQuery = query(collection(db, 'reviews'));
    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReviews(reviewsData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeReviews();
    };
  }, [user, userRole, loading]);

  // Filtros y paginación para pedidos
  const filteredOrders = orders.filter((order) => {
    const searchTerm = orderSearch.toLowerCase();
    return (
      (order.id.toLowerCase().includes(searchTerm) ||
        order.userName.toLowerCase().includes(searchTerm) ||
        order.userEmail.toLowerCase().includes(searchTerm) ||
        order.businessName.toLowerCase().includes(searchTerm)) &&
      (orderStatusFilter ? order.status === orderStatusFilter : true)
    );
  });

  const paginatedOrders = filteredOrders.slice(
    (ordersPage - 1) * itemsPerPage,
    ordersPage * itemsPerPage
  );

  // Filtros y paginación para usuarios
  const filteredUsers = users.filter((user) => {
    const searchTerm = orderSearch.toLowerCase();
    return (
      user.id.toLowerCase().includes(searchTerm) ||
      (user.name?.toLowerCase().includes(searchTerm) ?? false) ||
      (user.email?.toLowerCase().includes(searchTerm) ?? false) ||
      (user.clientInfo?.firstName?.toLowerCase().includes(searchTerm) ?? false)
    );
  });

  const paginatedUsers = filteredUsers.slice(
    (usersPage - 1) * itemsPerPage,
    usersPage * itemsPerPage
  );

  // Filtros y paginación para negocios
  const filteredBusinesses = users
    .filter((user) => user.role === 'business' && user.status === 'verified')
    .filter((business) => {
      const searchTerm = businessSearch.toLowerCase();
      return (
        business.id.toLowerCase().includes(searchTerm) ||
        (business.clientInfo?.businessName?.toLowerCase().includes(searchTerm) ?? false) ||
        (business.email?.toLowerCase().includes(searchTerm) ?? false)
      );
    });

  const paginatedBusinesses = filteredBusinesses.slice(
    (businessPage - 1) * itemsPerPage,
    businessPage * itemsPerPage
  );

  // Filtros y paginación para productos
  const filteredProducts = products.filter((product) => {
    const searchTerm = productSearch.toLowerCase();
    return (
      (product.id.toLowerCase().includes(searchTerm) ||
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.business.toLowerCase().includes(searchTerm)) &&
      (productCategoryFilter ? product.category === productCategoryFilter : true)
    );
  });

  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * itemsPerPage,
    productsPage * itemsPerPage
  );

  // Filtros y paginación para reseñas
  const filteredReviews = reviews.filter((review) => {
    const searchTerm = reviewSearch.toLowerCase();
    return (
      (review.id.toLowerCase().includes(searchTerm) ||
        review.productName.toLowerCase().includes(searchTerm) ||
        review.userName.toLowerCase().includes(searchTerm) ||
        review.comment.toLowerCase().includes(searchTerm)) &&
      (reviewProductFilter ? review.productId === reviewProductFilter : true)
    );
  });

  const paginatedReviews = filteredReviews.slice(
    (reviewsPage - 1) * itemsPerPage,
    reviewsPage * itemsPerPage
  );

  // Filtros y paginación para repartidores (filtrando usuarios con rol 'deliveryPerson')
  const filteredDeliveryPersons = users
    .filter((user) => user.role === 'deliveryPerson')
    .filter((deliveryPerson) => {
      const searchTerm = deliveryPersonSearch.toLowerCase();
      return (
        deliveryPerson.id.toLowerCase().includes(searchTerm) ||
        (deliveryPerson.name?.toLowerCase().includes(searchTerm) ?? false) ||
        (deliveryPerson.email?.toLowerCase().includes(searchTerm) ?? false)
      );
    });

  const paginatedDeliveryPersons = filteredDeliveryPersons.slice(
    (deliveryPersonsPage - 1) * itemsPerPage,
    deliveryPersonsPage * itemsPerPage
  );

  const uniqueCategories = [...new Set(products.map((product) => product.category))];
  const uniqueBusinesses = users.filter((user) => user.role === 'business');

  const orderStatusData = [
    { name: 'Pendiente', value: orders.filter((o) => o.status === 'pending').length },
    { name: 'Enviado', value: orders.filter((o) => o.status === 'shipped').length },
    { name: 'Entregado', value: orders.filter((o) => o.status === 'delivered').length },
    { name: 'Cancelado', value: orders.filter((o) => o.status === 'cancelled').length },
  ];

  const revenueByBusiness = filteredBusinesses.map((business) => {
    const businessOrders = orders.filter((order) => order.businessId === business.id);
    const revenue = businessOrders.reduce(
      (sum, order) =>
        sum + (order.items?.reduce((subtotal, item) => subtotal + item.price * item.quantity, 0) || 0),
      0
    );
    return { name: business.clientInfo?.businessName || business.id, value: revenue };
  });

  // Funciones para exportar datos
  const handleExportOrders = () => {
    const csv = [
      ['ID', 'Cliente', 'Correo', 'Negocio', 'Estado', 'Total'],
      ...filteredOrders.map((order) => [
        order.id,
        order.userName,
        order.userEmail,
        order.businessName,
        order.status,
        order.total?.toFixed(2) || '0.00',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportBusinesses = () => {
    const csv = [
      ['ID', 'Nombre', 'Correo', 'Estado', 'Total Pedidos', 'Ingresos'],
      ...filteredBusinesses.map((business) => {
        const businessOrders = orders.filter((order) => order.businessId === business.id);
        const businessRevenue = businessOrders.reduce(
          (sum, order) =>
            sum + (order.items?.reduce((subtotal, item) => subtotal + item.price * item.quantity, 0) || 0),
          0
        );
        return [
          business.id,
          business.clientInfo?.businessName || 'N/A',
          business.email || 'N/A',
          business.status || 'Pendiente',
          businessOrders.length,
          businessRevenue.toFixed(2),
        ];
      }),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'businesses.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportReviews = () => {
    const csv = [
      ['ID', 'Producto', 'Cliente', 'Calificación', 'Comentario', 'Estado'],
      ...filteredReviews.map((review) => [
        review.id,
        review.productName,
        review.userName,
        review.rating,
        `"${review.comment}"`,
        review.status || 'Pendiente',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reviews.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Funciones para gestionar pedidos
  const handleOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });

      const order = orders.find((o) => o.id === orderId);
      if (order && order.customerId) {
        const statusText =
          newStatus === 'pending'
            ? 'Pendiente'
            : newStatus === 'shipped'
            ? 'Enviado'
            : newStatus === 'delivered'
            ? 'Entregado'
            : 'Cancelado';
        const notificationMessage = `Hola, el estado de tu pedido #${orderId} ha sido actualizado a "${statusText}". ${
          newStatus === 'shipped'
            ? 'Tu pedido está en camino y pronto lo recibirás.'
            : newStatus === 'delivered'
            ? 'Tu pedido ha sido entregado. ¡Gracias por tu compra!'
            : newStatus === 'cancelled'
            ? 'Lamentamos la cancelación. Si tienes alguna duda, contáctanos.'
            : 'Estamos preparando tu pedido con cuidado.'
        }`;
        await addNotification({
          userId: order.customerId,
          message: notificationMessage,
          type: 'client',
        });
        await addDoc(collection(db, 'notifications'), {
          userId: order.customerId,
          message: notificationMessage,
          type: 'client',
          timestamp: new Date().toISOString(),
        });
        toast.success('Notificación enviada al cliente.');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success('Estado del pedido actualizado correctamente.');
    } catch (error) {
      toast.error('Error al actualizar el estado: ' + error.message);
    }
  };

  // Funciones para gestionar usuarios
  const handleVerifyUser = (userId) => {
    toast.success(`Usuario ${userId} verificado.`);
    setActionMenuOpen(null);
  };

  const handleDenyUser = (userId) => {
    toast.success(`Usuario ${userId} denegado.`);
    setActionMenuOpen(null);
  };

  const handleSuspendUser = (userId) => {
    toast.success(`Usuario ${userId} suspendido.`);
    setActionMenuOpen(null);
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setShowEditUserModal(true);
    setActionMenuOpen(null);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    toast.success('Usuario actualizado correctamente.');
    setShowEditUserModal(false);
  };

  const handleDeleteUser = (userId) => {
    toast.success(`Usuario ${userId} eliminado.`);
  };

  // Funciones para gestionar negocios
  const handleEditBusiness = (business) => {
    setEditBusiness({
      id: business.id,
      name: business.clientInfo?.businessName || '',
      logo: business.logo || '',
    });
    setShowEditBusinessModal(true);
  };

  const handleUpdateBusiness = (e) => {
    e.preventDefault();
    toast.success('Negocio actualizado correctamente.');
    setShowEditBusinessModal(false);
  };

  const handleDeleteBusiness = (businessId) => {
    toast.success(`Negocio ${businessId} eliminado.`);
  };

  // Funciones para gestionar productos
  const handleAddProduct = (e) => {
    e.preventDefault();
    toast.success('Producto añadido correctamente.');
    setShowAddProductModal(false);
    setNewProduct({ name: '', price: '', category: '', image: '', business: '' });
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setShowEditProductModal(true);
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    toast.success('Producto actualizado correctamente.');
    setShowEditProductModal(false);
  };

  const handleDeleteProduct = (productId) => {
    toast.success(`Producto ${productId} eliminado.`);
  };

  // Funciones para gestionar reseñas
  const handleApproveReview = (reviewId) => {
    toast.success(`Reseña ${reviewId} aprobada.`);
  };

  const handleDeleteReview = (reviewId) => {
    toast.success(`Reseña ${reviewId} eliminada.`);
  };

  // Funciones para gestionar repartidores
  const handleEditDeliveryPerson = (deliveryPerson) => {
    setEditDeliveryPerson(deliveryPerson);
    setShowEditDeliveryPersonModal(true);
  };

  const handleUpdateDeliveryPerson = async (e) => {
    e.preventDefault();
    try {
      const deliveryPersonRef = doc(db, 'users', editDeliveryPerson.id);
      await updateDoc(deliveryPersonRef, {
        name: editDeliveryPerson.name,
        email: editDeliveryPerson.email,
        phone: editDeliveryPerson.phone,
      });
      toast.success('Repartidor actualizado correctamente.');
      setShowEditDeliveryPersonModal(false);
    } catch (error) {
      console.error('Error al actualizar repartidor:', error);
      toast.error('Error al actualizar el repartidor.');
    }
  };

  const handleDeleteDeliveryPerson = async (deliveryPersonId) => {
    try {
      await deleteDoc(doc(db, 'users', deliveryPersonId));
      toast.success(`Repartidor ${deliveryPersonId} eliminado.`);
    } catch (error) {
      console.error('Error al eliminar repartidor:', error);
      toast.error('Error al eliminar el repartidor.');
    }
  };

  // Funciones para notificaciones
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await addNotification({
        userId: notificationData.userId,
        message: notificationData.message,
        type: 'client',
      });
      await addDoc(collection(db, 'notifications'), {
        userId: notificationData.userId,
        message: notificationData.message,
        type: 'client',
        timestamp: new Date().toISOString(),
      });
      toast.success('Notificación enviada correctamente.');
      setShowNotificationModal(false);
      setNotificationData({ userId: '', message: '' });
    } catch (error) {
      toast.error('Error al enviar la notificación: ' + error.message);
    }
  };

  const toggleActionMenu = (userId) => {
    setActionMenuOpen(actionMenuOpen === userId ? null : userId);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-white relative"
    >
      {/* Sidebar para Escritorio */}
      <aside className="hidden md:block bg-custom-blue rounded-2xl text-white w-16 lg:w-64">
        <div className="p-4 lg:p-6">
          <h1 className="hidden lg:block text-xl lg:text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="flex-1">
          <ul className="space-y-2 p-2 lg:p-4">
            <li>
              <button
                onClick={() => setActiveSection('orders')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'orders' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <Package className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Pedidos</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('users')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'users' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <Users className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Usuarios</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('businesses')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'businesses' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Negocios</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('products')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'products' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Productos</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('deliveryPersons')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'deliveryPersons' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <Truck className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Repartidores</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('reviews')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'reviews' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <Star className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Reseñas</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('reports')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <BarChart2 className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Reportes</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveSection('notifications')}
                className={`flex items-center gap-2 p-2 lg:p-3 w-full text-left rounded-lg ${
                  activeSection === 'notifications' ? 'bg-gray-700' : 'hover:bg-gray-700'
                }`}
              >
                <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="hidden lg:inline text-sm lg:text-base">Notificaciones</span>
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 p-4 md:p-6 overflow-x-auto">
        {/* Carrusel de Navegación para Móvil */}
        <div className="md:hidden sticky top-0 bg-white z-10 pt-4 pb-2">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveSection('orders')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'orders'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Pedidos
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'users'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios
            </button>
            <button
              onClick={() => setActiveSection('businesses')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'businesses'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Negocios
            </button>
            <button
              onClick={() => setActiveSection('products')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'products'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Productos
            </button>
            <button
              onClick={() => setActiveSection('deliveryPersons')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'deliveryPersons'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              Repartidores
            </button>
            <button
              onClick={() => setActiveSection('reviews')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'reviews'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <Star className="w-4 h-4" />
              Reseñas
            </button>
            <button
              onClick={() => setActiveSection('reports')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'reports'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Reportes
            </button>
            <button
              onClick={() => setActiveSection('notifications')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                activeSection === 'notifications'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'bg-custom-blue text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notif.
            </button>
          </div>
        </div>

        {/* Sección de Pedidos */}
        {activeSection === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Vista de Escritorio */}
            <div className="hidden md:block">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Gestión de Pedidos</h2>
              <div className="mb-4 flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Buscar por ID, Cliente, Correo o Negocio"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="rounded-2xl w-full md:w-70 border-gray-300"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-2xl px-2 py-1 w-full md:w-auto"
                >
                  <option value="">Todos los Estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
                <Button
                  onClick={handleExportOrders}
                  className="text-[#1D4ED8] bg-custom-blue hover:bg-[#1D4ED8] hover:text-white rounded-2xl px-3 py-1 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Exportar
                </Button>
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                {paginatedOrders.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-sm min-w-[40px]">
                              <input type="checkbox" />
                            </th>
                            <th className="p-3 text-sm min-w-[80px]">ID</th>
                            <th className="p-3 text-sm min-w-[120px]">Cliente</th>
                            <th className="p-3 text-sm min-w-[150px]">Correo</th>
                            <th className="p-3 text-sm min-w-[120px]">Negocio</th>
                            <th className="p-3 text-sm min-w-[120px]">Estado</th>
                            <th className="p-3 text-sm min-w-[80px]">Total</th>
                            <th className="p-3 text-sm min-w-[150px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedOrders.map((order) => {
                            const statusStyles = {
                              pending: 'bg-yellow-100 text-yellow-700',
                              shipped: 'bg-blue-100 text-blue-700',
                              delivered: 'bg-green-100 text-green-700',
                              cancelled: 'bg-red-100 text-red-700',
                            };
                            const statusText = {
                              pending: 'En Preparación',
                              shipped: 'Enviado',
                              delivered: 'Entregado',
                              cancelled: 'Cancelado',
                            };

                            return (
                              <tr key={order.id} className="border-b">
                                <td className="p-3">
                                  <input type="checkbox" />
                                </td>
                                <td className="p-3 truncate max-w-[80px]">{order.id}</td>
                                <td className="p-3 truncate max-w-[120px]">{order.userName}</td>
                                <td className="p-3 truncate max-w-[150px]">{order.userEmail}</td>
                                <td className="p-3 truncate max-w-[120px]">{order.businessName}</td>
                                <td className="p-3">
                                  <select
                                    value={order.status}
                                    onChange={(e) => {
                                      setConfirmMessage(
                                        `¿Estás seguro de que deseas cambiar el estado del pedido #${order.id} a "${statusText[e.target.value]}"?`
                                      );
                                      setConfirmAction(() => () => handleStatusChange(order.id, e.target.value));
                                      setShowConfirmModal(true);
                                    }}
                                    className={`border border-gray-300 rounded-2xl px-2 py-1 text-sm w-full ${
                                      statusStyles[order.status] || 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <option value="pending">En Preparación</option>
                                    <option value="shipped">Enviado</option>
                                    <option value="delivered">Entregado</option>
                                    <option value="cancelled">Cancelado</option>
                                  </select>
                                </td>
                                <td className="p-3">${order.total?.toFixed(2) || '0.00'}</td>
                                <td className="p-3 flex gap-2 flex-wrap">
                                  <Button
                                    onClick={() => handleOrderDetails(order)}
                                    className="bg-custom-blue text-white hover:bg-custom-blue rounded-2xl px-2 py-1 text-sm transition-colors"
                                  >
                                    Detalles
                                  </Button>
                                  <Button
                                    onClick={() => handleEditUser(users.find((u) => u.id === order.customerId))}
                                    className="bg-black text-white hover:bg-custom-blue rounded-2xl px-2 py-1 text-sm transition-colors"
                                  >
                                    <Edit className="w-4 h-4 stroke-white" />
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setConfirmMessage(
                                        `¿Estás seguro de que deseas cancelar el pedido #${order.id}?`
                                      );
                                      setConfirmAction(() => () => handleStatusChange(order.id, 'cancelled'));
                                      setShowConfirmModal(true);
                                    }}
                                    className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-2 py-1 text-sm transition-colors"
                                  >
                                    <X className="w-4 h-4 stroke-[#EF4444]" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
                        disabled={ordersPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {ordersPage}/{Math.ceil(filteredOrders.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setOrdersPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredOrders.length / itemsPerPage))
                          )
                        }
                        disabled={ordersPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No se encontraron pedidos.</p>
                )}
              </div>
            </div>

            {/* Vista Móvil */}
            <div className="md:hidden pt-14">
              <div className="sticky top-14 bg-white z-10 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Gestión de Pedidos</h2>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Buscar pedido..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full border-gray-300 pl-8"
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-2xl px-2 py-1 text-sm"
                  >
                    <option value="">Estado</option>
                    <option value="pending">Pendiente</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                {paginatedOrders.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedOrders.map((order) => {
                      const statusStyles = {
                        pending: 'bg-yellow-100 text-yellow-700',
                        shipped: 'bg-blue-100 text-blue-700',
                        delivered: 'bg-green-100 text-green-700',
                        cancelled: 'bg-red-100 text-red-700',
                      };
                      const statusText = {
                        pending: 'En Preparación',
                        shipped: 'Enviado',
                        delivered: 'Entregado',
                        cancelled: 'Cancelado',
                      };

                      return (
                        <div
                          key={order.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                Pedido #{order.id}
                              </h3>
                              <p className="text-xs text-gray-600">{order.userName}</p>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              ${order.total?.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <p
                            className={`text-xs px-2 py-1 rounded inline-block ${
                              statusStyles[order.status] || 'bg-gray-200 text-gray-700'
                            } mb-3`}
                          >
                            Estado: {statusText[order.status] || 'Pendiente'}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleOrderDetails(order)}
                              className="flex-1 bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                            >
                              Detalles
                            </Button>
                            <Button
                              onClick={() => handleEditUser(users.find((u) => u.id === order.customerId))}
                              className="bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                            >
                              <Edit className="w-4 h-4 stroke-white" />
                            </Button>
                            <Button
                              onClick={() => {
                                setConfirmMessage(
                                  `¿Estás seguro de que deseas cancelar el pedido #${order.id}?`
                                );
                                setConfirmAction(() => () => handleStatusChange(order.id, 'cancelled'));
                                setShowConfirmModal(true);
                              }}
                              className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-3 py-1 text-sm transition-colors"
                            >
                              <X className="w-4 h-4 stroke-[#EF4444]" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
                        disabled={ordersPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {ordersPage}/{Math.ceil(filteredOrders.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setOrdersPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredOrders.length / itemsPerPage))
                          )
                        }
                        disabled={ordersPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No se encontraron pedidos.</p>
                )}
              </div>
            </div>

            {/* Modal de Detalles en Móvil */}
            {showOrderDetails && selectedOrder && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-2xl md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Detalles del Pedido #{selectedOrder.id}</h3>
                    <button onClick={() => setShowOrderDetails(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-semibold">Información del Cliente</h4>
                      <p className="text-sm">
                        <strong>Nombre:</strong> {selectedOrder.userName}
                      </p>
                      <p className="text-sm">
                        <strong>Correo:</strong> {selectedOrder.userEmail || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>ID del Cliente:</strong> {selectedOrder.customerId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold">Información del Negocio</h4>
                      <p className="text-sm">
                        <strong>Nombre:</strong> {selectedOrder.businessName}
                      </p>
                      <p className="text-sm">
                        <strong>ID del Negocio:</strong> {selectedOrder.businessIds?.[0] || selectedOrder.businessId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold">Detalles del Pedido</h4>
                      <p className="text-sm">
                        <strong>Estado:</strong> {selectedOrder.status || 'Pendiente'}
                      </p>
                      <p className="text-sm">
                        <strong>Fecha de Creación:</strong>{' '}
                        {selectedOrder.createdAt
                          ? format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy, HH:mm a')
                          : 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Total:</strong> ${selectedOrder.total?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold">Dirección de Entrega</h4>
                      <p className="text-sm">
                        <strong>Etiqueta:</strong> {selectedOrder.address?.addressLabel || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Dirección:</strong> {selectedOrder.address?.address || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Departamento:</strong> {selectedOrder.address?.department || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Distrito:</strong> {selectedOrder.address?.district || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <strong>Punto de Referencia:</strong> {selectedOrder.address?.referencePoint || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-semibold mb-2">Productos</h4>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        <div className="space-y-2">
                          {selectedOrder.items.map((item, index) => (
                            <div key={index} className="border-b py-2">
                              <p className="text-sm">
                                <strong>Producto:</strong> {item.name || 'N/A'}
                              </p>
                              <p className="text-sm">
                                <strong>Cantidad:</strong> {item.quantity || 'N/A'}
                              </p>
                              <p className="text-sm">
                                <strong>Precio Unitario:</strong> ${item.price?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-sm">
                                <strong>Subtotal:</strong> ${(item.price * item.quantity)?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No hay productos en este pedido.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sección de Usuarios */}
        {activeSection === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hidden md:block">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Gestión de Usuarios</h2>
              <div className="mb-4">
                <Input
                  placeholder="Buscar por ID o Nombre"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full md:w-70 border-gray-300"
                />
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-2xl">
                {paginatedUsers.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-sm min-w-[80px]">ID</th>
                            <th className="p-3 text-sm min-w-[120px]">Nombre</th>
                            <th className="p-3 text-sm min-w-[150px]">Correo</th>
                            <th className="p-3 text-sm min-w-[100px]">Rol</th>
                            <th className="p-3 text-sm min-w-[100px]">Estado</th>
                            <th className="p-3 text-sm min-w-[150px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUsers.map((user) => (
                            <tr key={user.id} className="border-b">
                              <td className="p-3 truncate max-w-[80px]">{user.id}</td>
                              <td className="p-3 truncate max-w-[120px]">{user.name || user.clientInfo?.firstName || 'N/A'}</td>
                              <td className="p-3 truncate max-w-[150px]">{user.email || 'N/A'}</td>
                              <td className="p-3">{user.role || 'N/A'}</td>
                              <td className="p-3">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs bg-gray-200 text-gray-700`}
                                >
                                  {user.status || 'Pendiente'}
                                </span>
                              </td>
                              <td className="p-3 flex gap-2 relative flex-wrap">
                                <div className="relative">
                                  <Button
                                    onClick={() => toggleActionMenu(user.id)}
                                    className="bg-black text-white hover:bg-gray-800 rounded px-2 py-1 text-sm transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4 stroke-white" />
                                  </Button>
                                  {actionMenuOpen === user.id && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10">
                                      <ul className="py-1">
                                        {user.status !== 'verified' && (
                                          <li>
                                            <button
                                              onClick={() => handleVerifyUser(user.id)}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                              Verificar
                                            </button>
                                          </li>
                                        )}
                                        {user.status !== 'denied' && (
                                          <li>
                                            <button
                                              onClick={() => handleDenyUser(user.id)}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                              Denegar
                                            </button>
                                          </li>
                                        )}
                                        {user.status !== 'suspended' && (
                                          <li>
                                            <button
                                              onClick={() => handleSuspendUser(user.id)}
                                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                              Suspender
                                            </button>
                                          </li>
                                        )}
                                        <li>
                                          <button
                                            onClick={() => handleEditUser(user)}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          >
                                            Editar
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-2 py-1 text-sm transition-colors"
                                >
                                  <Trash className="w-4 h-4 text-[#EF4444]" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                        disabled={usersPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {usersPage}/{Math.ceil(filteredUsers.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setUsersPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage))
                          )
                        }
                        disabled={usersPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No se encontraron usuarios.</p>
                )}
              </div>
            </div>

            <div className="md:hidden pt-14">
              <div className="sticky top-14 bg-white z-10 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Gestión de Usuarios</h2>
                <div className="relative">
                  <Input
                    placeholder="Buscar usuario..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full border-gray-300 pl-8"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="pt-2">
                {paginatedUsers.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              ID: {user.id}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {user.name || user.clientInfo?.firstName || 'N/A'}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                            {user.status || 'Pendiente'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Rol: {user.role || 'N/A'}</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditUser(user)}
                            className="flex-1 bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-3 py-1 text-sm transition-colors"
                          >
                            <Trash className="w-4 h-4 text-[#EF4444]" />
                          </Button>
                          <div className="relative">
                            <Button
                              onClick={() => toggleActionMenu(user.id)}
                              className="bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 stroke-white" />
                            </Button>
                            {actionMenuOpen === user.id && (
                              <div className="absolute right-0 bottom-10 w-40 bg-white border border-gray-300 rounded shadow-lg z-10">
                                <ul className="py-1">
                                  {user.status !== 'verified' && (
                                    <li>
                                      <button
                                        onClick={() => handleVerifyUser(user.id)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Verificar
                                      </button>
                                    </li>
                                  )}
                                  {user.status !== 'denied' && (
                                    <li>
                                      <button
                                        onClick={() => handleDenyUser(user.id)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Denegar
                                      </button>
                                    </li>
                                  )}
                                  {user.status !== 'suspended' && (
                                    <li>
                                      <button
                                        onClick={() => handleSuspendUser(user.id)}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Suspender
                                      </button>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setUsersPage((prev) => Math.max(prev - 1, 1))}
                        disabled={usersPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {usersPage}/{Math.ceil(filteredUsers.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setUsersPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage))
                          )
                        }
                        disabled={usersPage === Math.ceil(filteredUsers.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No se encontraron usuarios.</p>
                )}
              </div>
            </div>

            {showEditUserModal && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Editar Usuario</h3>
                    <button onClick={() => setShowEditUserModal(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <Input
                        value={editUser.name}
                        onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo</label>
                      <Input
                        value={editUser.email}
                        onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rol</label>
                      <select
                        value={editUser.role}
                        onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        required
                      >
                        <option value="client">Cliente</option>
                        <option value="business">Negocio</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-custom-blue hover:text-white rounded px-4 py-2 transition-colors"
                    >
                      Guardar Cambios
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sección de Negocios */}
        {activeSection === 'businesses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hidden md:block">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Gestión de Negocios</h2>
              <div className="mb-4 flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Buscar por ID o Nombre del Negocio"
                  value={businessSearch}
                  onChange={(e) => setBusinessSearch(e.target.value)}
                  className="rounded-2xl w-full md:w-70 border-gray-300"
                />
                <Button
                  onClick={handleExportBusinesses}
                  className="text-[#1D4ED8] bg-custom-blue hover:bg-[#1D4ED8] hover:text-white rounded-2xl px-3 py-1 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Exportar
                </Button>
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                {paginatedBusinesses.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-sm min-w-[80px]">ID</th>
                            <th className="p-3 text-sm min-w-[60px]">Logo</th>
                            <th className="p-3 text-sm min-w-[120px]">Nombre</th>
                            <th className="p-3 text-sm min-w-[150px]">Correo</th>
                            <th className="p-3 text-sm min-w-[100px]">Fecha de Registro</th>
                            <th className="p-3 text-sm min-w-[100px]">Total Pedidos</th>
                            <th className="p-3 text-sm min-w-[80px]">Ingresos</th>
                            <th className="p-3 text-sm min-w-[120px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedBusinesses.map((business) => {
                            const businessOrders = orders.filter((order) => order.businessId === business.id);
                            const businessRevenue = businessOrders.reduce(
                              (sum, order) =>
                                sum +
                                (order.items?.reduce((subtotal, item) => subtotal + item.price * item.quantity, 0) || 0),
                              0
                            );
                            return (
                              <tr key={business.id} className="border-b">
                                <td className="p-3 truncate max-w-[80px]">{business.id}</td>
                                <td className="p-3">
                                  <img
                                    src={business.logo || 'https://via.placeholder.com/50'}
                                    alt={business.clientInfo?.businessName || 'Negocio'}
                                    className="w-10 h-10 object-cover rounded-full"
                                    onError={(e) => (e.target.src = 'https://via.placeholder.com/50')}
                                  />
                                </td>
                                <td className="p-3 truncate max-w-[120px]">{business.clientInfo?.businessName || 'N/A'}</td>
                                <td className="p-3 truncate max-w-[150px]">{business.email || 'N/A'}</td>
                                <td className="p-3">
                                  {business.createdAt
                                    ? format(new Date(business.createdAt), 'dd/MM/yyyy')
                                    : 'N/A'}
                                </td>
                                <td className="p-3">{businessOrders.length}</td>
                                <td className="p-3">${businessRevenue.toFixed(2)}</td>
                                <td className="p-3 flex gap-2 flex-wrap">
                                  <Button
                                    onClick={() => handleEditBusiness(business)}
                                    className="bg-black text-white hover:bg-gray-800 rounded px-2 py-1 text-sm transition-colors"
                                  >
                                    <Edit className="w-4 h-4 stroke-white" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteBusiness(business.id)}
                                    className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-2 py-1 text-sm transition-colors"
                                  >
                                    <Trash className="w-4 h-4 text-[#EF4444]" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setBusinessPage((prev) => Math.max(prev - 1, 1))}
                        disabled={businessPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {businessPage}/{Math.ceil(filteredBusinesses.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setBusinessPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredBusinesses.length / itemsPerPage))
                          )
                        }
                        disabled={businessPage === Math.ceil(filteredBusinesses.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No se encontraron negocios verificados.</p>
                )}
              </div>
            </div>

            <div className="md:hidden pt-14">
              <div className="sticky top-14 bg-white z-10 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Gestión de Negocios</h2>
                <div className="relative">
                  <Input
                    placeholder="Buscar negocio..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    className="w-full border-gray-300 pl-8"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="pt-2">
                {paginatedBusinesses.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedBusinesses.map((business) => {
                      const businessOrders = orders.filter((order) => order.businessId === business.id);
                      const businessRevenue = businessOrders.reduce(
                        (sum, order) =>
                          sum +
                          (order.items?.reduce((subtotal, item) => subtotal + item.price * item.quantity, 0) || 0),
                        0
                      );
                      return (
                        <div
                          key={business.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={business.logo || 'https://via.placeholder.com/50'}
                              alt={business.clientInfo?.businessName || 'Negocio'}
                              className="w-8 h-8 object-cover rounded-full"
                              onError={(e) => (e.target.src = 'https://via.placeholder.com/50')}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                ID: {business.id}
                              </h3>
                              <p className="text-xs text-gray-600 truncate">
                                {business.clientInfo?.businessName || 'N/A'}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              ${businessRevenue.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">
                            Pedidos: {businessOrders.length} | Registrado:{' '}
                            {business.createdAt
                              ? format(new Date(business.createdAt), 'dd/MM/yyyy')
                              : 'N/A'}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditBusiness(business)}
                              className="flex-1 bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDeleteBusiness(business.id)}
                              className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-3 py-1 text-sm transition-colors"
                            >
                              <Trash className="w-4 h-4 text-[#EF4444]" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setBusinessPage((prev) => Math.max(prev - 1, 1))}
                        disabled={businessPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {businessPage}/{Math.ceil(filteredBusinesses.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setBusinessPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredBusinesses.length / itemsPerPage))
                          )
                        }
                        disabled={businessPage === Math.ceil(filteredBusinesses.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No se encontraron negocios verificados.</p>
                )}
              </div>
            </div>

            {showEditBusinessModal && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Editar Negocio</h3>
                    <button onClick={() => setShowEditBusinessModal(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateBusiness} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                      <Input
                        value={editBusiness.name}
                        onChange={(e) => setEditBusiness({ ...editBusiness, name: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL del Logo</label>
                      <Input
                        value={editBusiness.logo}
                        onChange={(e) => setEditBusiness({ ...editBusiness, logo: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-custom-blue hover:text-white rounded px-4 py-2 transition-colors"
                    >
                      Guardar Cambios
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* Sección de Productos */}
        {activeSection === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hidden md:block">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Gestión de Productos</h2>
                <Button
                  onClick={() => setShowAddProductModal(true)}
                  className="text-[#1D4ED8] bg-custom-blue hover:bg-[#1D4ED8] hover:text-white rounded-2xl px-3 py-1 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" /> Añadir Producto
                </Button>
              </div>
              <div className="mb-4 flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Buscar por ID, Nombre o Negocio"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="rounded-2xl w-full md:w-70 border-gray-300"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-2xl px-2 py-1 w-full md:w-auto"
                >
                  <option value="">Todas las Categorías</option>
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                {paginatedProducts.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-sm min-w-[80px]">ID</th>
                            <th className="p-3 text-sm min-w-[60px]">Imagen</th>
                            <th className="p-3 text-sm min-w-[120px]">Nombre</th>
                            <th className="p-3 text-sm min-w-[100px]">Categoría</th>
                            <th className="p-3 text-sm min-w-[80px]">Precio</th>
                            <th className="p-3 text-sm min-w-[120px]">Negocio</th>
                            <th className="p-3 text-sm min-w-[120px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedProducts.map((product) => (
                            <tr key={product.id} className="border-b">
                              <td className="p-3 truncate max-w-[80px]">{product.id}</td>
                              <td className="p-3">
                                <img
                                  src={product.image || 'https://via.placeholder.com/50'}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded"
                                  onError={(e) => (e.target.src = 'https://via.placeholder.com/50')}
                                />
                              </td>
                              <td className="p-3 truncate max-w-[120px]">{product.name}</td>
                              <td className="p-3">{product.category}</td>
                              <td className="p-3">${product.price?.toFixed(2)}</td>
                              <td className="p-3 truncate max-w-[120px]">{product.business}</td>
                              <td className="p-3 flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => handleEditProduct(product)}
                                  className="bg-black text-white hover:bg-gray-800 rounded px-2 py-1 text-sm transition-colors"
                                >
                                  <Edit className="w-4 h-4 stroke-white" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-2 py-1 text-sm transition-colors"
                                >
                                  <Trash className="w-4 h-4 text-[#EF4444]" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={productsPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {productsPage}/{Math.ceil(filteredProducts.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setProductsPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage))
                          )
                        }
                        disabled={productsPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No se encontraron productos.</p>
                )}
              </div>
            </div>

            <div className="md:hidden pt-14">
              <div className="sticky top-14 bg-white z-10 p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold text-gray-900">Gestión de Productos</h2>
                  <Button
                    onClick={() => setShowAddProductModal(true)}
                    className="text-[#1D4ED8] bg-custom-blue hover:bg-[#1D4ED8] hover:text-white rounded-2xl px-3 py-1 text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Buscar producto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full border-gray-300 pl-8"
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="border border-gray-300 rounded-2xl px-2 py-1 text-sm"
                  >
                    <option value="">Categoría</option>
                    {uniqueCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-2">
                {paginatedProducts.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <img
                            src={product.image || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/50')}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-600 truncate">{product.business}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ${product.price?.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Categoría: {product.category}</p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-3 py-1 text-sm transition-colors"
                          >
                            <Trash className="w-4 h-4 text-[#EF4444]" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={productsPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {productsPage}/{Math.ceil(filteredProducts.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setProductsPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage))
                          )
                        }
                        disabled={productsPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No se encontraron productos.</p>
                )}
              </div>
            </div>

            {showAddProductModal && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Añadir Producto</h3>
                    <button onClick={() => setShowAddProductModal(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <Input
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Precio</label>
                      <Input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoría</label>
                      <Input
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL de la Imagen</label>
                      <Input
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Negocio</label>
                      <select
                        value={newProduct.business}
                        onChange={(e) => setNewProduct({ ...newProduct, business: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        required
                      >
                        <option value="">Selecciona un Negocio</option>
                        {uniqueBusinesses.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.clientInfo?.businessName || business.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full border border-[#1D4ED8] text-[#1D4ED8] bg-white hover:bg-[#1D4ED8] hover:text-white rounded px-4 py-2 transition-colors"
                    >
                      Añadir Producto
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {showEditProductModal && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Editar Producto</h3>
                    <button onClick={() => setShowEditProductModal(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <Input
                        value={editProduct.name}
                        onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Precio</label>
                      <Input
                        type="number"
                        value={editProduct.price}
                        onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Categoría</label>
                      <Input
                        value={editProduct.category}
                        onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">URL de la Imagen</label>
                      <Input
                        value={editProduct.image}
                        onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })}
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Negocio</label>
                      <select
                        value={editProduct.business}
                        onChange={(e) => setEditProduct({ ...editProduct, business: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        required
                      >
                        <option value="">Selecciona un Negocio</option>
                        {uniqueBusinesses.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.clientInfo?.businessName || business.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-custom-blue hover:text-white rounded px-4 py-2 transition-colors"
                    >
                      Guardar Cambios
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sección de Repartidores */}
        {activeSection === 'deliveryPersons' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hidden md:block">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Gestión de Repartidores</h2>
              <div className="mb-4">
                <Input
                  placeholder="Buscar por ID o Nombre"
                  value={deliveryPersonSearch}
                  onChange={(e) => setDeliveryPersonSearch(e.target.value)}
                  className="rounded-2xl w-full md:w-70 border-gray-300"
                />
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                {paginatedDeliveryPersons.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-sm min-w-[80px]">ID</th>
                            <th className="p-3 text-sm min-w-[120px]">Nombre</th>
                            <th className="p-3 text-sm min-w-[150px]">Correo</th>
                            <th className="p-3 text-sm min-w-[120px]">Teléfono</th>
                            <th className="p-3 text-sm min-w-[150px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedDeliveryPersons.map((deliveryPerson) => (
                            <tr key={deliveryPerson.id} className="border-b">
                              <td className="p-3 truncate max-w-[80px]">{deliveryPerson.id}</td>
                              <td className="p-3 truncate max-w-[120px]">{deliveryPerson.name || 'N/A'}</td>
                              <td className="p-3 truncate max-w-[150px]">{deliveryPerson.email || 'N/A'}</td>
                              <td className="p-3">{deliveryPerson.phone || 'N/A'}</td>
                              <td className="p-3 flex gap-2 flex-wrap">
                                <Button
                                  onClick={() => handleEditDeliveryPerson(deliveryPerson)}
                                  className="bg-black text-white hover:bg-gray-800 rounded px-2 py-1 text-sm transition-colors"
                                >
                                  <Edit className="w-4 h-4 stroke-white" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteDeliveryPerson(deliveryPerson.id)}
                                  className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-2 py-1 text-sm transition-colors"
                                >
                                  <Trash className="w-4 h-4 text-[#EF4444]" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setDeliveryPersonsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={deliveryPersonsPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {deliveryPersonsPage}/{Math.ceil(filteredDeliveryPersons.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setDeliveryPersonsPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredDeliveryPersons.length / itemsPerPage))
                          )
                        }
                        disabled={deliveryPersonsPage === Math.ceil(filteredDeliveryPersons.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No se encontraron repartidores.</p>
                )}
              </div>
            </div>

            <div className="md:hidden pt-14">
              <div className="sticky top-14 bg-white z-10 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Gestión de Repartidores</h2>
                <div className="relative">
                  <Input
                    placeholder="Buscar repartidor..."
                    value={deliveryPersonSearch}
                    onChange={(e) => setDeliveryPersonSearch(e.target.value)}
                    className="w-full border-gray-300 pl-8"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="pt-2">
                {paginatedDeliveryPersons.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedDeliveryPersons.map((deliveryPerson) => (
                      <div
                        key={deliveryPerson.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              ID: {deliveryPerson.id}
                            </h3>
                            <p className="text-xs text-gray-600">{deliveryPerson.name || 'N/A'}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Correo: {deliveryPerson.email || 'N/A'} | Teléfono: {deliveryPerson.phone || 'N/A'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditDeliveryPerson(deliveryPerson)}
                            className="flex-1 bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteDeliveryPerson(deliveryPerson.id)}
                            className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-3 py-1 text-sm transition-colors"
                          >
                            <Trash className="w-4 h-4 text-[#EF4444]" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setDeliveryPersonsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={deliveryPersonsPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {deliveryPersonsPage}/{Math.ceil(filteredDeliveryPersons.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setDeliveryPersonsPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredDeliveryPersons.length / itemsPerPage))
                          )
                        }
                        disabled={deliveryPersonsPage === Math.ceil(filteredDeliveryPersons.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No se encontraron repartidores.</p>
                )}
              </div>
            </div>

            {showEditDeliveryPersonModal && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Editar Repartidor</h3>
                    <button onClick={() => setShowEditDeliveryPersonModal(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateDeliveryPerson} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre</label>
                      <Input
                        value={editDeliveryPerson.name || ''}
                        onChange={(e) =>
                          setEditDeliveryPerson({ ...editDeliveryPerson, name: e.target.value })
                        }
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Correo</label>
                      <Input
                        value={editDeliveryPerson.email || ''}
                        onChange={(e) =>
                          setEditDeliveryPerson({ ...editDeliveryPerson, email: e.target.value })
                        }
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <Input
                        value={editDeliveryPerson.phone || ''}
                        onChange={(e) =>
                          setEditDeliveryPerson({ ...editDeliveryPerson, phone: e.target.value })
                        }
                        className="w-full border-gray-300"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-custom-blue hover:text-white rounded px-4 py-2 transition-colors"
                    >
                      Guardar Cambios
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sección de Reseñas */}
        {activeSection === 'reviews' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="hidden md:block">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Gestión de Reseñas</h2>
              <div className="mb-4 flex flex-col md:flex-row gap-2">
                <Input
                  placeholder="Buscar por ID, Producto o Cliente"
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="rounded-2xl w-full md:w-70 border-gray-300"
                />
                <select
                  value={reviewProductFilter}
                  onChange={(e) => setReviewProductFilter(e.target.value)}
                  className="border border-gray-300 rounded-2xl px-2 py-1 w-full md:w-auto"
                >
                  <option value="">Todos los Productos</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleExportReviews}
                  className="text-[#1D4ED8] bg-custom-blue hover:bg-[#1D4ED8] hover:text-white rounded-2xl px-3 py-1 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" /> Exportar
                </Button>
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                {paginatedReviews.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="p-3 text-sm min-w-[80px]">ID</th>
                            <th className="p-3 text-sm min-w-[120px]">Producto</th>
                            <th className="p-3 text-sm min-w-[120px]">Cliente</th>
                            <th className="p-3 text-sm min-w-[80px]">Calificación</th>
                            <th className="p-3 text-sm min-w-[150px]">Comentario</th>
                            <th className="p-3 text-sm min-w-[100px]">Estado</th>
                            <th className="p-3 text-sm min-w-[120px]">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedReviews.map((review) => (
                            <tr key={review.id} className="border-b">
                              <td className="p-3 truncate max-w-[80px]">{review.id}</td>
                              <td className="p-3 truncate max-w-[120px]">{review.productName}</td>
                              <td className="p-3 truncate max-w-[120px]">{review.userName}</td>
                              <td className="p-3">{review.rating}/5</td>
                              <td className="p-3 truncate max-w-[150px]">{review.comment}</td>
                              <td className="p-3">
                                <span
                                  className={`inline-block px-2 py-1 rounded text-xs ${
                                    review.status === 'approved'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                >
                                  {review.status === 'approved' ? 'Aprobada' : 'Pendiente'}
                                </span>
                              </td>
                              <td className="p-3 flex gap-2 flex-wrap">
                                {review.status !== 'approved' && (
                                  <Button
                                    onClick={() => handleApproveReview(review.id)}
                                    className="bg-black text-white hover:bg-gray-800 rounded px-2 py-1 text-sm transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4 stroke-white" />
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-2 py-1 text-sm transition-colors"
                                >
                                  <Trash className="w-4 h-4 text-[#EF4444]" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setReviewsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reviewsPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {reviewsPage}/{Math.ceil(filteredReviews.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setReviewsPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredReviews.length / itemsPerPage))
                          )
                        }
                        disabled={reviewsPage === Math.ceil(filteredReviews.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-gray-500">No se encontraron reseñas.</p>
                )}
              </div>
            </div>

            <div className="md:hidden pt-14">
              <div className="sticky top-14 bg-white z-10 p-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Gestión de Reseñas</h2>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Buscar reseña..."
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      className="w-full border-gray-300 pl-8"
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  <select
                    value={reviewProductFilter}
                    onChange={(e) => setReviewProductFilter(e.target.value)}
                    className="border border-gray-300 rounded-2xl px-2 py-1 text-sm"
                  >
                    <option value="">Producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-2">
                {paginatedReviews.length > 0 ? (
                  <div className="space-y-3">
                    {paginatedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {review.productName}
                            </h3>
                            <p className="text-xs text-gray-600">{review.userName}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{review.rating}/5</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{review.comment}</p>
                        <p
                          className={`text-xs px-2 py-1 rounded inline-block mb-3 ${
                            review.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {review.status === 'approved' ? 'Aprobada' : 'Pendiente'}
                        </p>
                        <div className="flex gap-2">
                          {review.status !== 'approved' && (
                            <Button
                              onClick={() => handleApproveReview(review.id)}
                              className="flex-1 bg-black text-white hover:bg-gray-800 rounded px-3 py-1 text-sm transition-colors"
                            >
                              Aprobar
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteReview(review.id)}
                            className="bg-gray-200 text-[#000000] hover:bg-gray-300 rounded px-3 py-1 text-sm transition-colors"
                          >
                            <Trash className="w-4 h-4 text-[#EF4444]" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button
                        onClick={() => setReviewsPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reviewsPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Anterior
                      </button>
                      <span className="text-sm">
                        {reviewsPage}/{Math.ceil(filteredReviews.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setReviewsPage((prev) =>
                            Math.min(prev + 1, Math.ceil(filteredReviews.length / itemsPerPage))
                          )
                        }
                        disabled={reviewsPage === Math.ceil(filteredReviews.length / itemsPerPage)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 text-sm"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 mt-4">No se encontraron reseñas.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sección de Reportes */}
        {activeSection === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Reportes y Estadísticas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Distribución de Pedidos por Estado</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white border border-gray-300 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Ingresos por Negocio</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByBusiness}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#1D4ED8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sección de Notificaciones */}
        {activeSection === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">Enviar Notificaciones</h2>
            <div className="bg-white border border-gray-300 p-4 rounded-lg">
              <Button
                onClick={() => setShowNotificationModal(true)}
                className="text-[#1D4ED8] bg-custom-blue hover:bg-[#1D4ED8] hover:text-white rounded-2xl px-3 py-1 transition-colors mb-4"
              >
                <Bell className="w-4 h-4 mr-2" /> Nueva Notificación
              </Button>
              <p className="text-gray-500">Aquí puedes enviar notificaciones a los usuarios.</p>
            </div>

            {showNotificationModal && (
              <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
                <div className="w-full h-full md:w-auto md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:border md:border-gray-300 bg-white overflow-y-auto p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Enviar Notificación</h3>
                    <button onClick={() => setShowNotificationModal(false)} className="text-gray-700">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Usuario</label>
                      <select
                        value={notificationData.userId}
                        onChange={(e) =>
                          setNotificationData({ ...notificationData, userId: e.target.value })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        required
                      >
                        <option value="">Selecciona un Usuario</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.clientInfo?.firstName || user.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mensaje</label>
                      <textarea
                        value={notificationData.message}
                        onChange={(e) =>
                          setNotificationData({ ...notificationData, message: e.target.value })
                        }
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                        rows="4"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full border border-[#1D4ED8] text-[#1D4ED8] bg-white hover:bg-[#1D4ED8] hover:text-white rounded px-4 py-2 transition-colors"
                    >
                      Enviar Notificación
                    </Button>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Modal de Confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-white z-50 md:bg-black md:bg-opacity-50 flex items-center justify-center md:p-4">
            <div className="w-full h-full md:w-auto md:max-w-md md:rounded-2xl md:border md:border-gray-300 bg-white p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold">Confirmar Acción</h3>
              </div>
              <p className="text-sm text-gray-700 mb-6">{confirmMessage}</p>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowConfirmModal(false)}
                  className="border border-gray-300 text-gray-700 hover:bg-gray-100 rounded px-4 py-2 transition-colors"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    confirmAction();
                    setShowConfirmModal(false);
                  }}
                  className="border border-[#1D4ED8] text-[#1D4ED8] bg-white hover:bg-[#1D4ED8] hover:text-white rounded px-4 py-2 transition-colors"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}