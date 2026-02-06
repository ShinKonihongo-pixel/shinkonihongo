// Kanji Lesson Firestore service

import type { KanjiLesson } from '../../types/kanji';
import { deleteKanjiCardsByLesson } from './kanji-card-service';
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

export async function getAllKanjiLessons(): Promise<KanjiLesson[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.KANJI_LESSONS));
  return snapshot.docs.map(doc => mapDoc<KanjiLesson>(doc));
}

export function subscribeToKanjiLessons(callback: (lessons: KanjiLesson[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.KANJI_LESSONS), (snapshot) => {
    const lessons = snapshot.docs.map(doc => mapDoc<KanjiLesson>(doc));
    callback(lessons);
  });
}

export async function addKanjiLesson(data: Omit<KanjiLesson, 'id'>): Promise<KanjiLesson> {
  const docRef = await addDoc(collection(db, COLLECTIONS.KANJI_LESSONS), data);
  return { id: docRef.id, ...data };
}

export async function updateKanjiLesson(id: string, data: Partial<KanjiLesson>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KANJI_LESSONS, id);
  await updateDoc(docRef, data);
}

export async function deleteKanjiLesson(id: string): Promise<void> {
  await deleteKanjiCardsByLesson(id);
  const docRef = doc(db, COLLECTIONS.KANJI_LESSONS, id);
  await deleteDoc(docRef);
}

export async function getKanjiLessonChildren(parentId: string): Promise<KanjiLesson[]> {
  const q = query(collection(db, COLLECTIONS.KANJI_LESSONS), where('parentId', '==', parentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc<KanjiLesson>(doc));
}
