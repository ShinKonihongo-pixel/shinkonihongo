// Kaiwa Folder Firestore service

import type { KaiwaFolder } from '../../types/kaiwa-question';
import {
  COLLECTIONS,
  getTodayISO,
  mapDoc,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export function subscribeToKaiwaFolders(callback: (folders: KaiwaFolder[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.KAIWA_FOLDERS), (snapshot) => {
    const folders = snapshot.docs.map(doc => mapDoc<KaiwaFolder>(doc));
    callback(folders);
  });
}

export async function addKaiwaFolder(
  name: string,
  level: KaiwaFolder['level'],
  topic: KaiwaFolder['topic'],
  createdBy?: string
): Promise<KaiwaFolder> {
  const newFolder: Omit<KaiwaFolder, 'id'> = {
    name,
    level,
    topic,
    order: Date.now(),
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.KAIWA_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateKaiwaFolder(id: string, data: Partial<KaiwaFolder>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_FOLDERS, id);
  await updateDoc(docRef, data);
}

export async function deleteKaiwaFolder(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_FOLDERS, id);
  await deleteDoc(docRef);
}
