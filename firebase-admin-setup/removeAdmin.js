// removeAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function removeAdminRole(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    // Establece los Custom Claims a un objeto vacío para eliminarlos
    await admin.auth().setCustomUserClaims(user.uid, null);
    console.log(`Rol de administrador eliminado para el usuario ${email}. UID: ${user.uid}`);
  } catch (error) {
    console.error('Error al eliminar rol de administrador:', error);
  }
}

// Reemplaza con el correo del usuario
removeAdminRole('admin@nexxo.com').then(() => process.exit());y
