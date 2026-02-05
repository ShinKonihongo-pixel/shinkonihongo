// User & Settings Firestore service

import type { User } from '../../types/user';
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
  setDoc,
  db,
  type Unsubscribe,
} from './collections';

// ============ USERS ============

export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
  return snapshot.docs.map(doc => mapDoc<User>(doc));
}

export function subscribeToUsers(callback: (users: User[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.USERS), (snapshot) => {
    const users = snapshot.docs.map(doc => mapDoc<User>(doc));
    callback(users);
  });
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const q = query(collection(db, COLLECTIONS.USERS), where('username', '==', username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return mapDoc<User>(docSnap);
}

export async function addUser(data: Omit<User, 'id'>): Promise<User> {
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), data);
  return { id: docRef.id, ...data };
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, id);
  await updateDoc(docRef, data);
}

export async function deleteUser(id: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.USERS, id);
  await deleteDoc(docRef);
}

// ============ SETTINGS ============

export async function getUserSettings(userId: string): Promise<Record<string, unknown> | null> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return snapshot.data() as Record<string, unknown>;
}

export async function saveUserSettings(userId: string, settings: Record<string, unknown>): Promise<void> {
  const docRef = doc(db, COLLECTIONS.SETTINGS, userId);
  await setDoc(docRef, settings, { merge: true });
}
