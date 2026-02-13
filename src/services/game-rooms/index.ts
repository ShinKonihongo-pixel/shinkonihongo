// Unified Game Rooms Firestore Service
// Single collection `game_rooms` stores all non-quiz game types
// Quiz games remain in `quiz_games` collection (existing)
// Room browser queries both collections

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { GameType, WaitingRoomGame } from '../../types/game-hub';

const GAME_ROOMS = 'game_rooms';
const QUIZ_GAMES = 'quiz_games';

/** Strip undefined values before writing to Firestore */
function cleanData(data: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

/** Create a new game room. Returns Firestore document ID. */
export async function createGameRoom(
  gameType: GameType,
  gameData: Record<string, unknown>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, GAME_ROOMS),
    cleanData({ gameType, ...gameData })
  );
  return docRef.id;
}

/** Update a game room (partial update). */
export async function updateGameRoom(
  roomId: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(db, GAME_ROOMS, roomId), cleanData(data));
}

/** Delete a game room. */
export async function deleteGameRoom(roomId: string): Promise<void> {
  await deleteDoc(doc(db, GAME_ROOMS, roomId));
}

/** Find a game room by its 6-digit code. Searches both collections. */
export async function findRoomByCode(
  code: string
): Promise<{ id: string; gameType: GameType; data: Record<string, unknown> } | null> {
  const upperCode = code.toUpperCase();

  // Search game_rooms first
  const q1 = query(collection(db, GAME_ROOMS), where('code', '==', upperCode));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) {
    const d = snap1.docs[0];
    const data = d.data();
    return { id: d.id, gameType: data.gameType as GameType, data: { id: d.id, ...data } };
  }

  // Then search quiz_games
  const q2 = query(collection(db, QUIZ_GAMES), where('code', '==', upperCode));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) {
    const d = snap2.docs[0];
    return { id: d.id, gameType: 'quiz', data: { id: d.id, ...d.data() } };
  }

  return null;
}

/** Subscribe to a specific game room for real-time updates. */
export function subscribeToGameRoom<T>(
  roomId: string,
  callback: (game: (T & { id: string }) | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, GAME_ROOMS, roomId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...snapshot.data() } as T & { id: string });
  });
}

/** Extract WaitingRoomGame from a Firestore document */
function toWaitingRoomGame(
  docId: string,
  data: Record<string, unknown>,
  gameType: GameType
): WaitingRoomGame {
  const players = (data.players || {}) as Record<string, Record<string, unknown>>;
  const hostId = data.hostId as string;
  const hostPlayer = players[hostId];
  const settings = (data.settings || {}) as Record<string, unknown>;

  return {
    id: docId,
    code: (data.code as string) || '',
    gameType,
    title: (data.title as string) || '',
    hostName:
      (data.hostName as string) ||
      (hostPlayer?.displayName as string) ||
      (hostPlayer?.name as string) ||
      'Host',
    hostAvatar:
      (hostPlayer?.avatar as string) || '🎮',
    playerCount: Object.keys(players).length,
    maxPlayers: (settings.maxPlayers as number) || 20,
    createdAt: (data.createdAt as string) || new Date().toISOString(),
    status: 'waiting',
  };
}

/**
 * Subscribe to ALL waiting rooms across all game types.
 * Queries both `game_rooms` and `quiz_games` collections.
 * Returns unsubscribe function.
 */
export function subscribeToAllWaitingRooms(
  callback: (rooms: WaitingRoomGame[]) => void
): () => void {
  const allRooms: { gameRooms: WaitingRoomGame[]; quizRooms: WaitingRoomGame[] } = {
    gameRooms: [],
    quizRooms: [],
  };

  const emit = () => callback([...allRooms.gameRooms, ...allRooms.quizRooms]);

  // Subscribe to game_rooms (non-quiz games)
  const q1 = query(collection(db, GAME_ROOMS), where('status', '==', 'waiting'));
  const unsub1 = onSnapshot(q1, (snapshot) => {
    allRooms.gameRooms = snapshot.docs.map((d) => {
      const data = d.data();
      return toWaitingRoomGame(d.id, data, data.gameType as GameType);
    });
    emit();
  }, (err) => console.error('game_rooms subscription error:', err));

  // Subscribe to quiz_games
  const q2 = query(collection(db, QUIZ_GAMES), where('status', '==', 'waiting'));
  const unsub2 = onSnapshot(q2, (snapshot) => {
    allRooms.quizRooms = snapshot.docs.map((d) =>
      toWaitingRoomGame(d.id, d.data(), 'quiz')
    );
    emit();
  }, (err) => console.error('quiz_games subscription error:', err));

  return () => {
    unsub1();
    unsub2();
  };
}
