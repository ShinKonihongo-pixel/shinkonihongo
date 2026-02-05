// Test folder management operations

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { TestFolder, TestType } from '../../types/classroom';
import { COLLECTIONS, getNowISO } from './collections';

export async function createTestFolder(
  name: string,
  level: string,
  type: TestType,
  createdBy: string
): Promise<TestFolder> {
  const now = getNowISO();
  const newFolder: Omit<TestFolder, 'id'> = {
    name,
    level,
    type,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.TEST_FOLDERS), newFolder);
  return { id: docRef.id, ...newFolder };
}

export async function updateTestFolder(
  folderId: string,
  data: Partial<Pick<TestFolder, 'name'>>
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEST_FOLDERS, folderId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getNowISO(),
  });
}

export async function deleteTestFolder(folderId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.TEST_FOLDERS, folderId);
  await deleteDoc(docRef);
}

export async function getAllTestFolders(): Promise<TestFolder[]> {
  const q = query(collection(db, COLLECTIONS.TEST_FOLDERS));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as TestFolder))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function subscribeToTestFolders(
  callback: (folders: TestFolder[]) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.TEST_FOLDERS));
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestFolder));
    folders.sort((a, b) => a.name.localeCompare(b.name));
    callback(folders);
  });
}

export function getTestFoldersByLevelAndType(
  folders: TestFolder[],
  level: string,
  type: TestType
): TestFolder[] {
  return folders.filter(f => f.level === level && f.type === type);
}
