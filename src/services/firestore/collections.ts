// Firestore collection constants and shared utilities

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  setDoc,
  type Unsubscribe,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Collection names
export const COLLECTIONS = {
  FLASHCARDS: 'flashcards',
  GRAMMAR_CARDS: 'grammarCards',
  GRAMMAR_LESSONS: 'grammarLessons',
  LESSONS: 'lessons',
  USERS: 'users',
  SETTINGS: 'settings',
  JLPT_QUESTIONS: 'jlptQuestions',
  JLPT_FOLDERS: 'jlptFolders',
  KAIWA_QUESTIONS: 'kaiwaQuestions',
  KAIWA_FOLDERS: 'kaiwaFolders',
  STUDY_SESSIONS: 'studySessions',
  GAME_SESSIONS: 'gameSessions',
  JLPT_SESSIONS: 'jlptSessions',
  CUSTOM_TOPICS: 'customTopics',
  CUSTOM_TOPIC_FOLDERS: 'customTopicFolders',
  CUSTOM_TOPIC_QUESTIONS: 'customTopicQuestions',
} as const;

// Shared utilities
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function mapDoc<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
  return { id: doc.id, ...doc.data() } as T;
}

// Re-export Firebase utilities for use in service modules
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  setDoc,
  db,
  type Unsubscribe,
};
