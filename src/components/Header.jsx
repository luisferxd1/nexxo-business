// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ShoppingCart, Bell, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, onSnapshot, doc as firestoreDoc, updateDoc, getDoc } from 'firebase/firestore';
import logo from '../assets/logo.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

export default function Header() {
  const { user, loading } = useAuth();
  const { unreadNotifications } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartContext = useCart();
  const cartCount = cartContext && cartContext.getCartCount ? cartContext.getCartCount() : 0;

  // Depuración
  useEffect(() => {
    console.log('unreadNotifications en Header:', unreadNotifications);
  }, [unreadNotifications]);

  useEffect(() => {
    if (loading || !user) {
      setOrders([]);
      return;
    }

    if (user.role === 'admin') {
      const ordersQuery = collection(db, "orders");
      const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
        try {
          const ordersData = await Promise.all(
            snapshot.docs.map(async (orderDoc) => {
              const orderData = { id: orderDoc.id, ...orderDoc.data() };
              if (orderData.userId) {
                try {
                  const userDocRef = firestoreDoc(db, 'users', orderData.userId);
                  const userDocSnap = await getDoc(userDocRef);
                  const userData = userDocSnap.exists() ? userDocSnap.data() : {};
                  return {
                    ...orderData,
                    customerName: userData.name || 'Desconocido',
                    customerEmail: userData.email || 'N/A',
                    customerAddress: orderData.address
                      ? `${orderData.addressLabel || ''} - ${orderData.address}, ${orderData.district}, ${orderData.department} (Ref: ${orderData.referencePoint || 'N/A'})`
                      : 'N/A',
                  };
                } catch (error) {
                  console.error(`Error al obtener datos del usuario para el pedido ${orderData.id}:`, error);
                  return {
                    ...orderData,
                    customerName: 'Desconocido',
                    customerEmail: 'N/A',
                    customerAddress: orderData.address
                      ? `${orderData.addressLabel || ''} - ${orderData.address}, ${orderData.district}, ${orderData.department} (Ref: ${orderData.referencePoint || 'N/A'})`
                      : 'N/A',
                  };
                }
              }
              return {
                ...orderData,
                customerName: 'Desconocido',
                customerEmail: 'N/A',
                customerAddress: orderData.address
                  ? `${orderData.addressLabel || ''} - ${orderData.address}, ${orderData.district}, ${orderData.department} (Ref: ${orderData.referencePoint || 'N/A'})`
                  : 'N/A',
              };
            })
          );
          setOrders(ordersData);
        } catch (error) {
          console.error('Error al cargar pedidos:', error);
          setOrders([]);
        }
      }, (error) => {
        console.error('Error en onSnapshot:', error);
        setOrders([]);
      });

      return () => unsubscribeOrders();
    }
  }, [user, loading]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const orderDocRef = firestoreDoc(db, 'orders', orderId);
      await updateDoc(orderDocRef, { status: newStatus });
    } catch (error) {
      console.error('Error al actualizar el estado del pedido:', error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    setShowLogoutModal(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <header className="flex flex-col md:flex-row justify-between items-center py-4 px-4 bg-white shadow-md">
        {/* Logo y botón hamburguesa */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <img src={logo} alt="NEXXO Business Logo" className="h-12 w-auto" />
          <button
            className="md:hidden text-custom-blue focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navegación */}
        <nav
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } md:flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0 w-full md:w-auto`}
        >
          <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
          </Button>
          <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
            <Link to="/categories" onClick={() => setIsMenuOpen(false)}>Categorías</Link>
          </Button>
          {user?.role === 'admin' ? (
            <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
            </Button>
          ) : user?.role === 'business' && user?.status === 'pending' ? (
            <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto" disabled>
              ¿Eres negocio? (Pendiente de verificación)
            </Button>
          ) : user?.role === 'business' && user?.status === 'verified' ? (
            <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
              <Link to="/business" onClick={() => setIsMenuOpen(false)}>Panel de Negocio</Link>
            </Button>
          ) : null}
          <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
            <Link to="/track" onClick={() => setIsMenuOpen(false)}>Rastrea tu pedido</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Mi perfil</Link>
              </Button>
              <Button
                variant="ghost"
                className="text-custom-blue rounded-2xl w-full md:w-auto"
                onClick={() => {
                  setShowLogoutModal(true);
                  setIsMenuOpen(false);
                }}
              >
                Cerrar Sesión
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Ingresar</Link>
              </Button>
              <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
                <Link to="/register-business" onClick={() => setIsMenuOpen(false)}>¿Eres negocio?</Link>
              </Button>
            </>
          )}
          {user?.role === 'admin' && (
            <div className="relative w-full md:w-auto">
              <Button
                className="rounded-full bg-custom-blue p-2 w-full md:w-auto"
                onClick={() => {
                  toggleNotifications();
                  setIsMenuOpen(false);
                }}
              >
                <Bell className="w-5 h-5 text-white" />
                {orders.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {orders.length}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-full md:w-96 bg-white border rounded-lg shadow-lg p-4 z-10">
                  <h4 className="font-semibold mb-2">Notificaciones de Pedidos</h4>
                  {orders.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {orders.map((order) => (
                        <div key={order.id} className="p-3 border-b">
                          <p><strong>ID del pedido:</strong> {order.id}</p>
                          <p><strong>Cliente:</strong> {order.customerName}</p>
                          <p><strong>Correo:</strong> {order.customerEmail}</p>
                          <p><strong>Dirección:</strong> {order.customerAddress}</p>
                          <p><strong>Productos:</strong></p>
                          <ul className="list-disc pl-5">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, index) => (
                                <li key={index}>
                                  {item.name} - Cantidad: {item.quantity}
                                </li>
                              ))
                            ) : (
                              <li>No hay productos</li>
                            )}
                          </ul>
                          <p><strong>Estado:</strong> {order.status || 'Pendiente'}</p>
                          <div className="mt-2">
                            <label className="block text-sm font-medium">Actualizar Estado:</label>
                            <select
                              value={order.status || 'Pendiente'}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className="mt-1 block w-full border rounded-lg p-1"
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Enviado">Enviado</option>
                              <option value="Entregado">Entregado</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No hay pedidos.</p>
                  )}
                </div>
              )}
            </div>
          )}
          {user?.role !== 'admin' && (
            <>
              <Link to="/notifications" className="relative w-full md:w-auto" onClick={() => setIsMenuOpen(false)}>
                <Button className="rounded-full bg-custom-blue p-2 w-full md:w-auto">
                  <Bell className="w-5 h-5 text-white" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/cart" className="relative w-full md:w-auto" onClick={() => setIsMenuOpen(false)}>
                <Button className="rounded-full bg-custom-blue p-2 w-full md:w-auto">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" className="text-custom-blue rounded-2xl w-full md:w-auto">
                <Link to="/checkout" onClick={() => setIsMenuOpen(false)}>Checkout</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">¿Estás seguro?</h2>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres cerrar sesión? Se cerrará tu sesión actual y necesitarás iniciar sesión nuevamente para acceder a tu cuenta.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-2xl hover:bg-gray-300"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-custom-blue text-white rounded-2xl hover:bg-blue-600"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}