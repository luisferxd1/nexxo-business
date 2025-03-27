// src/components/Checkout.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useCart } from '../context/CartContext';

const Checkout = () => {
  const { cart, setCart } = useCart(); // Usamos el carrito del contexto
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handlePay = async () => {
    if (!auth.currentUser) {
      setError('Debes iniciar sesión para realizar un pedido.');
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const orderData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        items: cart,
        total: total,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'orders'), orderData);
      setSuccess('¡Pedido realizado con éxito!');
      setCart([]); // Limpia el carrito después de pagar
      setTimeout(() => navigate('/'), 2000); // Redirige a la página principal después de 2 segundos
    } catch (err) {
      setError('Error al guardar el pedido: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      {cart.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div>
          <h2 className="text-xl mb-2">Resumen del Pedido</h2>
          <ul>
            {cart.map((item) => (
              <li key={item.id}>
                {item.name} - ${item.price} x {item.quantity} = ${item.price * item.quantity}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-bold">
            Total: ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          </p>
          <button
            onClick={handlePay}
            className="bg-green-500 text-white px-4 py-2 rounded mt-4"
          >
            Pagar
          </button>
          {success && <p className="text-green-500 mt-4">{success}</p>}
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default Checkout;