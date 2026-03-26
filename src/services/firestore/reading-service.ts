// Reading comprehension Firestore service
// Handles passages and their organizing folders

import type { ReadingPassage, ReadingPassageFormData, ReadingFolder } from '../../types/reading';
import type { JLPTLevel } from '../../types/flashcard';
import {
  COLLECTIONS,
  mapDoc,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

// Subscribe to all reading passages, ordered newest-first
export function subscribeToPassages(callback: (passages: ReadingPassage[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.READING_PASSAGES), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const passages = snapshot.docs.map(doc => mapDoc<ReadingPassage>(doc));
    callback(passages);
  });
}

// Subscribe to all reading folders, ordered by display order asc
export function subscribeToReadingFolders(callback: (folders: ReadingFolder[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.READING_FOLDERS), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => mapDoc<ReadingFolder>(doc));
    callback(folders);
  });
}

// Add a new reading passage (assigns generated ids to questions)
export async function addPassage(data: ReadingPassageFormData, createdBy?: string): Promise<ReadingPassage> {
  const questions = data.questions.map((q, idx) => ({
    ...q,
    id: `q_${Date.now()}_${idx}`,
  }));
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.READING_PASSAGES), {
    ...data,
    questions,
    createdAt: now,
    createdBy,
  });
  return { id: docRef.id, ...data, questions, createdAt: now, createdBy };
}

// Update a reading passage by id
export async function updatePassage(id: string, data: Partial<ReadingPassage>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.READING_PASSAGES, id), data);
}

// Delete a reading passage by id
export async function deletePassage(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.READING_PASSAGES, id));
}

// Add a reading folder; order is auto-incremented within the level
export async function addReadingFolder(
  name: string,
  jlptLevel: JLPTLevel,
  order: number,
  createdBy?: string,
): Promise<ReadingFolder> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.READING_FOLDERS), {
    name,
    jlptLevel,
    order,
    createdAt: now,
    createdBy,
  });
  return { id: docRef.id, name, jlptLevel, order, createdAt: now, createdBy };
}

// Update a reading folder by id
export async function updateReadingFolder(id: string, data: Partial<ReadingFolder>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.READING_FOLDERS, id), data);
}

// Delete a reading folder by id
export async function deleteReadingFolder(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.READING_FOLDERS, id));
}

// Delete all passages belonging to a folder (called before folder deletion)
export async function deletePassagesByFolder(folderId: string, passages: ReadingPassage[]): Promise<void> {
  const inFolder = passages.filter(p => p.folderId === folderId);
  await Promise.all(inFolder.map(p => deleteDoc(doc(db, COLLECTIONS.READING_PASSAGES, p.id))));
}
