import 'server-only';
import type { App } from 'firebase-admin/app';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import {
  getStorage as getFirebaseStorage,
  type Storage,
} from 'firebase-admin/storage';
import { initializeProductionConfig } from './productionConfig';
import { autoInitializeDatabase } from './databaseInit';

declare global {
  // eslint-disable-next-line no-var, camelcase
  var __vv_admin_app__: App | undefined;
  // eslint-disable-next-line no-var, camelcase
  var __vv_admin_db__: Firestore | undefined;
  // eslint-disable-next-line no-var, camelcase
  var __vv_admin_storage__: Storage | undefined;
}

function need(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`[firebaseAdmin] Missing env ${name}`);
  return v;
}
function normalizeKey(k: string) {
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  )
    k = k.slice(1, -1);
  return k.replace(/\\n/g, '\n');
}

export function getDb(): Firestore {
  if (globalThis.__vv_admin_db__) return globalThis.__vv_admin_db__!;

  // Initialize production configuration
  if (!initializeProductionConfig()) {
    throw new Error('Failed to initialize production configuration');
  }

  if (!getApps().length && !globalThis.__vv_admin_app__) {
    // Use individual environment variables
    const projectId = need('FIREBASE_PROJECT_ID');
    const clientEmail = need('FIREBASE_CLIENT_EMAIL');
    const privateKey = normalizeKey(need('FIREBASE_PRIVATE_KEY'));
    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    globalThis.__vv_admin_app__ = app;
  }
  const db = getFirestore(globalThis.__vv_admin_app__!);

  // Production database configuration
  // No emulator dependency - always use production Firebase
  globalThis.__vv_admin_db__ = db;
  return db;
}

export function getStorage(): Storage {
  if (globalThis.__vv_admin_storage__) return globalThis.__vv_admin_storage__!;
  if (!getApps().length && !globalThis.__vv_admin_app__) {
    // Use individual environment variables
    const projectId = need('FIREBASE_PROJECT_ID');
    const clientEmail = need('FIREBASE_CLIENT_EMAIL');
    const privateKey = normalizeKey(need('FIREBASE_PRIVATE_KEY'));
    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    globalThis.__vv_admin_app__ = app;
  }
  const storage = getFirebaseStorage(globalThis.__vv_admin_app__!);
  globalThis.__vv_admin_storage__ = storage;
  return storage;
}
