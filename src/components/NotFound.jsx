// src/components/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Página No Encontrada</h1>
        <p className="text-lg text-gray-600 mb-6">
          Lo sentimos, la página que estás buscando no existe.
        </p>
        <Link to="/">
          <button className="bg-custom-blue text-white px-6 py-2 rounded-2xl hover:bg-blue-700">
            Volver al Inicio
          </button>
        </Link>
      </div>
    </div>
  );
}