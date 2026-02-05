// Kaiwa Question Firestore service

import type { KaiwaDefaultQuestion, KaiwaQuestionFormData } from '../../types/kaiwa-question';
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

export function subscribeToKaiwaQuestions(callback: (questions: KaiwaDefaultQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.KAIWA_QUESTIONS), (snapshot) => {
    const questions = snapshot.docs.map(doc => mapDoc<KaiwaDefaultQuestion>(doc));
    callback(questions);
  });
}

export async function addKaiwaQuestion(data: KaiwaQuestionFormData, createdBy?: string): Promise<KaiwaDefaultQuestion> {
  const newQuestion: Omit<KaiwaDefaultQuestion, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.KAIWA_QUESTIONS), newQuestion);
  return { id: docRef.id, ...newQuestion } as KaiwaDefaultQuestion;
}

export async function updateKaiwaQuestion(id: string, data: Partial<KaiwaDefaultQuestion>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_QUESTIONS, id);
  await updateDoc(docRef, data);
}

export async function deleteKaiwaQuestion(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_QUESTIONS, id);
  await deleteDoc(docRef);
}
