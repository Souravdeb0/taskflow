import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCNt1TBK5AK_6vvfTH46uVfHqALL_BFZsM',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'taskflow-5bbe0.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'taskflow-5bbe0',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'taskflow-5bbe0.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '153004439829',
  appId: env.VITE_FIREBASE_APP_ID || '1:153004439829:web:d159f1a30d6bdc829ad11c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut };
