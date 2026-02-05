// Submission management operations

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ClassroomSubmission, SubmissionAnswer } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';
import { getTest } from './test-service';
import { createNotification } from './notification-service';

export async function startSubmission(
  testId: string,
  classroomId: string,
  userId: string
): Promise<ClassroomSubmission> {
  // Check if already has submission
  const existing = await getSubmissionByUserAndTest(testId, userId);
  if (existing) {
    return existing;
  }

  const test = await getTest(testId);
  if (!test) {
    throw new Error('Bài kiểm tra không tồn tại');
  }

  const newSubmission: Omit<ClassroomSubmission, 'id'> = {
    testId,
    classroomId,
    userId,
    answers: [],
    score: 0,
    totalPoints: test.totalPoints,
    startedAt: getNowISO(),
    timeSpent: 0,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), newSubmission);
  return { id: docRef.id, ...newSubmission };
}

export async function submitAnswers(
  submissionId: string,
  answers: SubmissionAnswer[],
  timeSpent: number
): Promise<void> {
  // Get submission and test
  const subRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);
  const subSnapshot = await getDoc(subRef);
  if (!subSnapshot.exists()) return;

  const submission = subSnapshot.data() as ClassroomSubmission;
  const test = await getTest(submission.testId);
  if (!test) return;

  // Auto-grade multiple choice and true/false
  let score = 0;
  const gradedAnswers: SubmissionAnswer[] = answers.map(answer => {
    const question = test.questions.find(q => q.id === answer.questionId);
    if (!question) {
      return { ...answer, isCorrect: false, pointsEarned: 0 };
    }

    let isCorrect = false;
    if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
      isCorrect = answer.answer === question.correctAnswer;
    }
    // Text questions need manual grading

    const pointsEarned = isCorrect ? question.points : 0;
    score += pointsEarned;

    return { ...answer, isCorrect, pointsEarned };
  });

  await updateDoc(subRef, {
    answers: gradedAnswers,
    score,
    submittedAt: getNowISO(),
    timeSpent,
  });
}

export async function gradeSubmission(
  submissionId: string,
  answers: SubmissionAnswer[],
  feedback: string,
  gradedBy: string
): Promise<void> {
  const score = answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

  const subRef = doc(db, COLLECTIONS.SUBMISSIONS, submissionId);
  await updateDoc(subRef, {
    answers,
    score,
    feedback,
    gradedBy,
    gradedAt: getNowISO(),
  });

  // Get submission to send notification
  const subSnapshot = await getDoc(subRef);
  if (subSnapshot.exists()) {
    const submission = subSnapshot.data() as ClassroomSubmission;
    await createNotification({
      classroomId: submission.classroomId,
      recipientId: submission.userId,
      type: 'submission_graded',
      title: 'Bài làm đã được chấm điểm',
      message: `Điểm của bạn: ${score}/${submission.totalPoints}`,
      relatedId: submissionId,
    });
  }
}

export async function getSubmissionByUserAndTest(
  testId: string,
  userId: string
): Promise<ClassroomSubmission | null> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('testId', '==', testId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ClassroomSubmission;
}

export async function getSubmissionsByTest(testId: string): Promise<ClassroomSubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('testId', '==', testId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
}

export async function getSubmissionsByUser(
  classroomId: string,
  userId: string
): Promise<ClassroomSubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
}

export async function getSubmissionsByClassroom(classroomId: string): Promise<ClassroomSubmission[]> {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
}

export function subscribeToSubmissions(
  testId: string,
  callback: (submissions: ClassroomSubmission[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.SUBMISSIONS),
    where('testId', '==', testId)
  );
  return onSnapshot(q, (snapshot) => {
    const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomSubmission));
    callback(submissions);
  });
}
