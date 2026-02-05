// JLPT Folder Firestore service

import type { JLPTFolder } from '../../types/jlpt-question';
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

export function subscribeToJLPTFolders(callback: (folders: JLPTFolder[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.JLPT_FOLDERS), (snapshot) => {
    const folders = snapshot.docs.map(doc => mapDoc<JLPTFolder>(doc));
    callback(folders);
  });
}

export async function addJLPTFolder(
  name: string,
  level: JLPTFolder['level'],
  category: JLPTFolder['category'],
  createdBy?: string
): Promise<JLPTFolder> {
  const newFolder: Omit<JLPTFolder, 'id'> = {
    name,
    level,
    category,
    order: Date.now(),
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateJLPTFolder(id: string, data: Partial<JLPTFolder>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_FOLDERS, id);
  await updateDoc(docRef, data);
}

export async function deleteJLPTFolder(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_FOLDERS, id);
  await deleteDoc(docRef);
}

// Import function for data import feature
export async function importJLPTFolder(data: Omit<JLPTFolder, 'id'>): Promise<JLPTFolder> {
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_FOLDERS), data);
  return { id: docRef.id, ...data };
}
