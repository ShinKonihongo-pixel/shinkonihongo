// Flashcard Firestore service

import type { Flashcard, FlashcardFormData } from '../../types/flashcard';
import { getDefaultSM2Values } from '../../lib/spaced-repetition';
import {
  COLLECTIONS,
  getTodayISO,
  mapDoc,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export async function getAllFlashcards(): Promise<Flashcard[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.FLASHCARDS));
  return snapshot.docs.map(doc => mapDoc<Flashcard>(doc));
}

export function subscribeToFlashcards(callback: (cards: Flashcard[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.FLASHCARDS), (snapshot) => {
    const cards = snapshot.docs.map(doc => mapDoc<Flashcard>(doc));
    callback(cards);
  });
}

export async function addFlashcard(data: FlashcardFormData, createdBy?: string): Promise<Flashcard> {
  const defaultValues = getDefaultSM2Values();
  const initialDifficulty = data.difficultyLevel || defaultValues.difficultyLevel;
  const newCard: Omit<Flashcard, 'id'> = {
    ...data,
    ...defaultValues,
    difficultyLevel: initialDifficulty,
    originalDifficultyLevel: initialDifficulty,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.FLASHCARDS), newCard);
  return { id: docRef.id, ...newCard } as Flashcard;
}

export async function updateFlashcard(id: string, data: Partial<Flashcard>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FLASHCARDS, id);
  await updateDoc(docRef, data);
}

export async function deleteFlashcard(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FLASHCARDS, id);
  await deleteDoc(docRef);
}

export async function deleteAllFlashcards(): Promise<number> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.FLASHCARDS));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  return snapshot.docs.length;
}

export async function deleteFlashcardsByLevel(level: string): Promise<number> {
  const q = query(collection(db, COLLECTIONS.FLASHCARDS), where('jlptLevel', '==', level));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  return snapshot.docs.length;
}

export async function deleteFlashcardsByLesson(lessonId: string): Promise<void> {
  const q = query(collection(db, COLLECTIONS.FLASHCARDS), where('lessonId', '==', lessonId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// Import function for data import feature
export async function importFlashcard(data: Omit<Flashcard, 'id'>): Promise<Flashcard> {
  const docRef = await addDoc(collection(db, COLLECTIONS.FLASHCARDS), data);
  return { id: docRef.id, ...data } as Flashcard;
}
