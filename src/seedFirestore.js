// src/seedFirestore.js
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const seedData = async () => {
  const categories = [
    "Alimentación",
    "Farmacias",
    "Ropa y Accesorios",
    "Ferretería",
  ];

  const products = [
    {
      name: "Producto 1",
      business: "Negocio X",
      price: 10.00,
      category: "Alimentación",
      image: "https://dummyimage.com/150x150/000/fff&text=Producto+1", // Nueva URL
    },
    {
      name: "Producto 2",
      business: "Negocio Y",
      price: 15.00,
      category: "Farmacias",
      image: "https://dummyimage.com/150x150/000/fff&text=Producto+2", // Nueva URL
    },
    {
      name: "Producto 3",
      business: "Negocio Z",
      price: 20.00,
      category: "Ropa y Accesorios",
      image: "https://dummyimage.com/150x150/000/fff&text=Producto+3", // Nueva URL
    },
  ];

  const orders = [
    { status: "En preparación", items: ["Producto 1"], deliveryDate: "2025-03-25" },
    { status: "En camino", items: ["Producto 2"], deliveryDate: "2025-03-23" },
    { status: "Entregado", items: ["Producto 3"], deliveryDate: "2025-03-20" },
  ];

  try {
    // Cargar categorías
    for (const category of categories) {
      await addDoc(collection(db, "categories"), { name: category });
    }
    console.log("Categorías cargadas");

    // Cargar productos
    for (const product of products) {
      await addDoc(collection(db, "products"), product);
    }
    console.log("Productos cargados");

    // Cargar pedidos
    for (const order of orders) {
      await addDoc(collection(db, "orders"), order);
    }
    console.log("Pedidos cargados");
  } catch (error) {
    console.error("Error al cargar datos:", error);
  }
};

// Ejecuta esta función una vez
seedData();