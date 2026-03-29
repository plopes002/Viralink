// src/lib/firebaseAdmin.ts
import "server-only";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseConfig() {
  try {
    return process.env.FIREBASE_CONFIG
      ? JSON.parse(process.env.FIREBASE_CONFIG)
      : {};
  } catch {
    return {};
  }
}

const firebaseConfig = getFirebaseConfig();

const hasServiceAccount =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

const adminApp =
  getApps().length > 0
    ? getApps()[0]!
    : hasServiceAccount
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
        projectId:
          process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      })
    : initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export { adminApp };