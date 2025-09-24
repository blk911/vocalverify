// src/lib/firebaseAdmin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Lazy initialization to avoid build-time errors
let app: any = null;

function getFirebaseApp() {
  if (!app) {
    const firebaseAdminConfig = process.env.FIREBASE_PROJECT_ID ? {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as any),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    } : (() => {
      // Fallback to local service account for development
      const serviceAccount = require('../../service-account.json');
      return {
        credential: cert(serviceAccount as any),
        storageBucket: 'trustgame-8lerq.firebasestorage.app'
      };
    })();

    app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
  }
  return app;
}

// Lazy exports to avoid build-time initialization
export const db = new Proxy({} as any, {
  get(target, prop) {
    return getFirestore(getFirebaseApp())[prop];
  }
});

export const adminStorage = new Proxy({} as any, {
  get(target, prop) {
    return getStorage(getFirebaseApp())[prop];
  }
});

export const bucket = new Proxy({} as any, {
  get(target, prop) {
    return getStorage(getFirebaseApp()).bucket()[prop];
  }
});

export const storage = new Proxy({} as any, {
  get(target, prop) {
    return getStorage(getFirebaseApp())[prop];
  }
});

export const firebaseCredSource = process.env.FIREBASE_PROJECT_ID ? 'environment' : 'service-account.json';