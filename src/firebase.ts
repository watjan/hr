/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import config from '../firebase-applet-config.json';

// Support both environment variables (for production deployments) and config JSON fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || config.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || config.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || config.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || config.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || config.appId
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || (config as any).firestoreDatabaseId || "ai-studio-68d424b9-6a2b-4d65-b480-ee0f1e9e8407";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using the custom database ID and enable long-polling to prevent iframe network connection issues
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

export { app, db };

