import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export let firebaseInitialized = false;

console.warn(
  'Firebase Admin SDK require() hangs in Node 23, and credentials not found. Running in DEVELOPMENT BYPASS MODE.'
);

const admin = {
  auth: () => ({
    verifyIdToken: async (token: string) => { throw new Error('Firebase disabled'); }
  }),
  credential: { cert: () => ({}) },
  apps: [],
  initializeApp: () => {}
};

export default admin;
