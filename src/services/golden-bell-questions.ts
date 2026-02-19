import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CustomGoldenBellQuestion } from '../types/golden-bell';

const COLLECTION = 'golden_bell_questions';

/** Strip undefined values before writing to Firestore */
function cleanData(data: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

/** Create a custom question. Returns document ID. */
export async function createCustomQuestion(question: Omit<CustomGoldenBellQuestion, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION), cleanData(question as unknown as Record<string, unknown>));
  return docRef.id;
}

/** Update a custom question. */
export async function updateCustomQuestion(id: string, data: Partial<CustomGoldenBellQuestion>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), cleanData(data as unknown as Record<string, unknown>));
}

/** Delete a custom question. */
export async function deleteCustomQuestion(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/** Subscribe to all custom questions (real-time). */
export function subscribeToCustomQuestions(callback: (questions: CustomGoldenBellQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTION), (snapshot) => {
    const questions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomGoldenBellQuestion));
    questions.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(questions);
  });
}
