// src/components/HowItWorks.jsx
import { Package, ShoppingBag, Truck } from 'lucide-react';

export default function HowItWorks() {
  return (
    <section className="p-2 md:p-4">
      <div className="flex overflow-x-auto space-x-2 md:space-x-2 snap-x snap-mandatory hide-scrollbar snap-center">
        <div className="flex-none w-28 md:w-1/3 snap-center text-center">
          <ShoppingBag className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 text-custom-blue" />
          <p className="text-xs md:text-base">Compra en línea</p>
        </div>
        <div className="flex-none w-28 md:w-1/3 snap-center text-center">
          <Truck className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 text-custom-blue" />
          <p className="text-xs md:text-base">Recolectamos en el negocio</p>
        </div>
        <div className="flex-none w-28 md:w-1/3 snap-center text-center">
          <Package className="w-6 h-6 md:w-12 md:h-12 mx-auto mb-1 md:mb-2 text-custom-blue" />
          <p className="text-xs md:text-base">Entrega a tu puerta</p>
        </div>
      </div>
    </section>
  );
}