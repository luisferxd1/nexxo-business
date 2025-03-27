// src/components/HowItWorks.jsx
import { Package, ShoppingBag, Truck } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="bg-whie-100 p-6 rounded-2xl">
      <h3 className="text-xl font-semibold mb-4">¿Cómo funciona?</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
          <p>Compra en línea</p>
        </div>
        <div>
          <Truck className="w-12 h-12 mx-auto mb-2" />
          <p>Recolectamos en el negocio</p>
        </div>
        <div>
          <Package className="w-12 h-12 mx-auto mb-2" />
          <p>Entregamos a tu puerta</p>
        </div>
      </div>
    </section>
  );
}