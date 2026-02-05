// JLPT Question Firestore service

import type { JLPTQuestion, JLPTQuestionFormData } from '../../types/jlpt-question';
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
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export async function getAllJLPTQuestions(): Promise<JLPTQuestion[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.JLPT_QUESTIONS));
  return snapshot.docs.map(doc => mapDoc<JLPTQuestion>(doc));
}

export function subscribeToJLPTQuestions(callback: (questions: JLPTQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.JLPT_QUESTIONS), (snapshot) => {
    const questions = snapshot.docs.map(doc => mapDoc<JLPTQuestion>(doc));
    callback(questions);
  });
}

export async function addJLPTQuestion(data: JLPTQuestionFormData, createdBy?: string): Promise<JLPTQuestion> {
  const newQuestion: Omit<JLPTQuestion, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_QUESTIONS), newQuestion);
  return { id: docRef.id, ...newQuestion } as JLPTQuestion;
}

export async function updateJLPTQuestion(id: string, data: Partial<JLPTQuestion>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_QUESTIONS, id);
  await updateDoc(docRef, data);
}

export async function deleteJLPTQuestion(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_QUESTIONS, id);
  await deleteDoc(docRef);
}

// Import function for data import feature
export async function importJLPTQuestion(data: Omit<JLPTQuestion, 'id'>): Promise<JLPTQuestion> {
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_QUESTIONS), data);
  return { id: docRef.id, ...data } as JLPTQuestion;
}
