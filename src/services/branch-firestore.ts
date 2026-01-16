// Firestore service for Branch operations

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
import { db } from '../lib/firebase';
import type {
  Branch,
  BranchFormData,
  BranchMember,
  BranchMemberFormData,
  BranchMemberRole,
  BranchStats,
} from '../types/branch';

// Collection names
const COLLECTIONS = {
  BRANCHES: 'branches',
  BRANCH_MEMBERS: 'branch_members',
  CLASSROOMS: 'classrooms',
  CLASSROOM_MEMBERS: 'classroom_members',
} as const;

function getNowISO(): string {
  return new Date().toISOString();
}

// Generate unique branch code (6 chars)
function generateBranchCode(): string {
  return 'BR' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ============ BRANCH CRUD ============

export async function createBranch(
  data: BranchFormData,
  directorId: string
): Promise<Branch> {
  // Generate unique code
  let code = generateBranchCode();
  let codeExists = true;
  while (codeExists) {
    const existing = await getBranchByCode(code);
    if (!existing) {
      codeExists = false;
    } else {
      code = generateBranchCode();
    }
  }

  const now = getNowISO();
  const newBranch: Omit<Branch, 'id'> = {
    name: data.name,
    code,
    address: data.address || '',
    phone: data.phone || '',
    email: data.email || '',
    directorId,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.BRANCHES), newBranch);
  return { id: docRef.id, ...newBranch };
}

export async function getBranch(id: string): Promise<Branch | null> {
  const docRef = doc(db, COLLECTIONS.BRANCHES, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Branch;
}

export async function getBranchByCode(code: string): Promise<Branch | null> {
  const q = query(
    collection(db, COLLECTIONS.BRANCHES),
    where('code', '==', code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Branch;
}

export async function updateBranch(id: string, data: Partial<Branch>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BRANCHES, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteBranch(id: string): Promise<void> {
  // Delete all branch members
  const membersQ = query(
    collection(db, COLLECTIONS.BRANCH_MEMBERS),
    where('branchId', '==', id)
  );
  const membersSnapshot = await getDocs(membersQ);
  for (const memberDoc of membersSnapshot.docs) {
    await deleteDoc(memberDoc.ref);
  }

  // Delete branch
  const docRef = doc(db, COLLECTIONS.BRANCHES, id);
  await deleteDoc(docRef);
}

// Get branches by director
export async function getBranchesByDirector(directorId: string): Promise<Branch[]> {
  const q = query(
    collection(db, COLLECTIONS.BRANCHES),
    where('directorId', '==', directorId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
}

// Subscribe to director's branches
export function subscribeToBranches(
  directorId: string,
  callback: (branches: Branch[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.BRANCHES),
    where('directorId', '==', directorId)
  );
  return onSnapshot(q, (snapshot) => {
    const branches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
    callback(branches);
  });
}

// Get all branches (for super_admin)
export async function getAllBranches(): Promise<Branch[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.BRANCHES));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
}

// ============ BRANCH MEMBER MANAGEMENT ============

export async function addBranchMember(
  branchId: string,
  data: BranchMemberFormData,
  userId: string
): Promise<BranchMember> {
  // Check if already a member
  const existing = await getBranchMemberByUser(branchId, userId);
  if (existing) {
    // Update role if different
    if (existing.role !== data.role) {
      await updateBranchMember(existing.id, { role: data.role });
      return { ...existing, role: data.role };
    }
    return existing;
  }

  const newMember: Omit<BranchMember, 'id'> = {
    branchId,
    userId,
    role: data.role,
    salary: data.salary,
    joinedAt: getNowISO(),
    status: 'active',
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.BRANCH_MEMBERS), newMember);
  return { id: docRef.id, ...newMember };
}

export async function updateBranchMember(
  memberId: string,
  data: Partial<BranchMember>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BRANCH_MEMBERS, memberId);
  await updateDoc(docRef, data);
}

export async function removeBranchMember(memberId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BRANCH_MEMBERS, memberId);
  await deleteDoc(docRef);
}

export async function getBranchMembers(branchId: string): Promise<BranchMember[]> {
  const q = query(
    collection(db, COLLECTIONS.BRANCH_MEMBERS),
    where('branchId', '==', branchId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BranchMember));
}

export async function getBranchMemberByUser(
  branchId: string,
  userId: string
): Promise<BranchMember | null> {
  const q = query(
    collection(db, COLLECTIONS.BRANCH_MEMBERS),
    where('branchId', '==', branchId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as BranchMember;
}

export async function getBranchMembersByRole(
  branchId: string,
  role: BranchMemberRole
): Promise<BranchMember[]> {
  const q = query(
    collection(db, COLLECTIONS.BRANCH_MEMBERS),
    where('branchId', '==', branchId),
    where('role', '==', role)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BranchMember));
}

// Get all teachers in branch (main, part-time, assistant)
export async function getBranchTeachers(branchId: string): Promise<BranchMember[]> {
  const members = await getBranchMembers(branchId);
  return members.filter(m =>
    ['main_teacher', 'part_time_teacher', 'assistant'].includes(m.role) &&
    m.status === 'active'
  );
}

// Subscribe to branch members
export function subscribeToBranchMembers(
  branchId: string,
  callback: (members: BranchMember[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.BRANCH_MEMBERS),
    where('branchId', '==', branchId)
  );
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BranchMember));
    callback(members);
  });
}

