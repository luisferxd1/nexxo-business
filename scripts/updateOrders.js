// scripts/updateOrders.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Configuración de Firebase (reemplaza con tus credenciales)
const firebaseConfig = {
    apiKey: "AIzaSyAhsVwcVcO-q2fTpWCJBMx6XjQzxBWb8_k",
    authDomain: "nexxobusiness-c38b4.firebaseapp.com",
    projectId: "nexxobusiness-c38b4",
    storageBucket: "nexxobusiness-c38b4.firebasestorage.app",
    messagingSenderId: "274046324841",
    appId: "1:274046324841:web:5de5f39cdda45ca3ca92f8",
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para actualizar los documentos en la colección 'orders'
async function addPublicNoteField() {
  try {
    // Obtener todos los documentos de la colección 'orders'
    const ordersRef = collection(db, 'orders');
    const ordersSnapshot = await getDocs(ordersRef);

    console.log(`Encontrados ${ordersSnapshot.size} documentos en la colección 'orders'.`);

    // Iterar sobre cada documento y añadir el campo 'publicNote'
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();

      // Verificar si el campo 'publicNote' ya existe
      if (!('publicNote' in orderData)) {
        console.log(`Actualizando documento con ID: ${orderDoc.id}`);
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          publicNote: '', // Añadir el campo con un valor por defecto (cadena vacía)
        });
        console.log(`Documento ${orderDoc.id} actualizado con éxito.`);
      } else {
        console.log(`El documento ${orderDoc.id} ya tiene el campo 'publicNote'.`);
      }
    }

    console.log('Actualización completada.');
  } catch (error) {
    console.error('Error al actualizar los documentos:', error);
  }
}

// Ejecutar la función
addPublicNoteField().then(() => {
  console.log('Script finalizado.');
  process.exit(0);
});