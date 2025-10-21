import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Initialize Firebase app for storage
const firebaseConfig = {
  // Use environment variables for Firebase config
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload QR code image to Firebase Storage
 * @param inviteId - Unique invite identifier
 * @param qrCodeBuffer - QR code image buffer
 * @returns Promise<string> - Download URL of uploaded QR code
 */
export const uploadQRCode = async (
  inviteId: string,
  qrCodeBuffer: Buffer
): Promise<string> => {
  try {
    console.log(`[FIREBASE-STORAGE] Uploading QR code for invite: ${inviteId}`);

    // Create storage reference
    const qrRef = ref(storage, `qr-codes/${inviteId}.png`);

    // Upload the buffer
    await uploadBytes(qrRef, qrCodeBuffer);

    // Get download URL
    const downloadURL = await getDownloadURL(qrRef);

    console.log(
      `[FIREBASE-STORAGE] ✅ QR code uploaded successfully: ${downloadURL}`
    );
    return downloadURL;
  } catch (error) {
    console.error(`[FIREBASE-STORAGE] ❌ Error uploading QR code:`, error);
    throw new Error(`Failed to upload QR code: ${error}`);
  }
};

/**
 * Delete QR code from Firebase Storage
 * @param inviteId - Unique invite identifier
 */
export const deleteQRCode = async (inviteId: string): Promise<void> => {
  try {
    console.log(`[FIREBASE-STORAGE] Deleting QR code for invite: ${inviteId}`);

    const qrRef = ref(storage, `qr-codes/${inviteId}.png`);
    await deleteObject(qrRef);

    console.log(`[FIREBASE-STORAGE] ✅ QR code deleted successfully`);
  } catch (error) {
    console.error(`[FIREBASE-STORAGE] ❌ Error deleting QR code:`, error);
    // Don't throw error for delete operations - file might not exist
  }
};

/**
 * Get QR code download URL
 * @param inviteId - Unique invite identifier
 * @returns Promise<string> - Download URL of QR code
 */
export const getQRCodeURL = async (inviteId: string): Promise<string> => {
  try {
    const qrRef = ref(storage, `qr-codes/${inviteId}.png`);
    return await getDownloadURL(qrRef);
  } catch (error) {
    console.error(`[FIREBASE-STORAGE] ❌ Error getting QR code URL:`, error);
    throw new Error(`QR code not found: ${error}`);
  }
};


