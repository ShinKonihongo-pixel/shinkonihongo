// Room management for Quiz Game

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
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

// Get all rooms (any status) — for admin management
export async function getAllRooms(): Promise<QuizGame[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as QuizGame));
}

// Delete all game rooms — admin only
export async function deleteAllRooms(): Promise<number> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, COLLECTIONS.GAMES, docSnap.id));
    count++;
  }
  return count;
}

// Delete a specific room by ID — admin only
export async function deleteRoom(gameId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.GAMES, gameId));
}

// Subscribe to available rooms (real-time updates)
export function subscribeToAvailableRooms(
  callback: (games: QuizGame[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.GAMES),
    where('status', '==', 'waiting')
  );
  return onSnapshot(q, (snapshot) => {
    const games = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as QuizGame));
    callback(games);
  }, (error) => {
    console.error('Error subscribing to available rooms:', error);
    onError?.(error);
  });
}
