// User Session Firestore service (Study, Game, JLPT sessions)

import type { StudySession, GameSession, JLPTSession } from '../../types/user';
import {
  COLLECTIONS,
  mapDoc,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  db,
} from './collections';

// ============ STUDY SESSIONS ============

export async function addStudySession(data: Omit<StudySession, 'id'>): Promise<StudySession> {
  const docRef = await addDoc(collection(db, COLLECTIONS.STUDY_SESSIONS), data);
  return { id: docRef.id, ...data };
}

export async function getStudySessionsByUser(userId: string): Promise<StudySession[]> {
  const q = query(collection(db, COLLECTIONS.STUDY_SESSIONS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc<StudySession>(doc));
}

// ============ GAME SESSIONS ============

export async function addGameSession(data: Omit<GameSession, 'id'>): Promise<GameSession> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GAME_SESSIONS), data);
  return { id: docRef.id, ...data };
}

export async function getGameSessionsByUser(userId: string): Promise<GameSession[]> {
  const q = query(collection(db, COLLECTIONS.GAME_SESSIONS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc<GameSession>(doc));
}

// ============ JLPT SESSIONS ============

export async function addJLPTSession(data: Omit<JLPTSession, 'id'>): Promise<JLPTSession> {
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_SESSIONS), data);
  return { id: docRef.id, ...data };
}

export async function getJLPTSessionsByUser(userId: string): Promise<JLPTSession[]> {
  const q = query(collection(db, COLLECTIONS.JLPT_SESSIONS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc<JLPTSession>(doc));
}
