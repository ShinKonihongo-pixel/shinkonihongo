// Test/assignment CRUD operations

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
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ClassroomTest, TestFormData } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';
import { sendBulkNotifications } from './notification-service';

export async function createTest(
  data: TestFormData,
  classroomId: string,
  createdBy: string
): Promise<ClassroomTest> {
  const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);

  const newTest: Omit<ClassroomTest, 'id'> = {
    ...data,
    classroomId,
    createdBy,
    totalPoints,
    createdAt: getNowISO(),
    isPublished: false,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TESTS), newTest);
  return { id: docRef.id, ...newTest };
}

export async function getTest(testId: string): Promise<ClassroomTest | null> {
  const docRef = doc(db, COLLECTIONS.TESTS, testId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as ClassroomTest;
}

export async function updateTest(testId: string, data: Partial<ClassroomTest>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TESTS, testId);
  await updateDoc(docRef, data);
}

export async function deleteTest(testId: string): Promise<void> {
  // Delete all submissions for this test
  const subsQ = query(collection(db, COLLECTIONS.SUBMISSIONS), where('testId', '==', testId));
  const subsSnapshot = await getDocs(subsQ);
  for (const subDoc of subsSnapshot.docs) {
    await deleteDoc(subDoc.ref);
  }

  // Delete test
  const docRef = doc(db, COLLECTIONS.TESTS, testId);
  await deleteDoc(docRef);
}

export async function getTestsByClassroom(classroomId: string): Promise<ClassroomTest[]> {
  const q = query(
    collection(db, COLLECTIONS.TESTS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomTest));
}

export function subscribeToTests(
  classroomId: string,
  callback: (tests: ClassroomTest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TESTS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomTest));
    callback(tests);
  });
}

export async function publishTest(testId: string, classroomId: string): Promise<void> {
  await updateTest(testId, { isPublished: true });

  // Get test info
  const test = await getTest(testId);
  if (!test) return;

  // Send notification to all students
  await sendBulkNotifications(
    classroomId,
    test.type === 'test' ? 'test_assigned' : 'assignment_assigned',
    test.type === 'test' ? 'Bài kiểm tra mới' : 'Bài tập mới',
    test.title,
    testId
  );
}
