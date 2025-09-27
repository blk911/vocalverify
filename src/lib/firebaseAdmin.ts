import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getApp() {
  if (getApps().length) return getApps()[0];

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const json = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return initializeApp({
      credential: cert(json),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  // Fallback to service account file for local development
  try {
    const serviceAccount = require("../../credentials/service-account.json");
    return initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "trustgame-8lerq.appspot.com",
    });
  } catch (error) {
    }

  throw new Error("Firebase Admin credentials missing");
}

const app = getApp();
export const db = getFirestore(app);
export const storage = getStorage(app);
