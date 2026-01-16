// Firestore service for Salary operations

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
  Salary,
  SalaryFormData,
  MonthlySalarySummary,
  TeacherMonthlySummary,
} from '../types/teacher';
import { getBranchMemberByUser, getBranchTeachers } from './branch-firestore';
import { getSessionsByTeacherAndMonth } from './teacher-firestore';

// Collection names
const COLLECTIONS = {
  SALARIES: 'salaries',
  TEACHING_SESSIONS: 'teaching_sessions',
} as const;

function getNowISO(): string {
  return new Date().toISOString();
}

// ============ SALARY CRUD ============

export async function createSalary(
  branchId: string,
  data: SalaryFormData,
  createdBy: string
): Promise<Salary> {
  // Get teacher's salary config from branch membership
  const member = await getBranchMemberByUser(branchId, data.teacherId);
  const hourlyRate = member?.salary?.type === 'hourly'
    ? member.salary.amount
    : (member?.salary?.amount || 0) / 160; // Assume 160 hours/month for monthly salary

  // Calculate from sessions
  const sessions = await getSessionsByTeacherAndMonth(data.teacherId, data.month);
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = totalMinutes / 60;

  // Calculate amounts
  const baseSalary = member?.salary?.type === 'monthly'
    ? member.salary.amount
    : Math.round(totalHours * hourlyRate);
  const bonus = data.bonus || 0;
  const deduction = data.deduction || 0;
  const totalAmount = baseSalary + bonus - deduction;

  const now = getNowISO();
  const newSalary: Omit<Salary, 'id'> = {
    branchId,
    teacherId: data.teacherId,
    month: data.month,
    totalHours,
    totalSessions: completedSessions.length,
    hourlyRate,
    baseSalary,
    bonus,
    deduction,
    totalAmount,
    status: 'draft',
    note: data.note,
    bonusNote: data.bonusNote,
    deductionNote: data.deductionNote,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.SALARIES), newSalary);
  return { id: docRef.id, ...newSalary };
}

export async function getSalary(id: string): Promise<Salary | null> {
  const docRef = doc(db, COLLECTIONS.SALARIES, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Salary;
}

export async function updateSalary(
  id: string,
  data: Partial<Salary>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SALARIES, id);

  // Recalculate total if bonus or deduction changed
  const updates: Partial<Salary> = { ...data, updatedAt: getNowISO() };
  if (data.bonus !== undefined || data.deduction !== undefined) {
    const current = await getSalary(id);
    if (current) {
      const bonus = data.bonus ?? current.bonus;
      const deduction = data.deduction ?? current.deduction;
      updates.totalAmount = current.baseSalary + bonus - deduction;
    }
  }

  await updateDoc(docRef, updates);
}

export async function deleteSalary(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SALARIES, id);
  await deleteDoc(docRef);
}

// Get salary by teacher and month
export async function getSalaryByTeacherAndMonth(
  teacherId: string,
  month: string
): Promise<Salary | null> {
  const q = query(
    collection(db, COLLECTIONS.SALARIES),
    where('teacherId', '==', teacherId),
    where('month', '==', month)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Salary;
}

// Get or create salary for teacher
export async function getOrCreateSalary(
  branchId: string,
  teacherId: string,
  month: string,
  createdBy: string
): Promise<Salary> {
  const existing = await getSalaryByTeacherAndMonth(teacherId, month);
  if (existing) return existing;

  return createSalary(branchId, { teacherId, month }, createdBy);
}

// Get all salaries for branch and month
export async function getSalariesByBranchAndMonth(
  branchId: string,
  month: string
): Promise<Salary[]> {
  const q = query(
    collection(db, COLLECTIONS.SALARIES),
    where('branchId', '==', branchId),
    where('month', '==', month)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salary));
}

// Get all salaries for teacher
export async function getSalariesByTeacher(teacherId: string): Promise<Salary[]> {
  const q = query(
    collection(db, COLLECTIONS.SALARIES),
    where('teacherId', '==', teacherId)
  );
  const snapshot = await getDocs(q);
  const salaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salary));
  // Sort by month descending
  return salaries.sort((a, b) => b.month.localeCompare(a.month));
}

// ============ SALARY STATUS MANAGEMENT ============

export async function approveSalary(salaryId: string, approvedBy: string): Promise<void> {
  await updateSalary(salaryId, {
    status: 'approved',
    approvedAt: getNowISO(),
    approvedBy,
  });
}

