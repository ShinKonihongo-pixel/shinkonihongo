// Custom Topic Firestore service

import type { JLPTLevel } from '../../types/flashcard';
import type {
  CustomTopic,
  CustomTopicFolder,
  CustomTopicQuestion,
  CustomTopicFormData,
  CustomTopicQuestionFormData,
} from '../../types/custom-topic';
import {
  COLLECTIONS,
  mapDoc,
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
  db,
  type Unsubscribe,
} from './collections';

// ============ CUSTOM TOPICS ============

export function subscribeToCustomTopics(callback: (topics: CustomTopic[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOM_TOPICS), (snapshot) => {
    const topics = snapshot.docs.map(doc => mapDoc<CustomTopic>(doc));
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
  await Promise.all(questionsSnapshot.docs.map(d => deleteDoc(d.ref)));

  // Delete all folders in this topic
  const foldersQuery = query(collection(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS), where('topicId', '==', id));
  const foldersSnapshot = await getDocs(foldersQuery);
  await Promise.all(foldersSnapshot.docs.map(d => deleteDoc(d.ref)));

  // Delete the topic itself
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPICS, id);
  await deleteDoc(docRef);
}

// ============ CUSTOM TOPIC FOLDERS ============

export function subscribeToCustomTopicFolders(callback: (folders: CustomTopicFolder[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS), (snapshot) => {
    const folders = snapshot.docs.map(doc => mapDoc<CustomTopicFolder>(doc));
    callback(folders);
  });
}

export async function addCustomTopicFolder(
  topicId: string,
  name: string,
  createdBy: string,
  level: JLPTLevel = 'N5'
): Promise<CustomTopicFolder> {
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
  // Unlink questions from this folder (set folderId to null)
  const questionsQuery = query(collection(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS), where('folderId', '==', id));
  const questionsSnapshot = await getDocs(questionsQuery);
  await Promise.all(questionsSnapshot.docs.map(d => updateDoc(d.ref, { folderId: null })));

  // Delete the folder
  const docRef = doc(db, COLLECTIONS.CUSTOM_TOPIC_FOLDERS, id);
  await deleteDoc(docRef);
}

// ============ CUSTOM TOPIC QUESTIONS ============

export function subscribeToCustomTopicQuestions(callback: (questions: CustomTopicQuestion[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.CUSTOM_TOPIC_QUESTIONS), (snapshot) => {
    const questions = snapshot.docs.map(doc => mapDoc<CustomTopicQuestion>(doc));
    callback(questions);
  });
}

export async function addCustomTopicQuestion(
  data: CustomTopicQuestionFormData,
  createdBy: string
): Promise<CustomTopicQuestion> {
  // Clean undefined values - Firebase doesn't accept undefined
  const cleanData: Record<string, unknown> = {
    topicId: data.topicId,
    questionJa: data.questionJa,
    createdBy,
    createdAt: new Date().toISOString(),
  };
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
  // Clean undefined values
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  });
  await updateDoc(docRef, cleanData);
}

export async function deleteCustomTopicQuestion(id: string): Promise<void> {
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
