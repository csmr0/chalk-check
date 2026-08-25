import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrxV7O0odbmthjAgvexzQYpDq0C9dIwI4",
  authDomain: "e-learn-a33c1.firebaseapp.com",
  projectId: "e-learn-a33c1",
  storageBucket: "e-learn-a33c1.firebasestorage.app",
  messagingSenderId: "113018352630",
  appId: "1:113018352630:web:1f0fded270e0de593f4dd7",
  measurementId: "G-761LQN4FX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const COLLECTION = "chalkcheck";

// Same signatures as the Claude-artifact window.storage helpers used in App.jsx,
// so App.jsx's calls (storeGet/storeSet/storeList) don't need to change.
// The extra "shared" boolean argument is accepted and ignored — everything in
// this app is shared by design.

export async function storeGet(key) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, key));
    return snap.exists() ? snap.data().value : null;
  } catch (e) {
    console.error("storeGet failed", key, e);
    return null;
  }
}

export async function storeSet(key, value) {
  try {
    await setDoc(doc(db, COLLECTION, key), { value, updatedAt: Date.now() });
    return true;
  } catch (e) {
    console.error("storeSet failed", key, e);
    return false;
  }
}

// Prefix match on document ID, e.g. storeList("player:AB3XZ:") returns every
// player doc id under that session.
export async function storeList(prefix) {
  try {
    const q = query(
      collection(db, COLLECTION),
      where(documentId(), ">=", prefix),
      where(documentId(), "<", prefix + "\uf8ff")
    );
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => d.id);
  } catch (e) {
    console.error("storeList failed", prefix, e);
    return [];
  }
}
