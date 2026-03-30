// src/lib/firebaseClient.ts

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

function readFirebaseConfig(): FirebaseWebConfig {
  const fromEnv = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const hasFullNextPublicConfig = Object.values(fromEnv).every(Boolean);

  if (hasFullNextPublicConfig) {
    return fromEnv as FirebaseWebConfig;
  }

  const rawWebAppConfig = process.env.FIREBASE_WEBAPP_CONFIG;

  if (rawWebAppConfig) {
    try {
      const parsed = JSON.parse(rawWebAppConfig);

      const fromFirebaseHosting = {
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket,
        messagingSenderId: parsed.messagingSenderId,
        appId: parsed.appId,
      };

      const missing = Object.entries(fromFirebaseHosting)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missing.length === 0) {
        return fromFirebaseHosting as FirebaseWebConfig;
      }
    } catch (error) {
      console.error("Erro ao ler FIREBASE_WEBAPP_CONFIG:", error);
    }
  }

  throw new Error(
    "Config do Firebase Web ausente. Defina NEXT_PUBLIC_FIREBASE_* ou use FIREBASE_WEBAPP_CONFIG."
  );
}

const firebaseConfig = readFirebaseConfig();

export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);

// auth só deve ser criado no browser
export const auth: Auth | null =
  typeof window !== "undefined" ? getAuth(app) : null;