export async function markSalaryAsPaid(
  salaryId: string,
  paidBy: string
): Promise<void> {
  await updateSalary(salaryId, {
    status: 'paid',
    paidAt: getNowISO(),
    paidBy,
  });
}

export async function revertSalaryToDraft(salaryId: string): Promise<void> {
  await updateSalary(salaryId, {
    status: 'draft',
    paidAt: undefined,
    paidBy: undefined,
  });
}

// ============ SALARY CALCULATION ============

// Recalculate salary from sessions (when sessions change)
export async function recalculateSalary(salaryId: string): Promise<Salary | null> {
  const salary = await getSalary(salaryId);
  if (!salary) return null;

  // Get teacher's hourly rate
  const member = await getBranchMemberByUser(salary.branchId, salary.teacherId);
  const hourlyRate = member?.salary?.type === 'hourly'
    ? member.salary.amount
    : (member?.salary?.amount || 0) / 160;

  // Recalculate from sessions
  const sessions = await getSessionsByTeacherAndMonth(salary.teacherId, salary.month);
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = totalMinutes / 60;

  const baseSalary = member?.salary?.type === 'monthly'
    ? member.salary.amount
    : Math.round(totalHours * hourlyRate);
  const totalAmount = baseSalary + salary.bonus - salary.deduction;

  await updateSalary(salaryId, {
    totalHours,
    totalSessions: completedSessions.length,
    hourlyRate,
    baseSalary,
    totalAmount,
  });

  return { ...salary, totalHours, totalSessions: completedSessions.length, baseSalary, totalAmount };
}

// Generate salaries for all teachers in branch for a month
export async function generateBranchSalaries(
  branchId: string,
  month: string,
  createdBy: string
): Promise<Salary[]> {
  const teachers = await getBranchTeachers(branchId);
  const salaries: Salary[] = [];

  for (const teacher of teachers) {
    const salary = await getOrCreateSalary(branchId, teacher.userId, month, createdBy);
    salaries.push(salary);
  }

  return salaries;
}

// ============ SALARY SUMMARIES ============

// Get monthly summary for branch
export async function getBranchMonthlySummary(
  branchId: string,
  month: string
): Promise<MonthlySalarySummary> {
  const salaries = await getSalariesByBranchAndMonth(branchId, month);

  return {
    branchId,
    month,
    totalTeachers: salaries.length,
    totalHours: salaries.reduce((sum, s) => sum + s.totalHours, 0),
    totalSessions: salaries.reduce((sum, s) => sum + s.totalSessions, 0),
    totalBaseSalary: salaries.reduce((sum, s) => sum + s.baseSalary, 0),
    totalBonus: salaries.reduce((sum, s) => sum + s.bonus, 0),
    totalDeduction: salaries.reduce((sum, s) => sum + s.deduction, 0),
    totalAmount: salaries.reduce((sum, s) => sum + s.totalAmount, 0),
    paidCount: salaries.filter(s => s.status === 'paid').length,
    pendingCount: salaries.filter(s => s.status !== 'paid').length,
  };
}

// Get teacher's monthly summary
export async function getTeacherMonthlySummary(
  teacherId: string,
  teacherName: string,
  month: string
): Promise<TeacherMonthlySummary> {
  const sessions = await getSessionsByTeacherAndMonth(teacherId, month);
  const salary = await getSalaryByTeacherAndMonth(teacherId, month);

  return {
    teacherId,
    teacherName,
    month,
    totalHours: sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.duration, 0) / 60,
    totalSessions: sessions.length,
    completedSessions: sessions.filter(s => s.status === 'completed').length,
    cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
    absentSessions: sessions.filter(s => s.status === 'absent').length,
    salaryAmount: salary?.totalAmount,
    salaryStatus: salary?.status,
  };
}

// ============ SUBSCRIPTIONS ============

export function subscribeToSalariesByBranch(
  branchId: string,
  month: string,
  callback: (salaries: Salary[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.SALARIES),
    where('branchId', '==', branchId),
    where('month', '==', month)
  );
  return onSnapshot(q, (snapshot) => {
    const salaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salary));
    callback(salaries);
  });
}

export function subscribeToTeacherSalaries(
  teacherId: string,
  callback: (salaries: Salary[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.SALARIES),
    where('teacherId', '==', teacherId)
  );
  return onSnapshot(q, (snapshot) => {
    const salaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salary));
    salaries.sort((a, b) => b.month.localeCompare(a.month));
    callback(salaries);
  });
}
