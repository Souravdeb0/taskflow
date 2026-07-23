import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'serviceAccountKey.json');
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

export let firebaseInitialized = false;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    console.log(`Firebase Admin SDK initialized using service account file: ${serviceAccountPath}`);
    firebaseInitialized = true;
  } else if (projectId && clientEmail && privateKey) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
    console.log('Firebase Admin SDK initialized using environment variables');
    firebaseInitialized = true;
  } else {
    console.warn(
      'Firebase credentials not found (no serviceAccountKey.json or env variables). Running in DEVELOPMENT BYPASS MODE.'
    );
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
}

export default admin;
