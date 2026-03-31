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
  limit,
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

export function subscribeToUsers(callback: (users: User[]) => void, limitCount = 500): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.USERS), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(d => {
      const user = mapDoc<User>(d);
      // Strip password hash from client-side user objects — passwords live in private subcollection
      user.password = '';
      return user;
    });
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
  // Separate password into private subcollection
  const { password, ...publicData } = data;
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), { ...publicData, password: '' });
  // Store password hash in private subcollection
  if (password) {
    await setDoc(doc(db, COLLECTIONS.USERS, docRef.id, 'private', 'auth'), { password });
  }
  return { id: docRef.id, ...data };
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  // If password is being updated, write to private subcollection instead
  if (data.password) {
    const { password, ...publicData } = data;
    await setDoc(doc(db, COLLECTIONS.USERS, id, 'private', 'auth'), { password }, { merge: true });
    if (Object.keys(publicData).length > 0) {
      await updateDoc(doc(db, COLLECTIONS.USERS, id), publicData);
    }
  } else {
    await updateDoc(doc(db, COLLECTIONS.USERS, id), data);
  }
}

/** Read password hash from private subcollection */
export async function getUserPassword(userId: string): Promise<string | null> {
  const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId, 'private', 'auth'));
  if (docSnap.exists()) {
    return (docSnap.data() as { password: string }).password;
  }
  return null;
}

export async function deleteUser(id: string): Promise<void> {
  // Delete private subcollection first, then user doc
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id, 'private', 'auth'));
  } catch { /* subcollection may not exist for old users */ }
  await deleteDoc(doc(db, COLLECTIONS.USERS, id));
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
