import admin from 'firebase-admin';
import 'dotenv/config'; // Carga las variables de entorno desde .env

// Configuración de Firebase Admin usando variables de entorno
const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplaza \n con saltos de línea reales
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_ADMIN_CLIENT_EMAIL}`
};

// Verificar que las variables de entorno estén definidas
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    console.error("Faltan variables de entorno de Firebase Admin. Verifica tu archivo .env");
}

// Inicializa Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

// Exporta las instancias de Firestore y Auth para usarlas en otros archivos
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();