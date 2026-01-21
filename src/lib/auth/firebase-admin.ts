import 'dotenv/config';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDB = admin.firestore();

// Set custom claim for admin user
const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID!;
adminAuth.setCustomUserClaims(adminUID, { admin: true })
  .then(() => {
    console.log(`✅ Custom claim 'admin: true' set for user ${adminUID}`);
  })
  .catch((err) => {
    console.error('❌ Error setting admin claim:', err);
  });