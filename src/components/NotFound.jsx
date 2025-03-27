// src/components/NotFound.jsx (versión personalizada)
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-100">
      <h2 className="text-5xl font-bold text-gray-800 mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-6">
        ¡Ups! Parece que te has perdido. La página que buscas no existe.
      </p>
      <Link
        to="/"
        className="bg-blue-500 text-white py-2 px-6 rounded-2xl hover:bg-blue-600"
      >
        Volver a la página principal
      </Link>
    </div>
  );
}