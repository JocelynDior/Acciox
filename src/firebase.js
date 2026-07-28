import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyA3f6uz8DHZ9xeUFX-65XSAZQmKkAiHQp0",
  authDomain: "acciox.firebaseapp.com",
  projectId: "acciox",
  storageBucket: "acciox.firebasestorage.app",
  messagingSenderId: "899417289618",
  appId: "1:899417289618:web:b58c2a1da846e03058874b",
  measurementId: "G-TSG26XTRKW",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export {
  app,
  auth,
  db,
  storage,
  analytics,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
};
