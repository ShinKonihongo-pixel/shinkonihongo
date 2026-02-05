// Test template bank operations

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { TestTemplate, ClassroomTest } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';
import { sendBulkNotifications } from './notification-service';

export interface TestTemplateFormData {
  title: string;
  description?: string;
  type: 'test' | 'assignment';
  folderId?: string;
  questions: ClassroomTest['questions'];
  timeLimit?: number;
  tags?: string[];
  level?: string;
  sourceType?: 'custom' | 'flashcard' | 'jlpt';
}

export async function createTestTemplate(
  data: TestTemplateFormData,
  createdBy: string
): Promise<TestTemplate> {
  const now = getNowISO();
  const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);

  const newTemplate: Omit<TestTemplate, 'id'> = {
    title: data.title,
    description: data.description || '',
    type: data.type,
    folderId: data.folderId,
    questions: data.questions,
    timeLimit: data.timeLimit,
    totalPoints,
    createdBy,
    createdAt: now,
    updatedAt: now,
    tags: data.tags || [],
    level: data.level || '',
    isActive: true,
    sourceType: data.sourceType || 'custom',
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TEST_TEMPLATES), newTemplate);
  return { id: docRef.id, ...newTemplate };
}

export async function updateTestTemplate(
  templateId: string,
  data: Partial<TestTemplateFormData>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEST_TEMPLATES, templateId);
  const updates: Record<string, unknown> = {
    ...data,
    updatedAt: getNowISO(),
  };

  if (data.questions) {
    updates.totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);
  }

  await updateDoc(docRef, updates);
}

export async function deleteTestTemplate(templateId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEST_TEMPLATES, templateId);
  await deleteDoc(docRef);
}

export async function getTestTemplate(templateId: string): Promise<TestTemplate | null> {
  const docRef = doc(db, COLLECTIONS.TEST_TEMPLATES, templateId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as TestTemplate;
}

export async function getAllTestTemplates(): Promise<TestTemplate[]> {
  const q = query(collection(db, COLLECTIONS.TEST_TEMPLATES));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as TestTemplate))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function subscribeToTestTemplates(
  callback: (templates: TestTemplate[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.TEST_TEMPLATES));
  return onSnapshot(q, (snapshot) => {
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestTemplate));
    templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(templates);
  });
}

// Assign test template to classroom (creates a copy)
export async function assignTestToClassroom(
  templateId: string,
  classroomId: string,
  createdBy: string,
  options?: {
    deadline?: string;
    isPublished?: boolean;
  }
): Promise<ClassroomTest> {
  const template = await getTestTemplate(templateId);
  if (!template) throw new Error('Test template not found');

  const now = getNowISO();
  const newTest: Omit<ClassroomTest, 'id'> = {
    classroomId,
    title: template.title,
    description: template.description,
    type: template.type,
    questions: template.questions,
    timeLimit: template.timeLimit,
    deadline: options?.deadline,
    totalPoints: template.totalPoints,
    createdBy,
    createdAt: now,
    isPublished: options?.isPublished || false,
    sourceTemplateId: templateId,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TESTS), newTest);

  // Notify classroom members if published
  if (options?.isPublished) {
    await sendBulkNotifications(
      classroomId,
      template.type === 'test' ? 'test_assigned' : 'assignment_assigned',
      template.type === 'test' ? 'Bài kiểm tra mới' : 'Bài tập mới',
      `${template.title} đã được giao`,
      docRef.id
    );
  }

  return { id: docRef.id, ...newTest };
}
