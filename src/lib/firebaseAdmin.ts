// src/lib/firebaseAdmin.ts
import 'server-only';
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    // Se estiver rodando no Firebase Hosting/Emulador,
    // normalmente não precisa passar nada aqui.
    // Se um dia for usar service account, configuramos depois.
  });
}

export const adminFirestore = admin.firestore();
export const adminAuth = admin.auth();
