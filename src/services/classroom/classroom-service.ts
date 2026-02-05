// Classroom CRUD operations

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
import type { Classroom, ClassroomFormData } from '../../types/classroom';
import { COLLECTIONS, getNowISO, generateClassroomCode } from './collections';

export async function createClassroom(
  data: ClassroomFormData,
  createdBy: string
): Promise<Classroom> {
  // Generate unique code
  let code = generateClassroomCode();
  let codeExists = true;
  while (codeExists) {
    const existing = await getClassroomByCode(code);
    if (!existing) {
      codeExists = false;
    } else {
      code = generateClassroomCode();
    }
  }

  const now = getNowISO();
  const newClassroom: Omit<Classroom, 'id'> = {
    name: data.name,
    level: data.level,
    description: data.description || '',
    schedule: data.schedule,
    branchId: data.branchId || '',
    code,
    createdBy,
    createdAt: now,
    updatedAt: now,
    studentCount: 0,
    isActive: true,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.CLASSROOMS), newClassroom);
  const classroom = { id: docRef.id, ...newClassroom };

  // Add creator as admin member
  const newMember = {
    classroomId: classroom.id,
    userId: createdBy,
    role: 'admin' as const,
    joinedAt: now,
    invitedBy: createdBy,
    inviteMethod: 'direct' as const,
  };
  await addDoc(collection(db, COLLECTIONS.MEMBERS), newMember);

  return classroom;
}

export async function getClassroom(id: string): Promise<Classroom | null> {
  const docRef = doc(db, COLLECTIONS.CLASSROOMS, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Classroom;
}

export async function getClassroomByCode(code: string): Promise<Classroom | null> {
  const q = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('code', '==', code.toUpperCase()),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Classroom;
}

export async function updateClassroom(id: string, data: Partial<Classroom>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CLASSROOMS, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteClassroom(id: string): Promise<void> {
  // Delete all members
  const membersQ = query(collection(db, COLLECTIONS.MEMBERS), where('classroomId', '==', id));
  const membersSnapshot = await getDocs(membersQ);
  for (const memberDoc of membersSnapshot.docs) {
    await deleteDoc(memberDoc.ref);
  }

  // Delete all tests
  const testsQ = query(collection(db, COLLECTIONS.TESTS), where('classroomId', '==', id));
  const testsSnapshot = await getDocs(testsQ);
  for (const testDoc of testsSnapshot.docs) {
    await deleteDoc(testDoc.ref);
  }

  // Delete all submissions
  const subsQ = query(collection(db, COLLECTIONS.SUBMISSIONS), where('classroomId', '==', id));
  const subsSnapshot = await getDocs(subsQ);
  for (const subDoc of subsSnapshot.docs) {
    await deleteDoc(subDoc.ref);
  }

  // Delete all notifications
  const notifsQ = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('classroomId', '==', id));
  const notifsSnapshot = await getDocs(notifsQ);
  for (const notifDoc of notifsSnapshot.docs) {
    await deleteDoc(notifDoc.ref);
  }

  // Delete classroom
  const docRef = doc(db, COLLECTIONS.CLASSROOMS, id);
  await deleteDoc(docRef);
}

export async function getClassroomsByAdmin(adminId: string): Promise<Classroom[]> {
  const q = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('createdBy', '==', adminId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
}

export function subscribeToAdminClassrooms(
  adminId: string,
  callback: (classrooms: Classroom[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('createdBy', '==', adminId)
  );
  return onSnapshot(q, (snapshot) => {
    const classrooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
    callback(classrooms);
  });
}

export async function getClassroomsByUser(userId: string): Promise<Classroom[]> {
  // First get user's memberships
  const membersQ = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('userId', '==', userId)
  );
  const membersSnapshot = await getDocs(membersQ);
  const classroomIds = membersSnapshot.docs.map(doc => doc.data().classroomId as string);

  if (classroomIds.length === 0) return [];

  // Get all classrooms user is member of
  const classrooms: Classroom[] = [];
  for (const classroomId of classroomIds) {
    const classroom = await getClassroom(classroomId);
    if (classroom && classroom.isActive) {
      classrooms.push(classroom);
    }
  }

  return classrooms;
}

export function subscribeToUserClassrooms(
  userId: string,
  callback: (classrooms: Classroom[]) => void
): Unsubscribe {
  // Subscribe to user's memberships
  const membersQ = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('userId', '==', userId)
  );

  return onSnapshot(membersQ, async (snapshot) => {
    const classroomIds = snapshot.docs.map(doc => doc.data().classroomId as string);

    if (classroomIds.length === 0) {
      callback([]);
      return;
    }

    // Fetch all classrooms
    const classrooms: Classroom[] = [];
    for (const classroomId of classroomIds) {
      const classroom = await getClassroom(classroomId);
      if (classroom && classroom.isActive) {
        classrooms.push(classroom);
      }
    }

    callback(classrooms);
  });
}
