// Room management for Quiz Game

import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { QuizGame } from '../../types/quiz-game';
import { COLLECTIONS } from './constants';

// Get all available rooms (waiting status) for joining
export async function getAvailableRooms(): Promise<QuizGame[]> {
  const q = query(
    collection(db, COLLECTIONS.GAMES),
    where('status', '==', 'waiting')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as QuizGame));
}

// Subscribe to available rooms (real-time updates)
export function subscribeToAvailableRooms(callback: (games: QuizGame[]) => void): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.GAMES),
    where('status', '==', 'waiting')
  );
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as QuizGame));
    callback(games);
  });
}
