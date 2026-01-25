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
import type { Flashcard, FlashcardFormData, Lesson, JLPTLevel, GrammarCard, GrammarCardFormData } from '../types/flashcard';
import type { User, StudySession, GameSession, JLPTSession } from '../types/user';
import type { JLPTQuestion, JLPTQuestionFormData, JLPTFolder } from '../types/jlpt-question';
import type { KaiwaDefaultQuestion, KaiwaQuestionFormData, KaiwaFolder } from '../types/kaiwa-question';
import type { CustomTopic, CustomTopicFolder, CustomTopicQuestion, CustomTopicFormData, CustomTopicQuestionFormData } from '../types/custom-topic';
import { getDefaultSM2Values } from '../lib/spaced-repetition';

// Collection names
const COLLECTIONS = {
  FLASHCARDS: 'flashcards',
  GRAMMAR_CARDS: 'grammarCards',
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
  // Custom Topics
  CUSTOM_TOPICS: 'customTopics',
  CUSTOM_TOPIC_FOLDERS: 'customTopicFolders',
  CUSTOM_TOPIC_QUESTIONS: 'customTopicQuestions',
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
  const defaultValues = getDefaultSM2Values();
  const newCard: Omit<Flashcard, 'id'> = {
    ...data,
    ...defaultValues,
    // Override with form data difficultyLevel if provided
    difficultyLevel: data.difficultyLevel || defaultValues.difficultyLevel,
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

// ============ GRAMMAR CARDS ============

export function subscribeToGrammarCards(callback: (cards: GrammarCard[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.GRAMMAR_CARDS), (snapshot) => {
    const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GrammarCard));
    callback(cards);
  });
}

export async function addGrammarCard(data: GrammarCardFormData, createdBy?: string): Promise<GrammarCard> {
  const newCard: Omit<GrammarCard, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.GRAMMAR_CARDS), newCard);
  return { id: docRef.id, ...newCard } as GrammarCard;
}

export async function updateGrammarCard(id: string, data: Partial<GrammarCard>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GRAMMAR_CARDS, id);
  await updateDoc(docRef, data);
}

export async function deleteGrammarCard(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.GRAMMAR_CARDS, id);
  await deleteDoc(docRef);
}

export async function deleteGrammarCardsByLesson(lessonId: string): Promise<void> {
  const q = query(collection(db, COLLECTIONS.GRAMMAR_CARDS), where('lessonId', '==', lessonId));
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
  // Delete all flashcards and grammar cards in this lesson first
  await deleteFlashcardsByLesson(id);
  await deleteGrammarCardsByLesson(id);
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

// ============ KAIWA DEFAULT QUESTIONS ============

export function subscribeToKaiwaQuestions(callback: (questions: KaiwaDefaultQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.KAIWA_QUESTIONS), (snapshot) => {
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KaiwaDefaultQuestion));
    callback(questions);
  });
}

export async function addKaiwaQuestion(data: KaiwaQuestionFormData, createdBy?: string): Promise<KaiwaDefaultQuestion> {
  const newQuestion: Omit<KaiwaDefaultQuestion, 'id'> = {
    ...data,
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.KAIWA_QUESTIONS), newQuestion);
  return { id: docRef.id, ...newQuestion } as KaiwaDefaultQuestion;
}

export async function updateKaiwaQuestion(id: string, data: Partial<KaiwaDefaultQuestion>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_QUESTIONS, id);
  await updateDoc(docRef, data);
}

export async function deleteKaiwaQuestion(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_QUESTIONS, id);
  await deleteDoc(docRef);
}

// ============ KAIWA FOLDERS ============

export function subscribeToKaiwaFolders(callback: (folders: KaiwaFolder[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.KAIWA_FOLDERS), (snapshot) => {
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KaiwaFolder));
    callback(folders);
  });
}

export async function addKaiwaFolder(
  name: string,
  level: KaiwaFolder['level'],
  topic: KaiwaFolder['topic'],
  createdBy?: string
): Promise<KaiwaFolder> {
  const newFolder: Omit<KaiwaFolder, 'id'> = {
    name,
    level,
    topic,
    order: Date.now(),
    createdAt: getTodayISO(),
    createdBy,
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.KAIWA_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateKaiwaFolder(id: string, data: Partial<KaiwaFolder>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_FOLDERS, id);
  await updateDoc(docRef, data);
}

export async function deleteKaiwaFolder(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.KAIWA_FOLDERS, id);
  await deleteDoc(docRef);
}

// ============ CUSTOM TOPICS ============

export function subscribeToCustomTopics(callback: (topics: CustomTopic[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOM_TOPICS), (snapshot) => {
    const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomTopic));
    callback(topics);
  });
}

export async function addCustomTopic(data: CustomTopicFormData, createdBy: string): Promise<CustomTopic> {
  const newTopic: Omit<CustomTopic, 'id'> = {
    ...data,
    linkedLessonIds: data.linkedLessonIds || [],
    questionCount: 0,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOM_TOPICS), newTopic);
  return { id: docRef.id, ...newTopic };
}

export async function updateCustomTopic(id: string, data: Partial<CustomTopicFormData>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPICS, id);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteCustomTopic(id: string): Promise<void> {
  // Delete all questions in this topic
  const questionsQuery = query(collection(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS), where('topicId', '==', id));
  const questionsSnapshot = await getDocs(questionsQuery);
  await Promise.all(questionsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

  // Delete all folders in this topic
  const foldersQuery = query(collection(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS), where('topicId', '==', id));
  const foldersSnapshot = await getDocs(foldersQuery);
  await Promise.all(foldersSnapshot.docs.map(doc => deleteDoc(doc.ref)));

  // Delete the topic itself
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPICS, id);
  await deleteDoc(docRef);
}

