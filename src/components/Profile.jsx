import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'react-hot-toast';
import { GoogleMap, Marker } from '@react-google-maps/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, userRole, loading, logout } = useAuth();
  const [clientInfo, setClientInfo] = useState(null);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDistrict, setNewDistrict] = useState('');
  const [newReferencePoint, setNewReferencePoint] = useState('');
  const [newLocation, setNewLocation] = useState(null);
  const [editAddressId, setEditAddressId] = useState(null);
  const [editAddress, setEditAddress] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editReferencePoint, setEditReferencePoint] = useState('');
  const [editLocation, setEditLocation] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    businessName: '',
    profileImage: '',
    phone: '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };

  const defaultCenter = {
    lat: 13.7183,
    lng: -89.7228,
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const fetchUserData = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAddresses(userData.addresses || []);
        setClientInfo(userData.clientInfo || {});
        setDeliveryInfo(userData.deliveryInfo || null);
        setProfileComplete(userData.profileComplete || false);
        setFormData({
          firstName: userData.clientInfo?.firstName || userData.name || '',
          lastName: userData.clientInfo?.lastName || '',
          birthDate: userData.clientInfo?.birthDate || '',
          businessName: userData.clientInfo?.businessName || '',
          profileImage: userData.profileImage || '',
          phone: userData.phone || '',
        });
        if (!userData.profileComplete && userRole !== 'deliveryPerson') {
          setIsEditingProfile(true);
        }
      }
    };

    fetchUserData();
  }, [user, loading, navigate, userRole]);

  const validateField = (name, value) => {
    let error = '';
    if (name === 'firstName') {
      if (!value.trim()) {
        error = 'El nombre es obligatorio';
      } else if (value.trim().length < 2) {
        error = 'El nombre debe tener al menos 2 caracteres';
      }
    }
    if (name === 'lastName') {
      if (!value.trim()) {
        error = 'El apellido es obligatorio';
      } else if (value.trim().length < 2) {
        error = 'El apellido debe tener al menos 2 caracteres';
      }
    }
    if (name === 'birthDate') {
      if (!value) {
        error = 'La fecha de nacimiento es obligatoria';
      } else {
        const birthDate = new Date(value);
        const today = new Date();
        if (birthDate >= today) {
          error = 'La fecha de nacimiento debe ser anterior a hoy';
        } else if (today.getFullYear() - birthDate.getFullYear() < 18) {
          error = 'Debes tener al menos 18 años';
        }
      }
    }
    if (name === 'businessName' && userRole === 'business' && !value.trim()) {
      error = 'El nombre del negocio es obligatorio';
    }
    if (name === 'phone' && userRole === 'deliveryPerson') {
      if (!value.trim()) {
        error = 'El teléfono es obligatorio';
      } else if (!/^\+?\d{8,15}$/.test(value)) {
        error = 'El teléfono debe tener entre 8 y 15 dígitos';
      }
    }
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, sube un archivo de imagen válido (jpg, png, etc.).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB.');
        return;
      }
      setProfileImageFile(file);
      setFormData((prev) => ({ ...prev, profileImage: URL.createObjectURL(file) }));
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    const { firstName, lastName, birthDate, businessName, phone } = formData;

    validateField('firstName', firstName);
    validateField('lastName', lastName);
    validateField('birthDate', birthDate);
    if (userRole === 'business') {
      validateField('businessName', businessName);
    }
    if (userRole === 'deliveryPerson') {
      validateField('phone', phone);
    }

    const hasErrors = Object.values(formErrors).some((err) => err);
    if (hasErrors || !firstName || !lastName || !birthDate || (userRole === 'business' && !businessName) || (userRole === 'deliveryPerson' && !phone)) {
      toast.error('Por favor, corrige los errores antes de continuar.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updatedClientInfo = {
        firstName,
        lastName,
        birthDate,
        ...(userRole === 'business' && { businessName }),
      };

      const updateData = {
        clientInfo: updatedClientInfo,
        profileComplete: true,
      };

      if (userRole === 'deliveryPerson') {
        updateData.name = firstName + ' ' + lastName;
        updateData.phone = phone;
      }

      let profileImageUrl = formData.profileImage;
      if (profileImageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}/${profileImageFile.name}`);
        await uploadBytes(storageRef, profileImageFile);
        profileImageUrl = await getDownloadURL(storageRef);
        updateData.profileImage = profileImageUrl;
      } else if (!profileImageUrl) {
        updateData.profileImage = null;
      }

      await setDoc(userDocRef, updateData, { merge: true });

      setClientInfo(updatedClientInfo);
      setProfileComplete(true);
      setIsEditingProfile(false);
      setProfileImageFile(null);
      toast.success('Información personal guardada exitosamente');
    } catch (err) {
      setError('Error al guardar el perfil: ' + err.message);
      toast.error('Error al guardar el perfil: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const getCurrentLocation = (isEditing = false) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          if (isEditing) {
            setEditLocation(location);
          } else {
            setNewLocation(location);
          }
          toast.success('Ubicación actual obtenida con éxito');
        },
        (error) => {
          toast.error('No se pudo obtener tu ubicación. Selecciona manualmente en el mapa.');
        }
      );
    } else {
      toast.error('La geolocalización no está soportada en este navegador.');
    }
  };

  const handleAddAddress = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para agregar direcciones.");
      return;
    }
    if (!newAddress || !newLabel || !newDistrict || !newReferencePoint || !newLocation) {
      toast.error("Por favor, completa todos los campos de la dirección, incluyendo la ubicación en el mapa.");
      return;
    }
    if (addresses.length >= 5) {
      toast.error("No puedes registrar más de 5 direcciones.");
      return;
    }

    setIsLoading(true);
    const newAddressObj = {
      id: Date.now().toString(),
      address: newAddress,
      label: newLabel,
      district: newDistrict,
      department: "Sonsonate",
      referencePoint: newReferencePoint,
      location: newLocation,
    };

    const updatedAddresses = [...addresses, newAddressObj];
    setAddresses(updatedAddresses);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { addresses: updatedAddresses }, { merge: true });
      toast.success('Dirección agregada exitosamente');
      setNewAddress('');
      setNewLabel('');
      setNewDistrict('');
      setNewReferencePoint('');
      setNewLocation(null);
    } catch (err) {
      toast.error('Error al agregar dirección: ' + err.message);
      setAddresses(addresses);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditAddressId(address.id);
    setEditAddress(address.address);
    setEditLabel(address.label);
    setEditDistrict(address.district || '');
    setEditReferencePoint(address.referencePoint || '');
    setEditLocation(address.location || null);
  };

  const handleSaveEdit = async () => {
    if (!editAddress || !editLabel || !editDistrict || !editReferencePoint || !editLocation) {
      toast.error("Por favor, completa todos los campos de la dirección, incluyendo la ubicación en el mapa.");
      return;
    }

    setIsLoading(true);
    const updatedAddresses = addresses.map((addr) =>
      addr.id === editAddressId
        ? {
            ...addr,
            address: editAddress,
            label: editLabel,
            district: editDistrict,
            department: "Sonsonate",
            referencePoint: editReferencePoint,
            location: editLocation,
          }
        : addr
    );

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { addresses: updatedAddresses }, { merge: true });
      setAddresses(updatedAddresses);
      toast.success('Dirección actualizada exitosamente');
      setEditAddressId(null);
      setEditAddress('');
      setEditLabel('');
      setEditDistrict('');
      setEditReferencePoint('');
      setEditLocation(null);
    } catch (err) {
      toast.error('Error al actualizar dirección: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setIsLoading(true);
    const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { addresses: updatedAddresses }, { merge: true });
      setAddresses(updatedAddresses);
      toast.success('Dirección eliminada exitosamente');
    } catch (err) {
      toast.error('Error al eliminar dirección: ' + err.message);
      setAddresses(addresses);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.")) {
      setIsLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        await deleteDoc(userDocRef);
        await auth.currentUser.delete();
        toast.success('Cuenta eliminada exitosamente');
        navigate('/', { replace: true });
      } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
          toast.error("Por favor, vuelve a iniciar sesión para eliminar tu cuenta.");
        } else {
          toast.error("Error al eliminar tu cuenta: " + error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      try {
        await logout();
        toast.success('Sesión cerrada exitosamente');
        navigate('/', { replace: true });
      } catch (error) {
        toast.error('Error al cerrar sesión: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-lg text-gray-700">Cargando...</p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-custom-blue">
          {userRole === 'business'
            ? 'Perfil de Negocio'
            : userRole === 'deliveryPerson'
            ? 'Perfil de Repartidor'
            : userRole === 'admin'
            ? 'Perfil de Administrador'
            : 'Mi Perfil'}
        </h3>
        {user ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md">
              <h4 className="text-lg font-semibold mb-4 text-custom-blue">Información del Usuario</h4>
              <div className="space-y-2">
                <p><span className="font-medium">Correo:</span> {user.email}</p>
                <p>
                  <span className="font-medium">Rol:</span>{' '}
                  {userRole === 'client'
                    ? 'Cliente'
                    : userRole === 'business'
                    ? 'Negocio'
                    : userRole === 'deliveryPerson'
                    ? 'Repartidor'
                    : userRole === 'admin'
                    ? 'Administrador'
                    : 'Rol no definido'}
                </p>
              </div>
            </div>

            {userRole === 'deliveryPerson' && (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h4 className="text-lg font-semibold mb-4 text-custom-blue">Información del Repartidor</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Estado:</span> {deliveryInfo?.status || 'Pendiente'}</p>
                  <p><span className="font-medium">Disponibilidad:</span> {deliveryInfo?.available ? 'Disponible' : 'No Disponible'}</p>
                  <p><span className="font-medium">Vehículo:</span> {deliveryInfo?.vehicleType || 'No especificado'}</p>
                  <p><span className="font-medium">Placa:</span> {deliveryInfo?.vehiclePlate || 'No especificada'}</p>
                  {deliveryInfo?.vehiclePhotoUrl && (
                    <p>
                      <span className="font-medium">Foto del Vehículo:</span>{' '}
                      <img
                        src={deliveryInfo.vehiclePhotoUrl}
                        alt="Vehículo"
                        className="w-16 h-16 object-cover rounded-md inline-block ml-2"
                      />
                    </p>
                  )}
                </div>
              </div>
            )}

            {profileComplete && !isEditingProfile ? (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h4 className="text-lg font-semibold mb-4 text-custom-blue">Información Personal</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Nombre:</span> {clientInfo?.firstName || 'No especificado'}</p>
                  <p><span className="font-medium">Apellido:</span> {clientInfo?.lastName || 'No especificado'}</p>
                  <p><span className="font-medium">Fecha de Nacimiento:</span> {clientInfo?.birthDate || 'No especificada'}</p>
                  {userRole === 'business' && (
                    <p><span className="font-medium">Nombre del Negocio:</span> {clientInfo?.businessName || 'No especificado'}</p>
                  )}
                  {userRole === 'deliveryPerson' && (
                    <p><span className="font-medium">Teléfono:</span> {formData.phone || 'No especificado'}</p>
                  )}
                  <p>
                    <span className="font-medium">Foto de Perfil:</span>{' '}
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage}
                        alt="Profile"
                        className="w-16 h-16 object-cover rounded-full inline-block ml-2"
                      />
                    ) : (
                      'No especificada'
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  className="mt-4 bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
                >
                  Editar Información Personal
                </Button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h4 className="text-lg font-semibold mb-4 text-custom-blue">
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
                      className={`mt-1 ${formErrors.firstName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Apellido"
                      className={`mt-1 ${formErrors.lastName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                    <Input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className={`mt-1 ${formErrors.birthDate ? 'border-red-500' : ''}`}
                    />
                    {formErrors.birthDate && <p className="text-red-500 text-xs mt-1">{formErrors.birthDate}</p>}
                  </div>
                  {userRole === 'business' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre del Negocio</label>
                      <Input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Nombre del Negocio"
                        className={`mt-1 ${formErrors.businessName ? 'border-red-500' : ''}`}
                      />
                      {formErrors.businessName && <p className="text-red-500 text-xs mt-1">{formErrors.businessName}</p>}
                    </div>
                  )}
                  {userRole === 'deliveryPerson' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Teléfono"
                        className={`mt-1 ${formErrors.phone ? 'border-red-500' : ''}`}
                      />
                      {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Foto de Perfil</label>
                    {formData.profileImage && (
                      <div className="mt-2 mb-2">
                        <img
                          src={formData.profileImage}
                          alt="Vista previa"
                          className="w-24 h-24 object-cover rounded-full"
                        />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="submit"
                      className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Guardando...' : 'Guardar y Continuar'}
                    </Button>
                    {isEditingProfile && (
                      <Button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="w-full bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                  {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
                </form>
              </div>
            )}

            {userRole === 'client' && (
              <div className="bg-white p-6 rounded-2xl shadow-md">
                <h4 className="text-lg font-semibold mb-4 text-custom-blue">¿Quieres vender?</h4>
                <Button
                  onClick={() => navigate('/role-selection')}
                  className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
                >
                  Vender en NEXXO
                </Button>
              </div>
            )}

            {(userRole === 'client' || userRole === 'business') && (
              <>
                <div className="bg-white p-6 rounded-2xl shadow-md">
                  <h4 className="text-lg font-semibold mb-4 text-custom-blue">Gestionar Direcciones</h4>
                  <div className="space-y-4">
                    <Input
                      placeholder="Etiqueta (ej. Casa, Trabajo)"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                    />
                    <Input
                      placeholder="Dirección (ej. 123 Calle Principal)"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                    />
                    <select
                      value={newDistrict}
                      onChange={(e) => setNewDistrict(e.target.value)}
                      className="w-full p-2 border rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
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
                      className="rounded-2xl border-gray-300 shadow-sm"
                    />
                    <Input
                      placeholder="Punto de referencia (ej. Frente al parque)"
                      value={newReferencePoint}
                      onChange={(e) => setNewReferencePoint(e.target.value)}
                      className="rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                    />
                    <div className="space-y-2">
                      <Button
                        onClick={() => getCurrentLocation(false)}
                        className="w-full bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl"
                      >
                        Obtener mi Ubicación Actual
                      </Button>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={newLocation || defaultCenter}
                        zoom={15}
                        onClick={(e) => setNewLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                      >
                        {newLocation && <Marker position={newLocation} />}
                      </GoogleMap>
                      {newLocation && (
                        <p className="text-sm text-gray-600">
                          Ubicación seleccionada: Lat {newLocation.lat.toFixed(4)}, Lng {newLocation.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleAddAddress}
                      className="w-full bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Agregando...' : 'Agregar Dirección'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {addresses.length > 0 ? (
                    addresses.map((address) => (
                      <div
                        key={address.id}
                        className="bg-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        {editAddressId === address.id ? (
                          <div className="flex-1 space-y-3">
                            <Input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              placeholder="Etiqueta"
                              className="rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                            />
                            <Input
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                              placeholder="Dirección"
                              className="rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                            />
                            <select
                              value={editDistrict}
                              onChange={(e) => setEditDistrict(e.target.value)}
                              className="w-full p-2 border rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
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
                              className="rounded-2xl border-gray-300 shadow-sm"
                            />
                            <Input
                              value={editReferencePoint}
                              onChange={(e) => setEditReferencePoint(e.target.value)}
                              placeholder="Punto de referencia"
                              className="rounded-2xl border-gray-300 shadow-sm focus:border-custom-blue focus:ring focus:ring-custom-blue focus:ring-opacity-50"
                            />
                            <div className="space-y-2">
                              <Button
                                onClick={() => getCurrentLocation(true)}
                                className="w-full bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl"
                              >
                                Obtener mi Ubicación Actual
                              </Button>
                              <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={editLocation || defaultCenter}
                                zoom={15}
                                onClick={(e) => setEditLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                              >
                                {editLocation && <Marker position={editLocation} />}
                              </GoogleMap>
                              {editLocation && (
                                <p className="text-sm text-gray-600">
                                  Ubicación seleccionada: Lat {editLocation.lat.toFixed(4)}, Lng {editLocation.lng.toFixed(4)}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                onClick={handleSaveEdit}
                                className="bg-custom-blue text-white hover:bg-blue-700 rounded-2xl"
                                disabled={isLoading}
                              >
                                {isLoading ? 'Guardando...' : 'Guardar'}
                              </Button>
                              <Button
                                onClick={() => setEditAddressId(null)}
                                className="bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-2xl"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <p className="font-semibold text-custom-blue">{address.label}</p>
                            <p>{address.address}</p>
                            <p><span className="font-medium">Distrito:</span> {address.district}</p>
                            <p><span className="font-medium">Departamento:</span> {address.department}</p>
                            <p><span className="font-medium">Punto de referencia:</span> {address.referencePoint}</p>
                            {address.location && (
                              <p>
                                <span className="font-medium">Ubicación:</span> Lat {address.location.lat.toFixed(4)}, Lng {address.location.lng.toFixed(4)}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => handleEditAddress(address)}
                            className="bg-blue-700 text-white hover:bg-blue-800 rounded-2xl"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="bg-red-500 text-white hover:bg-red-600 rounded-2xl"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Eliminando...' : 'Eliminar'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white p-4 rounded-2xl shadow-md text-center">
                      <p className="text-gray-600">No tienes direcciones registradas.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
              {userRole === 'business' && (
                <button
                  onClick={() => navigate('/business')}
                  className="text-custom-blue hover:underline font-medium"
                >
                  Ir al Panel de Negocio
                </button>
              )}
              {userRole === 'client' && (
                <button
                  onClick={() => navigate('/')}
                  className="text-custom-blue hover:underline font-medium"
                >
                  Volver al Inicio
                </button>
              )}
              {userRole === 'deliveryPerson' && (
                <button
                  onClick={() => navigate('/delivery-person')}
                  className="text-custom-blue hover:underline font-medium"
                >
                  Ir al Panel de Repartidor
                </button>
              )}
              {userRole === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="text-custom-blue hover:underline font-medium"
                >
                  Ir al Panel de Administrador
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
              <Button
                onClick={handleDeleteAccount}
                className="bg-gray-500 text-white hover:bg-red-600 rounded-2xl"
                disabled={isLoading}
              >
                {isLoading ? 'Eliminando...' : 'Eliminar mi Cuenta'}
              </Button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
              <Button
                onClick={handleLogout}
                className="bg-red-500 text-white hover:bg-red-600 rounded-2xl w-full"
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-md text-center">
            <p className="text-gray-600">Por favor, inicia sesión para gestionar tu perfil.</p>
          </div>
        )}
      </div>
    </section>
  );
}