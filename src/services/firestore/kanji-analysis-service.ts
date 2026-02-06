// Firestore service for Kanji character analysis (per-character, reusable)

import type { KanjiCharacterAnalysis } from '../../types/flashcard';
import {
  COLLECTIONS,
  doc,
  getDoc,
  setDoc,
  db,
} from './collections';

export async function getKanjiAnalysis(character: string): Promise<KanjiCharacterAnalysis | null> {
  const docRef = doc(db, COLLECTIONS.KANJI_ANALYSIS, character);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as KanjiCharacterAnalysis;
}

export async function getMultipleKanjiAnalysis(characters: string[]): Promise<KanjiCharacterAnalysis[]> {
  const results: KanjiCharacterAnalysis[] = [];
  // Firestore doesn't support batch get by arbitrary IDs in web SDK, so we fetch in parallel
  const promises = characters.map(async (char) => {
    const analysis = await getKanjiAnalysis(char);
    if (analysis) results.push(analysis);
  });
  await Promise.all(promises);
  return results;
}

export async function saveKanjiAnalysis(data: KanjiCharacterAnalysis): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KANJI_ANALYSIS, data.character);
  const { id, ...docData } = data;
  await setDoc(docRef, docData);
}

export async function saveMultipleKanjiAnalysis(analyses: KanjiCharacterAnalysis[]): Promise<void> {
  await Promise.all(analyses.map(saveKanjiAnalysis));
}
