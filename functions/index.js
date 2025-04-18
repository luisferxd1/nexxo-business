const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

exports.setUserRole = onCall(async (data, context) => {
  // Verifica que la solicitud venga de un usuario autenticado
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'El usuario debe estar autenticado.');
  }

  // Obtén el UID del usuario y el rol a asignar
  const { userId, role } = data;
  if (!userId || !role) {
    throw new HttpsError('invalid-argument', 'Faltan parámetros: userId y role son requeridos.');
  }

  // Lista de roles permitidos
  const validRoles = ['admin', 'business', 'client', 'deliveryPerson'];
  const selfAssignableRoles = ['business', 'client', 'deliveryPerson'];
  if (!validRoles.includes(role)) {
    throw new HttpsError('invalid-argument', 'Rol no válido. Roles permitidos: ' + validRoles.join(', '));
  }

  // Verifica si el usuario está intentando asignar su propio rol o si es un admin
  const callerUid = context.auth.uid;
  const isSelfAssigning = callerUid === userId;
  const callerDoc = await getFirestore().collection('users').doc(callerUid).get();
  const isAdmin = callerDoc.exists && callerDoc.data().role === 'admin';

  if (!isAdmin && !isSelfAssigning) {
    throw new HttpsError('permission-denied', 'No tienes permiso para asignar roles a otros usuarios.');
  }

  if (isSelfAssigning && !selfAssignableRoles.includes(role)) {
    throw new HttpsError('permission-denied', 'No puedes asignarte el rol ' + role + '.');
  }

  try {
    // Establece el Custom Claim para el usuario
    await getAuth().setCustomUserClaims(userId, { role });

    // Actualiza o crea el documento del usuario en Firestore
    await getFirestore().collection('users').doc(userId).update({
      role,
      roleUpdatedAt: FieldValue.serverTimestamp(),
    }).catch(async (error) => {
      if (error.code === 'not-found') {
        await getFirestore().collection('users').doc(userId).set({
          role,
          roleUpdatedAt: FieldValue.serverTimestamp(),
          email: (await getAuth().getUser(userId)).email || '',
          createdAt: FieldValue.serverTimestamp(),
        });
      } else {
        throw error;
      }
    });

    return { success: true, message: `Rol ${role} asignado al usuario ${userId}.` };
  } catch (error) {
    throw new HttpsError('internal', 'Error al asignar el rol: ' + error.message);
  }
});