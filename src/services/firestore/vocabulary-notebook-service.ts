// Firestore service for user vocabulary notebooks (personal word lists)

import type { VocabularyNotebook } from '../../types/flashcard';
import {
  COLLECTIONS,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export function subscribeToVocabularyNotebooks(
  userId: string,
  callback: (notebooks: VocabularyNotebook[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.VOCABULARY_NOTEBOOKS),
    where('userId', '==', userId),
  );
  return onSnapshot(q, (snapshot) => {
    const notebooks = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as VocabularyNotebook,
    );
    notebooks.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    callback(notebooks);
  });
}

export async function addVocabularyNotebook(
  userId: string,
  name: string,
  color: string,
  description?: string,
): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTIONS.VOCABULARY_NOTEBOOKS), {
    userId,
    name,
    color,
    description: description || '',
    flashcardIds: [],
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateVocabularyNotebook(
  id: string,
  data: Partial<Pick<VocabularyNotebook, 'name' | 'description' | 'color'>>,
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTEBOOKS, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteVocabularyNotebook(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTEBOOKS, id);
  await deleteDoc(docRef);
}

export async function addFlashcardToNotebook(
  notebookId: string,
  flashcardId: string,
  currentIds: string[],
): Promise<void> {
  if (currentIds.includes(flashcardId)) return;
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTEBOOKS, notebookId);
  await updateDoc(docRef, {
    flashcardIds: [...currentIds, flashcardId],
    updatedAt: new Date().toISOString(),
  });
}

export async function removeFlashcardFromNotebook(
  notebookId: string,
  flashcardId: string,
  currentIds: string[],
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTEBOOKS, notebookId);
  await updateDoc(docRef, {
    flashcardIds: currentIds.filter((id) => id !== flashcardId),
    updatedAt: new Date().toISOString(),
  });
}
