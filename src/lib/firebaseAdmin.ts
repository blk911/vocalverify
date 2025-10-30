import admin from "firebase-admin";

/** keep admin app singleton in dev */
declare global {
  // eslint-disable-next-line no-var
  var __FBA_APP__: admin.app.App | undefined;
}

function initAdmin(): admin.app.App {
  if (global.__FBA_APP__) return global.__FBA_APP__;
  if (admin.apps.length) {
    global.__FBA_APP__ = admin.app();
    return global.__FBA_APP__;
  }

  const projectId =
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    "amihuman-local";

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  console.log('🔧 [FIREBASE-ADMIN] Initializing with:', {
    projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    emulatorHost,
    nodeEnv: process.env.NODE_ENV
  });

  // Check if we're using emulator
  if (emulatorHost) {
    console.log('🔧 [FIREBASE-ADMIN] Using Firestore emulator:', emulatorHost);
    global.__FBA_APP__ = admin.initializeApp({
      projectId,
    });
    
    // Configure emulator settings
    const fs = admin.firestore(global.__FBA_APP__);
    fs.settings({ 
      host: emulatorHost, 
      ssl: false,
      ignoreUndefinedProperties: true
    });
    
    console.log('✅ [FIREBASE-ADMIN] Emulator configured successfully');
    return global.__FBA_APP__;
  }

  // Production/service account setup
  if (clientEmail && privateKey) {
    console.log('🔧 [FIREBASE-ADMIN] Using service account credentials');
    global.__FBA_APP__ = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    try {
      console.log('🔧 [FIREBASE-ADMIN] Trying application default credentials');
      global.__FBA_APP__ = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } catch (error) {
      console.log('⚠️ [FIREBASE-ADMIN] ADC failed, trying without credentials');
      // Last-ditch local dev: initialize without creds (works w/ emulator)
      global.__FBA_APP__ = admin.initializeApp({
        projectId,
      });
    }
  }

  return global.__FBA_APP__;
}

/** Primary Firestore instance */
export const db = (() => {
  const app = initAdmin();
  return admin.firestore(app);
})();

/** Back-compat for older imports */
export function getDb() {
  return db;
}

/** Optional helpers (used by some routes) */
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

/** Storage helper for file uploads */
export function getStorage() {
  const app = initAdmin();
  return admin.storage(app);
}

export default db;
