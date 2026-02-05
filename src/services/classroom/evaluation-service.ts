// Student evaluation management operations

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
import type { StudentEvaluation, EvaluationFormData } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';
import { createNotification } from './notification-service';

export async function createEvaluation(
  classroomId: string,
  data: EvaluationFormData,
  evaluatorId: string
): Promise<StudentEvaluation> {
  const newEvaluation: Omit<StudentEvaluation, 'id'> = {
    classroomId,
    userId: data.userId,
    evaluatorId,
    evaluatedAt: getNowISO(),
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    ratings: data.ratings,
    overallRating: data.overallRating,
    comment: data.comment,
    strengths: data.strengths,
    improvements: data.improvements,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.EVALUATIONS), newEvaluation);

  // Send notification to student
  await createNotification({
    classroomId,
    recipientId: data.userId,
    type: 'announcement',
    title: 'Đánh giá mới',
    message: `Bạn đã nhận được đánh giá từ giáo viên`,
    relatedId: docRef.id,
  });

  return { id: docRef.id, ...newEvaluation };
}

export async function updateEvaluation(
  evaluationId: string,
  data: Partial<EvaluationFormData>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVALUATIONS, evaluationId);
  await updateDoc(docRef, {
    ...data,
    evaluatedAt: getNowISO(),
  });
}

export async function deleteEvaluation(evaluationId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.EVALUATIONS, evaluationId);
  await deleteDoc(docRef);
}

// Send evaluation notification to student
export async function sendEvaluationNotification(
  evaluation: StudentEvaluation,
  message?: string
): Promise<void> {
  const ratingLabels: Record<number, string> = {
    1: 'Cần cải thiện',
    2: 'Trung bình',
    3: 'Khá',
    4: 'Tốt',
    5: 'Xuất sắc',
  };

  const customMessage = message || `Đánh giá tổng thể: ${ratingLabels[evaluation.overallRating] || 'N/A'}. ${evaluation.comment}`;

  await createNotification({
    classroomId: evaluation.classroomId,
    recipientId: evaluation.userId,
    type: 'announcement',
    title: 'Kết quả đánh giá học tập',
    message: customMessage,
    relatedId: evaluation.id,
  });
}

// Send evaluation notifications to multiple students
export async function sendBulkEvaluationNotifications(
  evaluations: StudentEvaluation[]
): Promise<number> {
  let sentCount = 0;
  for (const evaluation of evaluations) {
    try {
      await sendEvaluationNotification(evaluation);
      sentCount++;
    } catch (error) {
      console.error('Error sending notification for evaluation:', evaluation.id, error);
    }
  }
  return sentCount;
}

export async function getEvaluation(evaluationId: string): Promise<StudentEvaluation | null> {
  const docRef = doc(db, COLLECTIONS.EVALUATIONS, evaluationId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as StudentEvaluation;
}

export async function getEvaluationsByClassroom(classroomId: string): Promise<StudentEvaluation[]> {
  const q = query(
    collection(db, COLLECTIONS.EVALUATIONS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEvaluation));
  return evals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
}

export async function getEvaluationsByUser(
  classroomId: string,
  userId: string
): Promise<StudentEvaluation[]> {
  const q = query(
    collection(db, COLLECTIONS.EVALUATIONS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEvaluation));
  return evals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
}

export function subscribeToEvaluations(
  classroomId: string,
  callback: (evaluations: StudentEvaluation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.EVALUATIONS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const evals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentEvaluation));
    evals.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    callback(evals);
  });
}
