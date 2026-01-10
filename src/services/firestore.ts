// Firestore service for CRUD operations

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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Flashcard, FlashcardFormData, Lesson } from '../types/flashcard';
import type { User, StudySession, GameSession, JLPTSession } from '../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTFolder } from '../types/jlpt-question';
import { getDefaultSM2Values } from '../lib/spaced-repetition';

// Collection names
const COLLECTIONS = {
  FLASHCARDS: 'flashcards',
  LESSONS: 'lessons',
  USERS: 'users',
  SETTINGS: 'settings',
  JLPT_QUESTIONS: 'jlptQuestions',
  JLPT_FOLDERS: 'jlptFolders',
  STUDY_SESSIONS: 'studySessions',
  GAME_SESSIONS: 'gameSessions',
  JLPT_SESSIONS: 'jlptSessions',
} as const;

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ============ FLASHCARDS ============

export async function getAllFlashcards(): Promise<Flashcard[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.FLASHCARDS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
}

export function subscribeToFlashcards(callback: (cards: Flashcard[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.FLASHCARDS), (snapshot) => {
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    callback(cards);
  });
}

export async function addFlashcard(data: FlashcardFormData, createdBy?: string): Promise<Flashcard> {
  const newCard: Omit<Flashcard, 'id'> = {
    ...data,
    ...getDefaultSM2Values(),
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.FLASHCARDS), newCard);
  return { id: docRef.id, ...newCard } as Flashcard;
}

export async function updateFlashcard(id: string, data: Partial<Flashcard>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FLASHCARDS, id);
  await updateDoc(docRef, data);
}

export async function deleteFlashcard(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.FLASHCARDS, id);
  await deleteDoc(docRef);
}

// Delete all flashcards
export async function deleteAllFlashcards(): Promise<number> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.FLASHCARDS));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  return snapshot.docs.length;
}

// Delete flashcards by JLPT level
export async function deleteFlashcardsByLevel(level: string): Promise<number> {
  const q = query(collection(db, COLLECTIONS.FLASHCARDS), where('jlptLevel', '==', level));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  return snapshot.docs.length;
}

// Delete all flashcards in a lesson
export async function deleteFlashcardsByLesson(lessonId: string): Promise<void> {
  const q = query(collection(db, COLLECTIONS.FLASHCARDS), where('lessonId', '==', lessonId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

// ============ LESSONS ============

export async function getAllLessons(): Promise<Lesson[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.LESSONS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
}

export function subscribeToLessons(callback: (lessons: Lesson[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.LESSONS), (snapshot) => {
    const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    callback(lessons);
  });
}

export async function addLesson(data: Omit<Lesson, 'id'>): Promise<Lesson> {
  const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), data);
  return { id: docRef.id, ...data };
}

export async function updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.LESSONS, id);
  await updateDoc(docRef, data);
}

export async function deleteLesson(id: string): Promise<void> {
  // Delete all flashcards in this lesson first
  await deleteFlashcardsByLesson(id);
  // Then delete the lesson
  const docRef = doc(db, COLLECTIONS.LESSONS, id);
  await deleteDoc(docRef);
}

// ============ USERS ============

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    callback(users);
  });
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const q = query(collection(db, COLLECTIONS.USERS), where('username', '==', username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as User;
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), data);
  return { id: docRef.id, ...data };
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, id);
  await updateDoc(docRef, data);
}

export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, id);
  await deleteDoc(docRef);
}

// ============ SETTINGS ============

export async function getUserSettings(userId: string): Promise<Record<string, unknown> | null> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Record<string, unknown>;
}

export async function saveUserSettings(userId: string, settings: Record<string, unknown>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
  await setDoc(docRef, settings, { merge: true });
}

// ============ JLPT QUESTIONS ============

export async function getAllJLPTQuestions(): Promise<JLPTQuestion[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.JLPT_QUESTIONS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JLPTQuestion));
}

export function subscribeToJLPTQuestions(callback: (questions: JLPTQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.JLPT_QUESTIONS), (snapshot) => {
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JLPTQuestion));
    callback(questions);
  });
}

export async function addJLPTQuestion(data: JLPTQuestionFormData, createdBy?: string): Promise<JLPTQuestion> {
  const newQuestion: Omit<JLPTQuestion, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_QUESTIONS), newQuestion);
  return { id: docRef.id, ...newQuestion } as JLPTQuestion;
}

export async function updateJLPTQuestion(id: string, data: Partial<JLPTQuestion>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_QUESTIONS, id);
  await updateDoc(docRef, data);
}

export async function deleteJLPTQuestion(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_QUESTIONS, id);
  await deleteDoc(docRef);
}

// ============ JLPT FOLDERS ============

export function subscribeToJLPTFolders(callback: (folders: JLPTFolder[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.JLPT_FOLDERS), (snapshot) => {
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JLPTFolder));
    callback(folders);
  });
}

export async function addJLPTFolder(
  name: string,
  level: JLPTFolder['level'],
  category: JLPTFolder['category'],
  createdBy?: string
): Promise<JLPTFolder> {
  const newFolder: Omit<JLPTFolder, 'id'> = {
    name,
    level,
    category,
    order: Date.now(),
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateJLPTFolder(id: string, data: Partial<JLPTFolder>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_FOLDERS, id);
  await updateDoc(docRef, data);
}

export async function deleteJLPTFolder(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.JLPT_FOLDERS, id);
  await deleteDoc(docRef);
}

// ============ USER HISTORY ============

// Study Sessions
export async function addStudySession(data: Omit<StudySession, 'id'>): Promise<StudySession> {
  const docRef = await addDoc(collection(db, COLLECTIONS.STUDY_SESSIONS), data);
  return { id: docRef.id, ...data };
}

export async function getStudySessionsByUser(userId: string): Promise<StudySession[]> {
  const q = query(collection(db, COLLECTIONS.STUDY_SESSIONS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
}

// Game Sessions
export async function addGameSession(data: Omit<GameSession, 'id'>): Promise<GameSession> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GAME_SESSIONS), data);
  return { id: docRef.id, ...data };
}

export async function getGameSessionsByUser(userId: string): Promise<GameSession[]> {
  const q = query(collection(db, COLLECTIONS.GAME_SESSIONS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
}

// JLPT Sessions
export async function addJLPTSession(data: Omit<JLPTSession, 'id'>): Promise<JLPTSession> {
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_SESSIONS), data);
  return { id: docRef.id, ...data };
}

export async function getJLPTSessionsByUser(userId: string): Promise<JLPTSession[]> {
  const q = query(collection(db, COLLECTIONS.JLPT_SESSIONS), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JLPTSession));
}
