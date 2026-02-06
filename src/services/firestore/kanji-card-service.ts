// Kanji Card Firestore service

import type { KanjiCard, KanjiCardFormData } from '../../types/kanji';
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

export function subscribeToKanjiCards(callback: (cards: KanjiCard[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.KANJI_CARDS), (snapshot) => {
    const cards = snapshot.docs.map(doc => mapDoc<KanjiCard>(doc));
    callback(cards);
  });
}

export async function addKanjiCard(data: KanjiCardFormData, createdBy?: string): Promise<KanjiCard> {
  const newCard: Omit<KanjiCard, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.KANJI_CARDS), newCard);
  return { id: docRef.id, ...newCard } as KanjiCard;
}

export async function updateKanjiCard(id: string, data: Partial<KanjiCard>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KANJI_CARDS, id);
  await updateDoc(docRef, data);
}

export async function deleteKanjiCard(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KANJI_CARDS, id);
  await deleteDoc(docRef);
}

export async function deleteKanjiCardsByLesson(lessonId: string): Promise<void> {
  const q = query(collection(db, COLLECTIONS.KANJI_CARDS), where('lessonId', '==', lessonId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

export async function importKanjiCard(data: Omit<KanjiCard, 'id'>): Promise<KanjiCard> {
  const docRef = await addDoc(collection(db, COLLECTIONS.KANJI_CARDS), data);
  return { id: docRef.id, ...data } as KanjiCard;
}
