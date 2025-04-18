// src/components/Cart.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Loader2, Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';

export default function Cart() {
  const { user, userRole, loading } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('Renderizando Cart.jsx, user:', user, 'cartItems:', cartItems);
  console.log('User UID:', user?.uid, 'User Role:', userRole);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const addresses = userData.addresses || [];
          setSavedAddresses(addresses);
          // Seleccionar la primera dirección por defecto si existe
          if (addresses.length > 0) {
            setSelectedAddress(0);
          }
        }
      } catch (error) {
        console.error('Error al cargar las direcciones:', error);
        toast.error('Error al cargar las direcciones: ' + error.message);
      }
    };

    fetchAddresses();
  }, [user]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (userRole === 'admin' || userRole === 'business') {
      navigate('/');
      return;
    }
  }, [user, userRole, loading, navigate]);

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const createOrder = async (cartItems, user, address) => {
    try {
      console.log('Creando pedido con los siguientes datos:');
      console.log('Cart Items:', cartItems);
      console.log('User:', user);
      console.log('Address:', address);
      const businessIds = [...new Set(cartItems.map(item => item.businessId))];
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const orderData = {
        customerId: user.uid,
        userEmail: user.email,
        createdAt: new Date().toISOString(),
        status: 'pending',
        businessIds: businessIds,
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          businessId: item.businessId,
        })),
        total: total,
        address: { ...address },
      };
      console.log('Datos del pedido a enviar a Firestore:', orderData);

      console.log('Creando pedido en Firestore...');
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Pedido creado con ID:', orderRef.id);

      // Crear notificaciones para cada negocio
      console.log('Creando notificaciones para negocios...');
      for (const businessId of businessIds) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: businessId,
            type: 'business',
            message: `Tienes un nuevo pedido de ${user.email}. Pedido #${orderRef.id}.`,
            read: false,
            createdAt: new Date().toISOString(),
          });
          console.log(`Notificación creada para el negocio ${businessId}`);
        } catch (error) {
          console.error(`Error al crear notificación para el negocio ${businessId}:`, error);
          // No lanzamos el error para no interrumpir el flujo
        }
      }

      // Crear notificación para el admin
      console.log('Consultando usuarios con rol "admin"...');
      const adminUsersQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      let adminUsers;
      try {
        adminUsers = await getDocs(adminUsersQuery);
        console.log('Usuarios admin encontrados:', adminUsers.docs.map(doc => doc.id));
      } catch (error) {
        console.error('Error al consultar usuarios admin:', error);
        // No lanzamos el error para no interrumpir el flujo
        adminUsers = { docs: [] }; // Continuamos con una lista vacía
      }

      console.log('Creando notificaciones para admins...');
      for (const adminDoc of adminUsers.docs) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: adminDoc.id,
            type: 'admin',
            message: `Nuevo pedido #${orderRef.id} realizado por ${user.email}.`,
            read: false,
            createdAt: new Date().toISOString(),
          });
          console.log(`Notificación creada para el admin ${adminDoc.id}`);
        } catch (error) {
          console.error(`Error al crear notificación para el admin ${adminDoc.id}:`, error);
          // No lanzamos el error para no interrumpir el flujo
        }
      }

      return orderRef.id;
    } catch (error) {
      console.error('Error al crear el pedido:', error);
      throw error;
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (savedAddresses.length === 0) {
      toast.error('No tienes direcciones guardadas. Por favor, agrega una dirección en tu perfil.');
      navigate('/profile');
      return;
    }

    if (selectedAddress === '') {
      toast.error('Por favor, selecciona una dirección para el envío.');
      return;
    }

    const finalAddress = savedAddresses[parseInt(selectedAddress)];

    setIsSubmitting(true);
    try {
      await createOrder(cartItems, user, finalAddress);
      toast.success('¡Pedido realizado exitosamente!');
      clearCart();
      navigate('/track-client');
    } catch (error) {
      toast.error('Error al realizar el pedido: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <Loader2 className="w-6 h-6 text-custom-blue animate-spin" />
          <p className="text-lg text-gray-600 font-medium">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white p-4 md:p-8 lg:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-custom-blue text-center">
          Tu Carrito
        </h2>

        {cartItems.length > 0 ? (
          <div className="space-y-6">
            {/* Lista de productos en el carrito */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                Productos en el Carrito
              </h3>
              {cartItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between border-b py-3 md:py-4"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg shadow-sm"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-600">
                        Precio: ${item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 bg-custom-blue hover:bg-gray-500 text-white-700 rounded-full"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-sm md:text-base text-gray-700">
                          {item.quantity}
                        </span>
                        <Button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 bg-custom-blue hover:bg-gray-500 text-white rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <Button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 bg-red-600 hover:bg-red-400 text-white rounded-full"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              <div className="mt-4 text-right">
                <p className="text-lg md:text-xl font-semibold text-custom-blue">
                  Total: ${calculateTotal()}
                </p>
              </div>
            </div>

            {/* Selección de dirección */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-custom-blue mb-4">
                Dirección de Envío
              </h3>
              {savedAddresses.length === 0 ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    No tienes direcciones guardadas. Por favor, agrega una dirección en tu perfil.
                  </p>
                  <Button
                    onClick={() => navigate('/profile')}
                    className="bg-custom-blue text-white hover:bg-blue-700 py-2 px-4 rounded-lg"
                  >
                    Ir a Perfil para Agregar Dirección
                  </Button>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una dirección:
                  </label>
                  <select
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-custom-blue focus:border-custom-blue"
                  >
                    {savedAddresses.map((addr, index) => (
                      <option key={index} value={index}>
                        {addr.label} - {addr.address}, {addr.district}, {addr.department}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Botón para realizar el pedido */}
            {savedAddresses.length > 0 && (
              <div className="text-center">
                <Button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-custom-blue text-white hover:bg-blue-700 py-3 px-6 text-sm md:text-base font-medium transition-all duration-300 rounded-lg flex items-center justify-center 🙂gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Procesando...' : 'Realizar Pedido'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12 bg-white rounded-2xl shadow-md"
          >
            <p className="text-gray-500 text-base md:text-lg font-medium">
              Tu carrito está vacío.
            </p>
            <p className="text-gray-400 text-sm md:text-base mt-2">
              Agrega productos para comenzar tu compra.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="mt-4 bg-custom-blue text-white hover:bg-blue-700 py-2 px-4 text-sm md:text-base rounded-lg" style={{ borderRadius: '9999px' }}
            >
              Explorar Productos
            </Button>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}