import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, Firestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const PROJECTS_COLLECTION = "projects";

function getConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) return null;
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
  };
}

let db: Firestore | null = null;

export function useFirestore(): boolean {
  if (import.meta.env.VITE_USE_FIRESTORE === "false") return false;
  return !!getConfig();
}

export function getFirestoreDb(): Firestore | null {
  if (db) return db;
  const config = getConfig();
  if (!config) return null;
  try {
    if (getApps().length === 0) {
      initializeApp(config);
    }
    db = getFirestore();
    return db;
  } catch (err) {
    console.error("Firebase init error:", err);
    return null;
  }
}

export interface ProjectDoc {
  id: string;
  title: string;
  category: string;
  image: string;
  niche: string;
  description: string;
}

export async function firestoreGetProjects(): Promise<ProjectDoc[]> {
  const firestore = getFirestoreDb();
  if (!firestore) return [];
  const snap = await getDocs(collection(firestore, PROJECTS_COLLECTION));
  const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ProjectDoc[];
  return projects.sort((a, b) => Number(b.id) - Number(a.id));
}

export async function firestoreAddProject(project: Omit<ProjectDoc, "id">): Promise<ProjectDoc | null> {
  const firestore = getFirestoreDb();
  if (!firestore) return null;
  const id = Date.now().toString();
  const docData = { ...project, id };
  await setDoc(doc(firestore, PROJECTS_COLLECTION, id), docData);
  return docData as ProjectDoc;
}

export async function firestoreDeleteProject(id: string): Promise<boolean> {
  const firestore = getFirestoreDb();
  if (!firestore) return false;
  await deleteDoc(doc(firestore, PROJECTS_COLLECTION, id));
  return true;
}

/** Upload a file to Firebase Storage and return the public URL. Use this instead of base64 when using Firestore. */
export async function uploadImageToStorage(file: File): Promise<string> {
  getFirestoreDb(); // ensure Firebase app is initialized
  const storage = getStorage();
  const path = `projects/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
