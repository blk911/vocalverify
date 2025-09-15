// src/lib/firebaseAdmin.ts

import * as admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type CredSource = "file" | "json-env" | "legacy-env" | "none";

// Expose which source was used (handy for /api/selftest)
export let firebaseCredSource: CredSource = "none";

function normalizePem(v?: string) {
  if (!v) return undefined;
  // Convert escaped newlines and normalize CRLF -> LF, ensure trailing newline
  return v.replace(/\\n/g, "\n").replace(/\r\n?/g, "\n").trim() + "\n";
}

function loadServiceAccount() {
  // 1) Preferred: JSON file on disk (no escaping headaches)
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path) {
    const full = resolve(process.cwd(), path);
    const raw = readFileSync(full, "utf8");
    const svc = JSON.parse(raw);
    firebaseCredSource = "file";
    return {
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: normalizePem(String(svc.private_key || "")),
    };
  }

  // 2) Fallback: whole JSON blob in a single env var
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const svc = JSON.parse(json);
    firebaseCredSource = "json-env";
    return {
      projectId: svc.project_id,
      clientEmail: svc.client_email,
      privateKey: normalizePem(String(svc.private_key || "")),
    };
  }

  // 3) Legacy triplet envs (PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY)
  firebaseCredSource = "legacy-env";
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePem(process.env.FIREBASE_PRIVATE_KEY),
  };
}

if (!admin.apps.length) {
  try {
    const creds = loadServiceAccount();
    // Minimal sanity check before initializing
    if (!creds.projectId || !creds.clientEmail || !creds.privateKey) {
      firebaseCredSource = "none";
      throw new Error("Missing projectId, clientEmail, or privateKey");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: creds.projectId,
        clientEmail: creds.clientEmail,
        privateKey: creds.privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (e: any) {
    // Surface a concise error in server logs; upstream routes can report failure
    console.error(
      `Firebase Admin init failed (source=${firebaseCredSource}):`,
      e?.message || e
    );
    throw e;
  }
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
