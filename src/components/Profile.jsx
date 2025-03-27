import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Notifications from './Notifications';

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [clientInfo, setClientInfo] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newReferencePoint, setNewReferencePoint] = useState('');
  const [editAddressId, setEditAddressId] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editReferencePoint, setEditReferencePoint] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
  });
  const [error, setError] = useState('');

  const districts = [
    "Sonsonate",
    "Acajutla",
    "Izalco",
    "Juayúa",
    "Nahuizalco",
    "San Antonio del Monte",
    "Santo Domingo de Guzmán",
    "Sonzacate",
  ];

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.log("Profile: No hay usuario autenticado, redirigiendo a /login");
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAddresses(userData.addresses || []);
        setClientInfo(userData.clientInfo || {});
        setFormData({
          firstName: userData.clientInfo?.firstName || '',
          lastName: userData.clientInfo?.lastName || '',
          birthDate: userData.clientInfo?.birthDate || '',
        });
      }
    };

    fetchUserData();
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    const { firstName, lastName, birthDate } = formData;

    if (!firstName || !lastName || !birthDate) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedClientInfo = { firstName, lastName, birthDate };
      await setDoc(
        userDocRef,
        {
          clientInfo: updatedClientInfo,
          profileComplete: true,
        },
        { merge: true }
      );

      setClientInfo(updatedClientInfo);
      setError('');
      setIsEditingProfile(false);

      // Forzar una recarga de datos desde Firestore
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setClientInfo(userData.clientInfo || {});
        setFormData({
          firstName: userData.clientInfo?.firstName || '',
          lastName: userData.clientInfo?.lastName || '',
          birthDate: userData.clientInfo?.birthDate || '',
        });
      }
    } catch (err) {
      setError('Error al guardar el perfil: ' + err.message);
    }
  };

  const handleAddAddress = async () => {
    if (!user) {
      alert("Debes iniciar sesión para agregar direcciones.");
      return;
    }
    if (!newAddress || !newLabel || !newDistrict || !newReferencePoint) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    if (addresses.length >= 5) {
      alert("No puedes registrar más de 5 direcciones.");
      return;
    }

    const newAddressObj = {
      id: Date.now().toString(),
      address: newAddress,
      label: newLabel,
      district: newDistrict,
      department: "Sonsonate",
      referencePoint: newReferencePoint,
    };

    const updatedAddresses = [...addresses, newAddressObj];
    setAddresses(updatedAddresses);

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { addresses: updatedAddresses }, { merge: true });

    setNewAddress('');
    setNewLabel('');
    setNewDistrict('');
    setNewReferencePoint('');
  };

  const handleEditAddress = (address) => {
    setEditAddressId(address.id);
    setEditAddress(address.address);
    setEditLabel(address.label);
    setEditDistrict(address.district || '');
    setEditReferencePoint(address.referencePoint || '');
  };

  const handleSaveEdit = async () => {
    const updatedAddresses = addresses.map((addr) =>
      addr.id === editAddressId
        ? {
            ...addr,
            address: editAddress,
            label: editLabel,
            district: editDistrict,
            department: "Sonsonate",
            referencePoint: editReferencePoint,
          }
        : addr
    );
    setAddresses(updatedAddresses);

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { addresses: updatedAddresses }, { merge: true });

    setEditAddressId(null);
    setEditAddress('');
    setEditLabel('');
    setEditDistrict('');
    setEditReferencePoint('');
  };

  const handleDeleteAddress = async (addressId) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);
    setAddresses(updatedAddresses);

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { addresses: updatedAddresses }, { merge: true });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await deleteDoc(userDocRef);
        await user.delete();
        navigate('/');
      } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        alert("Hubo un error al eliminar tu cuenta.");
      }
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600">Cargando...</div>;
  }

  return (
    <section className="p-6">
      <h3 className="text-xl font-semibold mb-4">Mi perfil</h3>
      {user ? (
        <div className="space-y-6">
          {/* Notificaciones embebidas */}
          <Notifications embedded={true} />

          {/* Información del Usuario */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2">Información del Usuario</h4>
            <p><strong>Correo:</strong> {user.email}</p>
            <p><strong>Rol:</strong> {user.role || 'No asignado'}</p>
          </div>

          {/* Información Personal */}
          {user.profileComplete && !isEditingProfile ? (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Información Personal</h4>
              <p><strong>Nombre:</strong> {clientInfo?.firstName || 'No especificado'}</p>
              <p><strong>Apellido:</strong> {clientInfo?.lastName || 'No especificado'}</p>
              <p><strong>Fecha de Nacimiento:</strong> {clientInfo?.birthDate || 'No especificada'}</p>
              <Button
                onClick={() => setIsEditingProfile(true)}
                className="mt-4 bg-blue-500 text-white"
              >
                Editar Información Personal
              </Button>
            </div>
          ) : (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">
                {isEditingProfile ? 'Editar Información Personal' : 'Completar Información Personal'}
              </h4>
              <form onSubmit={handleSubmitProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apellido</label>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Apellido"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                  <Input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-green-500 text-white">
                  Guardar y Continuar
                </Button>
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </form>
            </div>
          )}

          {/* Opción para vender (solo para clientes) */}
          {user.role === 'client' && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">¿Quieres vender?</h4>
              <Button
                onClick={() => navigate('/role-selection')}
                className="bg-blue-500 text-white"
              >
                Vender en NEXXO
              </Button>
            </div>
          )}

          {/* Gestionar Direcciones */}
          <div className="space-y-2">
            <h4 className="font-semibold mb-2">Gestionar Direcciones</h4>
            <Input
              placeholder="Etiqueta (ej. Casa, Trabajo)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Input
              placeholder="Dirección (ej. 123 Calle Principal)"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <select
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Selecciona un distrito</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <Input
              placeholder="Departamento (Sonsonate)"
              value="Sonsonate"
              disabled
            />
            <Input
              placeholder="Punto de referencia (ej. Frente al parque)"
              value={newReferencePoint}
              onChange={(e) => setNewReferencePoint(e.target.value)}
            />
            <Button className="w-full" onClick={handleAddAddress}>
              Agregar dirección
            </Button>
          </div>

          {/* Lista de Direcciones */}
          <div className="space-y-4">
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <div key={address.id} className="p-4 border rounded-lg flex justify-between items-center">
                  {editAddressId === address.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Etiqueta"
                      />
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Dirección"
                      />
                      <select
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Selecciona un distrito</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Departamento (Sonsonate)"
                        value="Sonsonate"
                        disabled
                      />
                      <Input
                        value={editReferencePoint}
                        onChange={(e) => setEditReferencePoint(e.target.value)}
                        placeholder="Punto de referencia"
                      />
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveEdit}>Guardar</Button>
                        <Button variant="outline" onClick={() => setEditAddressId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p><strong>{address.label}</strong></p>
                      <p>{address.address}</p>
                      <p><strong>Distrito:</strong> {address.district}</p>
                      <p><strong>Departamento:</strong> {address.department}</p>
                      <p><strong>Punto de referencia:</strong> {address.referencePoint}</p>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleEditAddress(address)}>
                      Editar
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteAddress(address.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p>No tienes direcciones registradas.</p>
            )}
          </div>

          {/* Eliminar Cuenta */}
          <div className="mt-6">
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Eliminar mi cuenta
            </Button>
          </div>
        </div>
      ) : (
        <p>Por favor, inicia sesión para gestionar tus direcciones.</p>
      )}
    </section>
  );
}