// Lesson Firestore service

import type { Lesson } from '../../types/flashcard';
import { deleteFlashcardsByLesson } from './flashcard-service';
import { deleteGrammarCardsByLesson } from './grammar-card-service';
import {
  COLLECTIONS,
  mapDoc,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export async function getAllLessons(): Promise<Lesson[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.LESSONS));
  return snapshot.docs.map(doc => mapDoc<Lesson>(doc));
}

export function subscribeToLessons(callback: (lessons: Lesson[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.LESSONS), (snapshot) => {
    const lessons = snapshot.docs.map(doc => mapDoc<Lesson>(doc));
    callback(lessons);
  });
}

export async function addLesson(data: Omit<Lesson, 'id'>): Promise<Lesson> {
  const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), data);
  return { id: docRef.id, ...data };
}

export async function updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LESSONS, id);
  await updateDoc(docRef, data);
}

export async function deleteLesson(id: string): Promise<void> {
  await deleteFlashcardsByLesson(id);
  await deleteGrammarCardsByLesson(id);
  const docRef = doc(db, COLLECTIONS.LESSONS, id);
  await deleteDoc(docRef);
}

// Import function for data import feature
export async function importLesson(data: Omit<Lesson, 'id'>): Promise<Lesson> {
  const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), data);
  return { id: docRef.id, ...data };
}
