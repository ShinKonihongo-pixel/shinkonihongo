// Firestore service for Kanji character analysis (per-character, reusable)

import type { KanjiCharacterAnalysis } from '../../types/flashcard';
import { documentId } from 'firebase/firestore';
import {
  COLLECTIONS,
  doc,
  getDoc,
  getDocs,
  setDoc,
  db,
  collection,
  query,
  where,
} from './collections';

export async function getKanjiAnalysis(character: string): Promise<KanjiCharacterAnalysis | null> {
  const docRef = doc(db, COLLECTIONS.KANJI_ANALYSIS, character);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as KanjiCharacterAnalysis;
}

export async function getMultipleKanjiAnalysis(characters: string[]): Promise<KanjiCharacterAnalysis[]> {
  if (characters.length === 0) return [];

  const results: KanjiCharacterAnalysis[] = [];
  // Firestore 'in' queries support max 30 items per batch
  const batchSize = 30;

  for (let i = 0; i < characters.length; i += batchSize) {
    const batch = characters.slice(i, i + batchSize);
    const q = query(
      collection(db, COLLECTIONS.KANJI_ANALYSIS),
      where(documentId(), 'in', batch)
    );
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() } as KanjiCharacterAnalysis);
    });
  }

  return results;
}

export async function saveKanjiAnalysis(data: KanjiCharacterAnalysis): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KANJI_ANALYSIS, data.character);
  const { id: _id, ...docData } = data;
  await setDoc(docRef, docData);
}

export async function saveMultipleKanjiAnalysis(analyses: KanjiCharacterAnalysis[]): Promise<void> {
  await Promise.all(analyses.map(saveKanjiAnalysis));
}
