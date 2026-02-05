// Grammar Card Firestore service

import type { GrammarCard, GrammarCardFormData } from '../../types/flashcard';
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

export function subscribeToGrammarCards(callback: (cards: GrammarCard[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.GRAMMAR_CARDS), (snapshot) => {
    const cards = snapshot.docs.map(doc => mapDoc<GrammarCard>(doc));
    callback(cards);
  });
}

export async function addGrammarCard(data: GrammarCardFormData, createdBy?: string): Promise<GrammarCard> {
  const newCard: Omit<GrammarCard, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.GRAMMAR_CARDS), newCard);
  return { id: docRef.id, ...newCard } as GrammarCard;
}

export async function updateGrammarCard(id: string, data: Partial<GrammarCard>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GRAMMAR_CARDS, id);
  await updateDoc(docRef, data);
}

export async function deleteGrammarCard(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GRAMMAR_CARDS, id);
  await deleteDoc(docRef);
}

export async function deleteGrammarCardsByLesson(lessonId: string): Promise<void> {
  const q = query(collection(db, COLLECTIONS.GRAMMAR_CARDS), where('lessonId', '==', lessonId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// Import function for data import feature
export async function importGrammarCard(data: Omit<GrammarCard, 'id'>): Promise<GrammarCard> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GRAMMAR_CARDS), data);
  return { id: docRef.id, ...data } as GrammarCard;
}