// ============ CUSTOM TOPIC FOLDERS ============

export function subscribeToCustomTopicFolders(callback: (folders: CustomTopicFolder[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS), (snapshot) => {
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomTopicFolder));
    callback(folders);
  });
}

export async function addCustomTopicFolder(topicId: string, name: string, createdBy: string, level: JLPTLevel = 'N5'): Promise<CustomTopicFolder> {
  const newFolder: Omit<CustomTopicFolder, 'id'> = {
    topicId,
    name,
    level,
    linkedLessonIds: [],
    order: Date.now(),
    createdBy,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateCustomTopicFolder(id: string, name: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS, id);
  await updateDoc(docRef, { name });
}

export async function deleteCustomTopicFolder(id: string): Promise<void> {
  // Delete all questions in this folder (set folderId to null)
  const questionsQuery = query(collection(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS), where('folderId', '==', id));
  const questionsSnapshot = await getDocs(questionsQuery);
  await Promise.all(questionsSnapshot.docs.map(doc => updateDoc(doc.ref, { folderId: null })));

  // Delete the folder
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS, id);
  await deleteDoc(docRef);
}

// ============ CUSTOM TOPIC QUESTIONS ============

export function subscribeToCustomTopicQuestions(callback: (questions: CustomTopicQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS), (snapshot) => {
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomTopicQuestion));
    callback(questions);
  });
}

export async function addCustomTopicQuestion(data: CustomTopicQuestionFormData, createdBy: string): Promise<CustomTopicQuestion> {
  // Clean undefined values - Firebase doesn't accept undefined
  const cleanData: Record<string, unknown> = {
    topicId: data.topicId,
    questionJa: data.questionJa,
    createdBy,
    createdAt: new Date().toISOString(),
  };
  // Only add optional fields if they have values
  if (data.folderId) cleanData.folderId = data.folderId;
  if (data.questionVi) cleanData.questionVi = data.questionVi;
  if (data.situationContext) cleanData.situationContext = data.situationContext;
  if (data.suggestedAnswers && data.suggestedAnswers.length > 0) cleanData.suggestedAnswers = data.suggestedAnswers;
  if (data.difficulty) cleanData.difficulty = data.difficulty;
  if (data.tags && data.tags.length > 0) cleanData.tags = data.tags;

  const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS), cleanData);

  // Update topic question count
  const topicRef = doc(db, COLLECTIONS.CUSTOM_TOPICS, data.topicId);
  const topicSnap = await getDoc(topicRef);
  if (topicSnap.exists()) {
    const currentCount = topicSnap.data().questionCount || 0;
    await updateDoc(topicRef, { questionCount: currentCount + 1, updatedAt: new Date().toISOString() });
  }

  return { id: docRef.id, ...cleanData } as CustomTopicQuestion;
}

export async function updateCustomTopicQuestion(id: string, data: Partial<CustomTopicQuestionFormData>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS, id);
  // Clean undefined values - Firebase doesn't accept undefined
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  });
  await updateDoc(docRef, cleanData);
}

export async function deleteCustomTopicQuestion(id: string): Promise<void> {
  // Get question to find topicId
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS, id);
  const questionSnap = await getDoc(docRef);

  if (questionSnap.exists()) {
    const topicId = questionSnap.data().topicId;

    // Update topic question count
    const topicRef = doc(db, COLLECTIONS.CUSTOM_TOPICS, topicId);
    const topicSnap = await getDoc(topicRef);
    if (topicSnap.exists()) {
      const currentCount = topicSnap.data().questionCount || 0;
      await updateDoc(topicRef, { questionCount: Math.max(0, currentCount - 1), updatedAt: new Date().toISOString() });
    }
  }

  await deleteDoc(docRef);
}

// ============ IMPORT FUNCTIONS (for data import feature) ============

// Import a lesson directly (used by import feature)
export async function importLesson(data: Omit<Lesson, 'id'>): Promise<Lesson> {
  const docRef = await addDoc(collection(db, COLLECTIONS.LESSONS), data);
  return { id: docRef.id, ...data };
}

// Import a flashcard directly (used by import feature)
export async function importFlashcard(data: Omit<Flashcard, 'id'>): Promise<Flashcard> {
  const docRef = await addDoc(collection(db, COLLECTIONS.FLASHCARDS), data);
  return { id: docRef.id, ...data } as Flashcard;
}

// Import a grammar card directly (used by import feature)
export async function importGrammarCard(data: Omit<GrammarCard, 'id'>): Promise<GrammarCard> {
  const docRef = await addDoc(collection(db, COLLECTIONS.GRAMMAR_CARDS), data);
  return { id: docRef.id, ...data } as GrammarCard;
}

// Import a JLPT folder directly (used by import feature)
export async function importJLPTFolder(data: Omit<JLPTFolder, 'id'>): Promise<JLPTFolder> {
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_FOLDERS), data);
  return { id: docRef.id, ...data };
}

// Import a JLPT question directly (used by import feature)
export async function importJLPTQuestion(data: Omit<JLPTQuestion, 'id'>): Promise<JLPTQuestion> {
  const docRef = await addDoc(collection(db, COLLECTIONS.JLPT_QUESTIONS), data);
  return { id: docRef.id, ...data } as JLPTQuestion;
}
