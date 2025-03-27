// src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs, doc as firestoreDoc, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, Users, ShoppingBag, BarChart2, Plus, Edit, Trash, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', image: '', business: '' });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filtros y búsqueda
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

  // Cargar datos iniciales solo si el usuario está autenticado y la carga está completa
  useEffect(() => {
    if (loading || !user || user.role !== 'admin') {
      setOrders([]);
      setUsers([]);
      setProducts([]);
      return;
    }

    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const ordersData = await Promise.all(
          querySnapshot.docs.map(async (orderDoc) => {
            const orderData = { id: orderDoc.id, ...orderDoc.data() };
            if (orderData.userId) {
              const userDocRef = firestoreDoc(db, 'users', orderData.userId);
              const userDocSnap = await getDoc(userDocRef);
              const userData = userDocSnap.exists() ? userDocSnap.data() : {};
              return {
                ...orderData,
                customerEmail: userData.email || 'N/A',
              };
            }
            return {
              ...orderData,
              customerEmail: 'N/A',
            };
          })
        );
        setOrders(ordersData);
        console.log('Pedidos cargados:', ordersData);
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        console.log('Iniciando carga de usuarios...');
        const querySnapshot = await getDocs(collection(db, 'users'));
        console.log('QuerySnapshot recibido:', querySnapshot);
        if (querySnapshot.empty) {
          console.log('No se encontraron usuarios en la colección "users".');
          setUsers([]);
          return;
        }
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Usuarios cargados desde Firestore:', usersData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        setUsers([]);
      }
    };

    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        console.log('Productos cargados:', productsData);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      }
    };

    fetchOrders();
    fetchUsers();
    fetchProducts();
  }, [user, loading]);

  // Calcular métricas para el resumen
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalRevenue = orders.reduce((sum, order) => {
    const orderTotal = order.items?.reduce((subtotal, item) => subtotal + (item.price * item.quantity), 0) || 0;
    return sum + orderTotal;
  }, 0);

  // Datos para el gráfico de pedidos por estado
  const orderStatusData = [
    { name: 'Pendiente', count: orders.filter((order) => order.status === 'Pendiente').length },
    { name: 'En Proceso', count: orders.filter((order) => order.status === 'En Proceso').length },
    { name: 'Enviado', count: orders.filter((order) => order.status === 'Enviado').length },
    { name: 'Entregado', count: orders.filter((order) => order.status === 'Entregado').length },
  ];

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.id || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.userId || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.customerEmail || '').toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter ? order.status === orderStatusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Filtrar usuarios
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.id || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter ? (user.role || '').toLowerCase() === userRoleFilter.toLowerCase() : true;
    console.log(`Filtrando usuario: ${user.id}, matchesSearch: ${matchesSearch}, matchesRole: ${matchesRole}`);
    return matchesSearch && matchesRole;
  });

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.id || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.category || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.business || '').toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter ? product.category === productCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  // Obtener categorías únicas para el filtro de productos
  const uniqueCategories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  // Actualizar estado de un pedido
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderDocRef = firestoreDoc(db, 'orders', orderId);
      await updateDoc(orderDocRef, { status: newStatus });
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error al actualizar el estado del pedido:', error);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteDoc(firestoreDoc(db, 'users', userId));
        setUsers((prev) => prev.filter((user) => user.id !== userId));
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
      }
    }
  };

  // Añadir nuevo producto
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const newProductRef = await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        image: newProduct.image || 'https://via.placeholder.com/150',
        business: newProduct.business,
      });
      setProducts((prev) => [
        ...prev,
        { id: newProductRef.id, ...newProduct, price: Number(newProduct.price) },
      ]);
      setNewProduct({ name: '', price: '', category: '', image: '', business: '' });
      setShowAddProductModal(false);
    } catch (error) {
      console.error('Error al añadir el producto:', error);
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await deleteDoc(firestoreDoc(db, 'products', productId));
        setProducts((prev) => prev.filter((product) => product.id !== productId));
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
      }
    }
  };

  // Mostrar un mensaje de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  // Si el usuario no es administrador, mostrar un mensaje de acceso denegado
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Acceso denegado: Solo los administradores pueden acceder a esta página.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-gray-100"
    >
      {/* Sidebar */}
      <div className="w-64 bg-custom-blue text-white p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Dashboard</h2>
        <nav className="space-y-4">
          {[
            { section: 'overview', label: 'Resumen', Icon: BarChart2 },
            { section: 'orders', label: 'Pedidos', Icon: Package },
            { section: 'users', label: 'Usuarios', Icon: Users },
            { section: 'products', label: 'Productos', Icon: ShoppingBag },
            { section: 'reports', label: 'Reportes', Icon: BarChart2 },
          ].map(({ section, label, Icon }) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`w-full text-left py-2 px-4 rounded-2xl ${
                activeSection === section ? 'bg-custom-cyan' : 'hover:bg-blue-700'
              }`}
            >
              <Icon className="inline-block w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 p-8">
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold mb-6 text-custom-blue">Resumen General</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">Total de Pedidos</h3>
                <p className="text-3xl font-bold text-custom-blue">{totalOrders}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">Total de Usuarios</h3>
                <p className="text-3xl font-bold text-custom-blue">{totalUsers}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">Ingresos Totales</h3>
                <p className="text-3xl font-bold text-custom-blue">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold mb-6 text-custom-blue">Gestión de Pedidos</h2>
            <div className="mb-6 flex gap-4">
              <Input
                placeholder="Buscar por ID, Cliente o Correo"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-64"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="border rounded-2xl px-3 py-2"
              >
                <option value="">Todos los Estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Enviado">Enviado</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              {filteredOrders.length > 0 ? (
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-left table-fixed">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 w-32">ID</th>
                        <th className="p-3 w-32">Cliente</th>
                        <th className="p-3 w-48">Correo</th>
                        <th className="p-3 w-24">Estado</th>
                        <th className="p-3 w-24">Fecha</th>
                        <th className="p-3 w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td
                            className="p-3 text-blue-500 cursor-pointer hover:underline truncate"
                            onClick={() => setSelectedOrder(order)}
                          >
                            {order.id}
                          </td>
                          <td className="p-3 truncate">{order.userId || 'N/A'}</td>
                          <td className="p-3 truncate">{order.customerEmail}</td>
                          <td className="p-3 truncate">{order.status || 'Pendiente'}</td>
                          <td className="p-3 truncate">
                            {order.createdAt
                              ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                              : 'N/A'}
                          </td>
                          <td className="p-3">
                            <select
                              value={order.status || 'Pendiente'}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="border rounded-2xl px-2 py-1 text-sm truncate max-w-full"
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Enviado">Enviado</option>
                              <option value="Entregado">Entregado</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay pedidos disponibles.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeSection === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold mb-6 text-custom-blue">Gestión de Usuarios</h2>
            <div className="mb-6 flex gap-4">
              <Input
                placeholder="Buscar por ID, Nombre o Correo"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-64"
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="border rounded-2xl px-3 py-2"
              >
                <option value="">Todos los Roles</option>
                <option value="user">Usuario</option>
                <option value="business">Negocio</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <p>Usuarios sin filtrar: {users.length}</p>
              <p>Usuarios filtrados: {filteredUsers.length}</p>
              {filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3">ID</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Rol</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-3">{user.id || 'N/A'}</td>
                          <td className="p-3">{user.name || 'N/A'}</td>
                          <td className="p-3">{user.email || 'N/A'}</td>
                          <td className="p-3">{user.role || 'N/A'}</td>
                          <td className="p-3 flex gap-2">
                            <Button
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-500 text-white rounded-2xl"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay usuarios disponibles.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeSection === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold mb-6 text-custom-blue">Gestión de Productos</h2>
            <div className="mb-6 flex gap-4">
              <Input
                placeholder="Buscar por ID, Nombre, Categoría o Tienda"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-64"
              />
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="border rounded-2xl px-3 py-2"
              >
                <option value="">Todas las Categorías</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <Button
                onClick={() => setShowAddProductModal(true)}
                className="bg-custom-blue text-white rounded-2xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Añadir Producto </Button>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-6">
              {filteredProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3">ID</th>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Precio</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Tienda</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b">
                          <td className="p-3">{product.id}</td>
                          <td className="p-3">{product.name}</td>
                          <td className="p-3">${product.price}</td>
                          <td className="p-3">{product.category || 'N/A'}</td>
                          <td className="p-3">{product.business || 'N/A'}</td>
                          <td className="p-3 flex gap-2">
                            <Button className="bg-blue-500 text-white rounded-2xl">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-500 text-white rounded-2xl"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No hay productos disponibles.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeSection === 'reports' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold mb-6 text-custom-blue">Reportes</h2>
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Pedidos por Estado</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#1E3A8A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal para Añadir Producto */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Añadir Nuevo Producto</h2>
            <form onSubmit={handleAddProduct}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tienda</label>
                <Input
                  value={newProduct.business}
                  onChange={(e) => setNewProduct({ ...newProduct, business: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">URL de la Imagen</label>
                <Input
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="bg-gray-400 text-white rounded-2xl"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-custom-blue text-white rounded-2xl">
                  Añadir
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Detalles del Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Detalles del Pedido #{selectedOrder.id}</h2>
              <Button
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-200 text-gray-800 rounded-2xl"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <p className="break-words"><strong>Cliente:</strong> {selectedOrder.userId || 'N/A'}</p>
              </div>
              <div className="overflow-x-auto">
                <p className="break-words"><strong>Correo:</strong> {selectedOrder.customerEmail}</p>
              </div>
              <div className="overflow-x-auto">
                <p className="break-words"><strong>Estado:</strong> {selectedOrder.status || 'Pendiente'}</p>
              </div>
              <div className="overflow-x-auto">
                <p className="break-words"><strong>Fecha:</strong> {selectedOrder.createdAt
                  ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString()
                  : 'N/A'}</p>
              </div>
              <div className="overflow-x-auto">
                <p className="break-words"><strong>Dirección:</strong> {selectedOrder.address
                  ? `${selectedOrder.addressLabel || ''} - ${selectedOrder.address}, ${selectedOrder.district}, ${selectedOrder.department} (Ref: ${selectedOrder.referencePoint || 'N/A'})`
                  : 'N/A'}</p>
              </div>
              <h3 className="text-md font-semibold">Productos:</h3>
              <div className="overflow-x-auto">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 border-b py-2">
                        <img
                          src={item.image || 'https://via.placeholder.com/50'}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="break-words"><strong>{item.name}</strong></p>
                          <p className="break-words">Cantidad: {item.quantity}</p>
                          <p className="break-words">Precio Unitario: ${item.price}</p>
                          <p className="break-words">Subtotal: ${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No hay productos en este pedido.</p>
                )}
              </div>
              <div className="overflow-x-auto">
                <p className="break-words"><strong>Total:</strong> ${selectedOrder.items
                  ? selectedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
                  : '0.00'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}