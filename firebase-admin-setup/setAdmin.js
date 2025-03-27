// setAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Ajusta el nombre si renombraste el archivo

// Inicializa el Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdminRole(email) {
  try {
    // Busca al usuario por su correo electrónico
    const user = await admin.auth().getUserByEmail(email);
    // Asigna el Custom Claim 'admin: true'
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Usuario ${email} ahora es administrador. UID: ${user.uid}`);
  } catch (error) {
    console.error('Error al establecer rol de administrador:', error);
  }
}

// Reemplaza 'admin@example.com' con el correo del usuario que quieres hacer administrador
setAdminRole('luisferxd18@gmail.com').then(() => process.exit());