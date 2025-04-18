// src/components/Header.jsx
import { Button } from './ui/button';
import { ShoppingCart, Bell, Package, User, LogIn, Store, LayoutDashboard, Home, MessageSquare, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../assets/Nlv.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';

export default function Header() {
  const { user, userRole, userStatus } = useAuth();
  const { unreadNotifications } = useNotifications();
  const cartContext = useCart();
  const cartCount = cartContext && cartContext.getCartCount ? cartContext.getCartCount() : 0;

  // Determinar la ruta de rastreo según el rol del usuario
  const trackRoute = userRole === 'client' ? '/track-client' : userRole === 'business' ? '/track' : '/login';

  return (
    <>
      {/* Navegación para pantallas grandes (md y superiores) */}
      <header className="hidden md:flex flex-col justify-between items-center py-2 px-4">
        {/* Logo y Navegación */}
        <div className="w-full flex justify-between items-center">
          {/* Logo a la izquierda */}
          <div className="flex items-center">
            <Link to="/">
              <img src={logo} alt="NEXXO Business Logo" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Navegación a la derecha */}
          <nav className="flex flex-row items-center space-x-4">
            {/* Panel Admin (solo para admin) */}
            {user && userRole === 'admin' && (
              <Button variant="ghost" className="text-custom-blue rounded-2xl">
                <Link to="/admin">Dashboard</Link>
              </Button>
            )}

            {/* Panel de Negocio (solo para business verificado o pendiente) */}
            {user && userRole === 'business' && userStatus === 'pending' ? (
              <Button variant="ghost" className="text-custom-blue rounded-2xl" disabled>
                ¿Eres negocio? (Pendiente de verificación)
              </Button>
            ) : user && userRole === 'business' && userStatus === 'verified' ? (
              <Button variant="ghost" className="text-custom-blue rounded-2xl">
                <Link to="/business">Dashboard</Link>
              </Button>
            ) : null}

            {/* Panel de Repartidor (solo para deliveryPerson) */}
            {user && userRole === 'deliveryPerson' && (
              <Button variant="ghost" className="text-custom-blue rounded-2xl">
                <Link to="/delivery-person">Dashboard Repartidor</Link>
              </Button>
            )}

            {/* Mensajes (solo para clientes) */}
            {user && userRole === 'client' && (
              <Button variant="ghost" className="text-custom-blue rounded-2xl">
                <Link to="/client">Mensajes</Link>
              </Button>
            )}

            {/* Rastrea tu pedido (dinámico según el rol) */}
            {user && (userRole === 'client' || userRole === 'business') && (
              <Button variant="ghost" className="text-custom-blue rounded-2xl">
                <Link to={trackRoute}>Rastrea tu pedido</Link>
              </Button>
            )}

            {user ? (
              <>
                {/* Mi perfil */}
                <Button variant="ghost" className="text-custom-blue rounded-2xl">
                  <Link to="/profile">Mi perfil</Link>
                </Button>

                {/* Notificaciones */}
                <Link to="/notifications" className="relative">
                  <Button className="rounded-full bg-custom-blue p-2">
                    <Bell className="w-5 h-5 text-white" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Carrito (solo para no admin) */}
                {userRole !== 'admin' && (
                  <Link to="/cart" className="relative">
                    <Button className="rounded-full bg-custom-blue p-2">
                      <ShoppingCart className="w-5 h-5 text-white" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                {/* Ingresar */}
                <Button variant="ghost" className="text-custom-blue rounded-2xl">
                  <Link to="/login">Ingresar</Link>
                </Button>

                {/* ¿Eres negocio? */}
                <Button variant="ghost" className="text-custom-blue rounded-2xl">
                  <Link to="/register-business">¿Eres negocio?</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Logo, Notificaciones, Carrito y Barra de Navegación para pantallas pequeñas (móviles) */}
      <div className="md:hidden">
        {/* Logo y Notificaciones/Carrito en la parte superior */}
        <div className="flex justify-between items-center py-2 px-3">
          {/* Logo a la izquierda */}
          <Link to="/">
            <img src={logo} alt="NEXXO Business Logo" className="h-8 w-auto" />
          </Link>

          {/* Notificaciones y Carrito a la derecha */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Notificaciones */}
              <Link to="/notifications" className="relative" title="Notificaciones">
                <button className="text-custom-blue hover:text-blue-700">
                  <Bell className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </Link>

              {/* Carrito (solo para no admin) */}
              {userRole !== 'admin' && (
                <Link to="/cart" className="relative" title="Carrito">
                  <button className="text-custom-blue hover:text-blue-700">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Barra de navegación fija en la parte inferior */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-white shadow-t-md flex justify-around items-center py-2 px-2 z-50"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', // Añadimos 8px extra para mayor seguridad
          }}
        >
          {/* Botón de Home (Inicio) */}
          <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
            <Link to="/" title="Inicio">
              <Home className="w-7 h-7" />
            </Link>
          </button>

          {/* Panel Admin (solo para admin) */}
          {user && userRole === 'admin' && (
            <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
              <Link to="/admin" title="Dashboard">
                <LayoutDashboard className="w-7 h-7" />
              </Link>
            </button>
          )}

          {/* Panel de Negocio (solo para business verificado o pendiente) */}
          {user && userRole === 'business' && userStatus === 'pending' ? (
            <button className="text-custom-blue opacity-50 cursor-not-allowed flex-shrink-0" disabled title="¿Eres negocio? (Pendiente de verificación)">
              <LayoutDashboard className="w-7 h-7" />
            </button>
          ) : user && userRole === 'business' && userStatus === 'verified' ? (
            <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
              <Link to="/business" title="Dashboard">
                <LayoutDashboard className="w-7 h-7" />
              </Link>
            </button>
          ) : null}

          {/* Panel de Repartidor (solo para deliveryPerson) */}
          {user && userRole === 'deliveryPerson' && (
            <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
              <Link to="/delivery-person" title="Dashboard Repartidor">
                <Truck className="w-7 h-7" />
              </Link>
            </button>
          )}

          {/* Mensajes (solo para clientes) */}
          {user && userRole === 'client' && (
            <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
              <Link to="/client" title="Mensajes">
                <MessageSquare className="w-7 h-7" />
              </Link>
            </button>
          )}

          {/* Rastrea tu pedido (dinámico según el rol) */}
          {user && (userRole === 'client' || userRole === 'business') && (
            <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
              <Link to={trackRoute} title="Rastrea tu pedido">
                <Package className="w-7 h-7" />
              </Link>
            </button>
          )}

          {user ? (
            <>
              {/* Mi perfil */}
              <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
                <Link to="/profile" title="Mi perfil">
                  <User className="w-7 h-7" />
                </Link>
              </button>
            </>
          ) : (
            <>
              {/* Ingresar */}
              <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
                <Link to="/login" title="Ingresar">
                  <LogIn className="w-7 h-7" />
                </Link>
              </button>

              {/* ¿Eres negocio? */}
              <button className="text-custom-blue hover:text-blue-700 flex-shrink-0">
                <Link to="/register-business" title="¿Eres negocio?">
                  <Store className="w-7 h-7" />
                </Link>
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
}