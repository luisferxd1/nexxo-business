const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setAdminRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo los administradores pueden asignar roles.'
    );
  }

  const { email } = data;

  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requiere el correo electrónico del usuario.'
    );
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    return { message: `Usuario ${email} ahora es administrador.` };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Error al asignar rol de administrador: ${error.message}`
    );
  }
});

exports.removeAdminRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo los administradores pueden quitar roles.'
    );
  }

  const { email } = data;

  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Se requiere el correo electrónico del usuario.'
    );
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, null);
    return { message: `Rol de administrador eliminado para el usuario ${email}.` };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Error al quitar rol de administrador: ${error.message}`
    );
  }
});