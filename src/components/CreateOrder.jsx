import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function CreateOrder() {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, price: 0 }]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'client') {
          // Cargar negocios verificados
          const businessesQuery = query(
            collection(db, "users"),
            where("role", "==", "business"),
            where("status", "==", "verified")
          );
          const businessesSnapshot = await getDocs(businessesQuery);
          setBusinesses(businessesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } else {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, price: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const handleSubmitOrder = async () => {
    if (!selectedBusiness) {
      alert("Por favor, selecciona un negocio.");
      return;
    }
    if (items.some((item) => !item.productId || item.quantity <= 0 || item.price <= 0)) {
      alert("Por favor, completa todos los campos de los productos.");
      return;
    }

    try {
      const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const orderData = {
        clientId: user.uid,
        businessId: selectedBusiness,
        items,
        total,
        status: 'pending',
        statusHistory: [{ status: 'pending', timestamp: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      };

      const orderRef = await addDoc(collection(db, "orders"), orderData);
      const orderId = orderRef.id;

      // Generar notificación para el negocio
      await addDoc(collection(db, "notifications"), {
        userId: selectedBusiness,
        type: 'new_order',
        message: `Nuevo pedido #${orderId} recibido`,
        orderId: orderId,
        read: false,
        createdAt: new Date().toISOString(),
      });

      // Generar notificación para los administradores
      const adminUsers = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
      const adminIds = adminUsers.docs.map((doc) => doc.id);
      for (const adminId of adminIds) {
        await addDoc(collection(db, "notifications"), {
          userId: adminId,
          type: 'new_order',
          message: `Nuevo pedido #${orderId} recibido`,
          orderId: orderId,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }

      // Generar notificación para el cliente
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        type: 'order_created',
        message: `Tu pedido #${orderId} ha sido creado con éxito`,
        orderId: orderId,
        read: false,
        createdAt: new Date().toISOString(),
      });

      alert("Pedido creado con éxito.");
      navigate('/track-order');
    } catch (error) {
      console.error("Error al crear pedido:", error);
      alert("Hubo un error al crear el pedido.");
    }
  };

  if (!user) {
    return <p>Cargando...</p>;
  }

  return (
    <section className="p-6">
      <h3 className="text-xl font-semibold mb-4">Crear Pedido</h3>
      <div className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Seleccionar Negocio</label>
          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Selecciona un negocio</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.businessInfo?.businessName || 'Negocio sin nombre'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Productos</h4>
          {items.map((item, index) => (
            <div key={index} className="space-y-2 mb-4 border p-4 rounded-lg">
              <Input
                placeholder="ID del Producto"
                value={item.productId}
                onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
              />
              <Input
                type="number"
                placeholder="Precio por unidad"
                value={item.price}
                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
              />
            </div>
          ))}
          <Button onClick={handleAddItem}>Añadir otro producto</Button>
        </div>

        <Button onClick={handleSubmitOrder}>Crear Pedido</Button>
      </div>
    </section>
  );
}