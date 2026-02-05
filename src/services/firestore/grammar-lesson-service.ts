// Grammar Lesson Firestore service

import type { GrammarLesson } from '../../types/flashcard';
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
  query,
  where,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export async function getAllGrammarLessons(): Promise<GrammarLesson[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.GRAMMAR_LESSONS));
  return snapshot.docs.map(doc => mapDoc<GrammarLesson>(doc));
}

export function subscribeToGrammarLessons(callback: (lessons: GrammarLesson[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.GRAMMAR_LESSONS), (snapshot) => {
    const lessons = snapshot.docs.map(doc => mapDoc<GrammarLesson>(doc));
    callback(lessons);
  });
}

export async function addGrammarLesson(data: Omit<GrammarLesson, 'id'>): Promise<GrammarLesson> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GRAMMAR_LESSONS), data);
  return { id: docRef.id, ...data };
}

export async function updateGrammarLesson(id: string, data: Partial<GrammarLesson>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GRAMMAR_LESSONS, id);
  await updateDoc(docRef, data);
}

export async function deleteGrammarLesson(id: string): Promise<void> {
  await deleteGrammarCardsByLesson(id);
  const docRef = doc(db, COLLECTIONS.GRAMMAR_LESSONS, id);
  await deleteDoc(docRef);
}

export async function getGrammarLessonChildren(parentId: string): Promise<GrammarLesson[]> {
  const q = query(collection(db, COLLECTIONS.GRAMMAR_LESSONS), where('parentId', '==', parentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc<GrammarLesson>(doc));
}
