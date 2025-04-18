// fix-orders.js (versión ESM con autenticación)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración de Firebase (reemplaza con tu configuración real)
const firebaseConfig = {
    apiKey: "AIzaSyAhsVwcVcO-q2fTpWCJBMx6XjQzxBWb8_k",
    authDomain: "nexxobusiness-c38b4.firebaseapp.com",
    projectId: "nexxobusiness-c38b4",
    storageBucket: "nexxobusiness-c38b4.firebasestorage.app",
    messagingSenderId: "274046324841",
    appId: "1:274046324841:web:5de5f39cdda45ca3ca92f8",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function fixOrders() {
  try {
    // Autenticar con un usuario admin o business
    const email = 'your-admin-or-business-email@example.com'; // Reemplaza con el correo de un usuario admin o business
    const password = 'your-password'; // Reemplaza con la contraseña del usuario
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Autenticación exitosa:', auth.currentUser.uid);

    // Obtener y actualizar los pedidos
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      if (!orderData.businessId) {
        await updateDoc(doc(db, 'orders', orderDoc.id), {
          businessId: 'businessUid123', // Reemplaza con el UID correcto del negocio
        });
        console.log(`Actualizado pedido ${orderDoc.id}`);
      }
    }
    console.log('Corrección de pedidos completada.');
  } catch (error) {
    console.error('Error al corregir los pedidos:', error);
  }
}

fixOrders();