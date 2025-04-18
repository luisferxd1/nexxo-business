import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

export default function DeliveryPersonProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: '',
    vehiclePlate: '',
    licenseFile: null,
    vehiclePhoto: null,
  });
  const [loading, setLoading] = useState(true);

  // Cargar datos existentes del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          console.log('User UID:', user.uid); // Añadido para depuración
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.role !== 'deliveryPerson') {
              navigate('/', { replace: true });
              return;
            }
            if (data.profileComplete) {
              navigate('/delivery', { replace: true });
              return;
            }
            setFormData({
              name: data.name || '',
              phone: data.phone || '',
              vehicleType: data.deliveryInfo?.vehicleType || '',
              vehiclePlate: data.deliveryInfo?.vehiclePlate || '',
              licenseFile: null,
              vehiclePhoto: null,
            });
          }
        } catch (error) {
          toast.error('Error al cargar tu perfil: ' + error.message);
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login', { replace: true });
      }
    };
    fetchUserData();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.vehicleType || !formData.vehiclePlate || !formData.licenseFile) {
      toast.error('Por favor, completa todos los campos obligatorios.');
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);

      // Subir archivos a Firebase Storage
      let licenseUrl = '';
      let vehiclePhotoUrl = '';

      if (formData.licenseFile) {
        const licenseRef = ref(storage, `licenses/${user.uid}-${Date.now()}`);
        await uploadBytes(licenseRef, formData.licenseFile);
        licenseUrl = await getDownloadURL(licenseRef);
      }

      if (formData.vehiclePhoto) {
        const vehiclePhotoRef = ref(storage, `vehicles/${user.uid}-${Date.now()}`);
        await uploadBytes(vehiclePhotoRef, formData.vehiclePhoto);
        vehiclePhotoUrl = await getDownloadURL(vehiclePhotoRef);
      }

      // Actualizar datos en Firestore
      await updateDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        status: 'pending',
        available: false,
        deliveryInfo: {
          licenseUrl,
          vehicleType: formData.vehicleType,
          vehiclePlate: formData.vehiclePlate,
          vehiclePhotoUrl,
        },
        profileComplete: true,
      });

      toast.success('Perfil completado. Espera la verificación del administrador.');
      navigate('/delivery', { replace: true });
    } catch (error) {
      console.error('Error al completar el perfil:', error);
      toast.error('Error al completar el perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Completa tu Perfil de Repartidor</h2>
      <p className="text-gray-600 mb-4">Debes completar esta información para usar la app como repartidor.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo de Vehículo *</label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 w-full"
            required
          >
            <option value="">Selecciona</option>
            <option value="moto">Moto</option>
            <option value="auto">Auto</option>
            <option value="bicicleta">Bicicleta</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Placa del Vehículo *</label>
          <input
            type="text"
            name="vehiclePlate"
            value={formData.vehiclePlate}
            onChange={handleChange}
            className="border border-gray-300 rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Licencia de Conducir (Archivo) *</label>
          <input
            type="file"
            name="licenseFile"
            onChange={handleChange}
            accept="image/*,application/pdf"
            className="border border-gray-300 rounded px-2 py-1 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Foto del Vehículo (Opcional)</label>
          <input
            type="file"
            name="vehiclePhoto"
            onChange={handleChange}
            accept="image/*"
            className="border border-gray-300 rounded px-2 py-1 w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full border border-[#1D4ED8] text-[#1D4ED8] bg-white hover:bg-[#1D4ED8] hover:text-white rounded px-4 py-2 transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Perfil'}
        </button>
      </form>
    </div>
  );
}