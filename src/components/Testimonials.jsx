// src/components/Testimonials.jsx
import { Card, CardContent } from './ui/card';

export default function Testimonials() {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-center">Lo que dicen nuestros clientes</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((testimonial) => (
          <Card key={testimonial} className="hover:shadow-lg">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm text-gray-600 italic">"Excelente servicio, rápido y seguro. Muy recomendado!"</p>
              <p className="text-sm font-semibold text-right">- Cliente {testimonial}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}