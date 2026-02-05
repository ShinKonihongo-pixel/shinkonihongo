// Member management operations

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
  increment,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ClassroomMember, MemberRole, InviteMethod, Classroom } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';

export async function addMember(
  classroomId: string,
  userId: string,
  role: MemberRole,
  invitedBy: string,
  inviteMethod: InviteMethod
): Promise<ClassroomMember> {
  // Check if already a member
  const existing = await getMemberByUserAndClassroom(classroomId, userId);
  if (existing) {
    return existing;
  }

  const newMember: Omit<ClassroomMember, 'id'> = {
    classroomId,
    userId,
    role,
    joinedAt: getNowISO(),
    invitedBy,
    inviteMethod,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), newMember);

  // Update student count (only for students)
  if (role === 'student') {
    const classroomRef = doc(db, COLLECTIONS.CLASSROOMS, classroomId);
    await updateDoc(classroomRef, {
      studentCount: increment(1),
    });
  }

  return { id: docRef.id, ...newMember };
}

export async function removeMember(memberId: string, classroomId: string): Promise<void> {
  const memberDoc = doc(db, COLLECTIONS.MEMBERS, memberId);
  const memberSnapshot = await getDoc(memberDoc);

  if (memberSnapshot.exists()) {
    const memberData = memberSnapshot.data() as ClassroomMember;

    // Decrement count if student
    if (memberData.role === 'student') {
      const classroomRef = doc(db, COLLECTIONS.CLASSROOMS, classroomId);
      await updateDoc(classroomRef, {
        studentCount: increment(-1),
      });
    }
  }

  await deleteDoc(memberDoc);
}

export async function getMembersByClassroom(classroomId: string): Promise<ClassroomMember[]> {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('classroomId', '==', classroomId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomMember));
}

export async function getMemberByUserAndClassroom(
  classroomId: string,
  userId: string
): Promise<ClassroomMember | null> {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('classroomId', '==', classroomId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ClassroomMember;
}

export function subscribeToMembers(
  classroomId: string,
  callback: (members: ClassroomMember[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.MEMBERS),
    where('classroomId', '==', classroomId)
  );
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomMember));
    callback(members);
  });
}

// Join classroom by code
export async function joinByCode(
  code: string,
  userId: string,
  getClassroomByCode: (code: string) => Promise<Classroom | null>
): Promise<{ success: boolean; error?: string; classroom?: Classroom }> {
  const classroom = await getClassroomByCode(code);

  if (!classroom) {
    return { success: false, error: 'Mã lớp học không hợp lệ' };
  }

  if (!classroom.isActive) {
    return { success: false, error: 'Lớp học đã bị đóng' };
  }

  // Check if already a member
  const existing = await getMemberByUserAndClassroom(classroom.id, userId);
  if (existing) {
    return { success: true, classroom }; // Already a member
  }

  // Add as student
  await addMember(classroom.id, userId, 'student', classroom.createdBy, 'code');

  return { success: true, classroom };
}
