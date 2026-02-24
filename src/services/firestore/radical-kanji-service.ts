// Firestore service for custom radical-kanji mappings
// Document ID = radical character, data = { entries: RadicalKanjiEntry[] }

import type { RadicalKanjiEntry } from '../../utils/radical-kanji-index';
import {
  COLLECTIONS,
  doc,
  getDoc,
  setDoc,
  db,
} from './collections';
import { getDocs, collection } from 'firebase/firestore';

interface RadicalKanjiDoc {
  entries: RadicalKanjiEntry[];
}

/** Load all custom radical-kanji entries from Firestore */
export async function loadAllRadicalKanjiCustom(): Promise<Map<string, RadicalKanjiEntry[]>> {
  const map = new Map<string, RadicalKanjiEntry[]>();
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.RADICAL_KANJI_CUSTOM));
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as RadicalKanjiDoc;
      if (data.entries?.length > 0) {
        map.set(docSnap.id, data.entries);
      }
    }
  } catch (err) {
    console.error('loadAllRadicalKanjiCustom error:', err);
  }
  return map;
}

/** Save all custom entries for a specific radical to Firestore */
export async function saveRadicalKanjiCustom(radical: string, entries: RadicalKanjiEntry[]): Promise<void> {
  const docRef = doc(db, COLLECTIONS.RADICAL_KANJI_CUSTOM, radical);
  await setDoc(docRef, { entries });
}

/** Load custom entries for a single radical */
export async function getRadicalKanjiCustom(radical: string): Promise<RadicalKanjiEntry[]> {
  const docRef = doc(db, COLLECTIONS.RADICAL_KANJI_CUSTOM, radical);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return [];
  const data = snapshot.data() as RadicalKanjiDoc;
  return data.entries || [];
}