// ============ BRANCH STATISTICS ============

export async function getBranchStats(branchId: string): Promise<BranchStats> {
  // Count classrooms
  const classroomsQ = query(
    collection(db, COLLECTIONS.CLASSROOMS),
    where('branchId', '==', branchId)
  );
  const classroomsSnapshot = await getDocs(classroomsQ);
  const classrooms = classroomsSnapshot.docs.map(doc => doc.data());

  const totalClasses = classrooms.length;
  const activeClasses = classrooms.filter(c => c.isActive).length;
  const totalStudents = classrooms.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  // Count teachers
  const teachers = await getBranchTeachers(branchId);
  const totalTeachers = teachers.length;

  return {
    branchId,
    totalClasses,
    totalStudents,
    totalTeachers,
    activeClasses,
  };
}

// ============ USER BRANCH ACCESS ============

// Get branches user has access to (as member or director)
export async function getUserBranches(userId: string): Promise<Branch[]> {
  // Check if director
  const directorBranches = await getBranchesByDirector(userId);
  if (directorBranches.length > 0) {
    return directorBranches;
  }

  // Check branch memberships
  const membershipQ = query(
    collection(db, COLLECTIONS.BRANCH_MEMBERS),
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const memberships = await getDocs(membershipQ);

  const branches: Branch[] = [];
  for (const memberDoc of memberships.docs) {
    const membership = memberDoc.data() as BranchMember;
    const branch = await getBranch(membership.branchId);
    if (branch && branch.status === 'active') {
      branches.push(branch);
    }
  }

  return branches;
}

// Check if user has access to branch
export async function userHasBranchAccess(
  userId: string,
  branchId: string
): Promise<boolean> {
  // Check if director
  const branch = await getBranch(branchId);
  if (branch && branch.directorId === userId) {
    return true;
  }

  // Check membership
  const member = await getBranchMemberByUser(branchId, userId);
  return member !== null && member.status === 'active';
}

// Get user's role in branch
export async function getUserBranchRole(
  userId: string,
  branchId: string
): Promise<BranchMemberRole | 'director' | null> {
  // Check if director
  const branch = await getBranch(branchId);
  if (branch && branch.directorId === userId) {
    return 'director';
  }

  // Check membership
  const member = await getBranchMemberByUser(branchId, userId);
  if (member && member.status === 'active') {
    return member.role;
  }

  return null;
}
