// src/components/OrderReview.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Star } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export default function OrderReview({ orderId, businessId }) {
  const { user, userRole } = useAuth();
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!user || userRole !== 'client') return;

    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('orderId', '==', orderId),
      where('customerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const reviewData = snapshot.docs[0]?.data();
        if (reviewData) {
          setReview({ id: snapshot.docs[0].id, ...reviewData });
          setRating(reviewData.rating);
          setComment(reviewData.comment || '');
        } else {
          setReview(null);
          setRating(0);
          setComment('');
        }
      },
      (error) => {
        console.error('Error al cargar la reseña:', error);
        toast.error('Error al cargar la reseña.');
      }
    );

    return () => unsubscribe();
  }, [user, userRole, orderId]);

  const handleRating = (value) => {
    setRating(value);
  };

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      toast.error('Por favor selecciona una calificación entre 1 y 5.');
      return;
    }

    try {
      if (review) {
        // Actualizar reseña existente
        const reviewRef = doc(db, 'reviews', review.id);
        await updateDoc(reviewRef, {
          rating,
          comment: comment.trim(),
          updatedAt: new Date().toISOString(),
        });
        toast.success('Reseña actualizada exitosamente.');
        setIsEditing(false);
      } else {
        // Crear nueva reseña
        await addDoc(collection(db, 'reviews'), {
          orderId,
          businessId,
          customerId: user.uid,
          rating,
          comment: comment.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.success('Reseña enviada exitosamente.');

        // Notificar al negocio
        await addDoc(collection(db, 'notifications'), {
          userId: businessId,
          type: 'business',
          message: `Un cliente ha dejado una reseña para el pedido #${orderId} con una calificación de ${rating}/5.`,
          read: false,
          createdAt: new Date().toISOString(),
        });

        // Notificar a los admins
        const adminUsers = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
        adminUsers.forEach(async (adminDoc) => {
          await addDoc(collection(db, 'notifications'), {
            userId: adminDoc.id,
            type: 'admin',
            message: `Nueva reseña para el pedido #${orderId} con una calificación de ${rating}/5.`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        });
      }
    } catch (error) {
      console.error('Error al enviar la reseña:', error);
      toast.error('Error al enviar la reseña.');
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta reseña?')) return;

    try {
      const reviewRef = doc(db, 'reviews', review.id);
      await deleteDoc(reviewRef);
      toast.success('Reseña eliminada exitosamente.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error al eliminar la reseña:', error);
      toast.error('Error al eliminar la reseña.');
    }
  };

  if (userRole !== 'client') return null;

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
      <h4 className="text-lg font-semibold text-custom-blue mb-2">Calificar este Pedido</h4>
      {review && !isEditing ? (
        <div>
          <div className="flex items-center mb-2">
            <p className="mr-2 text-sm">Tu calificación:</p>
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`w-5 h-5 ${index + 1 <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          {review.comment && (
            <p className="text-sm text-gray-600 mb-2"><strong>Comentario:</strong> {review.comment}</p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl text-sm px-4 py-2"
            >
              Editar Reseña
            </Button>
            <Button
              onClick={handleDeleteReview}
              className="bg-red-600 text-white hover:bg-red-700 rounded-2xl text-sm px-4 py-2"
            >
              Eliminar Reseña
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="mr-2 text-sm">Calificación:</p>
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`w-6 h-6 cursor-pointer ${index + 1 <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                onClick={() => handleRating(index + 1)}
              />
            ))}
          </div>
          <Textarea
            placeholder="Escribe un comentario (opcional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="rounded-2xl border-gray-300 focus:border-custom-blue"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReview}
              className="bg-green-600 text-white hover:bg-green-700 rounded-2xl text-sm px-4 py-2"
            >
              {review ? 'Actualizar Reseña' : 'Enviar Reseña'}
            </Button>
            {isEditing && (
              <Button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl text-sm px-4 py-2"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}