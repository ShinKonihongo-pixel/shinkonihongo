// Notification management operations

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ClassroomNotification, NotificationType } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';
import { getMembersByClassroom } from './member-service';

interface CreateNotificationData {
  classroomId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}

export async function createNotification(data: CreateNotificationData): Promise<ClassroomNotification> {
  const newNotification: Omit<ClassroomNotification, 'id'> = {
    ...data,
    isRead: false,
    createdAt: getNowISO(),
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), newNotification);
  return { id: docRef.id, ...newNotification };
}

export async function markAsRead(notificationId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
  await updateDoc(docRef, { isRead: true });
}

export async function markAllAsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  for (const notifDoc of snapshot.docs) {
    await updateDoc(notifDoc.ref, { isRead: true });
  }
}

export async function getUnreadNotifications(userId: string): Promise<ClassroomNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
}

export async function getAllNotifications(userId: string): Promise<ClassroomNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
  // Sort by createdAt descending
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNotificationsByClassroom(classroomId: string): Promise<ClassroomNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: ClassroomNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('recipientId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomNotification));
    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(notifications);
  });
}

// Send notification to all students in a classroom
export async function sendBulkNotifications(
  classroomId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string
): Promise<void> {
  // Get all student members
  const members = await getMembersByClassroom(classroomId);
  const studentMembers = members.filter(m => m.role === 'student');

  for (const member of studentMembers) {
    await createNotification({
      classroomId,
      recipientId: member.userId,
      type,
      title,
      message,
      relatedId,
    });
  }
}
