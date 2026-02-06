// Firestore service for user vocabulary notes (personal notes per flashcard)

import type { VocabularyNote } from '../../types/flashcard';
import {
  COLLECTIONS,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  db,
} from './collections';

function getNoteId(userId: string, flashcardId: string): string {
  return `${userId}_${flashcardId}`;
}

export async function getVocabularyNote(userId: string, flashcardId: string): Promise<VocabularyNote | null> {
  const noteId = getNoteId(userId, flashcardId);
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTES, noteId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as VocabularyNote;
}

export async function saveVocabularyNote(userId: string, flashcardId: string, content: string): Promise<void> {
  const noteId = getNoteId(userId, flashcardId);
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTES, noteId);
  await setDoc(docRef, {
    userId,
    flashcardId,
    content,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteVocabularyNote(userId: string, flashcardId: string): Promise<void> {
  const noteId = getNoteId(userId, flashcardId);
  const docRef = doc(db, COLLECTIONS.VOCABULARY_NOTES, noteId);
  await deleteDoc(docRef);
}
