import { initializeApp } from "firebase/app";
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

// 1. Go to https://console.firebase.google.com -> Add project (free).
// 2. Build > Firestore Database > Create database > Start in test mode.
// 3. Project settings (gear icon) > General > "Your apps" > Web app (</>) > copy the config below.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
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
