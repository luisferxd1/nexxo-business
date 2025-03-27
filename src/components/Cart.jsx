// src/components/Cart.jsx
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, getCartTotal } = useCart();

  // Aseguramos que cart sea un array, si no, lo inicializamos como vacío
  const cartItems = Array.isArray(cart) ? cart : [];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Tu Carrito</h2>
      {cartItems.length === 0 ? (
        <p>
          Tu carrito está vacío.{' '}
          <Link to="/" className="text-blue-500 underline">
            Volver a la tienda
          </Link>
        </p>
      ) : (
        <div>
          <ul className="space-y-4">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div className="flex items-center space-x-4">
                  {/* Imagen del producto */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  {/* Detalles del producto */}
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <div className="flex items-center space-x-2">
                      <p>Cantidad:</p>
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p>Precio: ${item.price * item.quantity}</p>
                  </div>
                </div>
                {/* Botón de eliminar */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <h3 className="text-xl font-bold">Total: ${getCartTotal()}</h3>
            <Link to="/checkout">
              <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Proceder al Checkout
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}