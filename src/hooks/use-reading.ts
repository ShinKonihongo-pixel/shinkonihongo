// Hook for reading comprehension CRUD operations

import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ReadingPassage, ReadingPassageFormData, ReadingFolder } from '../types/reading';
import type { JLPTLevel } from '../types/flashcard';

const PASSAGES_COLLECTION = 'readingPassages';
const FOLDERS_COLLECTION = 'readingFolders';

export function useReading() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [folders, setFolders] = useState<ReadingFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to passages
  useEffect(() => {
    const q = query(collection(db, PASSAGES_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ReadingPassage[];
      setPassages(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to folders
  useEffect(() => {
    const q = query(collection(db, FOLDERS_COLLECTION), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ReadingFolder[];
      setFolders(data);
    });
    return () => unsubscribe();
  }, []);

  // Add passage
  const addPassage = useCallback(async (data: ReadingPassageFormData, createdBy?: string): Promise<ReadingPassage> => {
    const questions = data.questions.map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx}`,
    }));

    const docRef = await addDoc(collection(db, PASSAGES_COLLECTION), {
      ...data,
      questions,
      createdAt: new Date().toISOString(),
      createdBy,
    });

    return {
      id: docRef.id,
      ...data,
      questions,
      createdAt: new Date().toISOString(),
      createdBy,
    };
  }, []);

  // Update passage
  const updatePassage = useCallback(async (id: string, data: Partial<ReadingPassage>) => {
    await updateDoc(doc(db, PASSAGES_COLLECTION, id), data);
  }, []);

  // Delete passage
  const deletePassage = useCallback(async (id: string) => {
    await deleteDoc(doc(db, PASSAGES_COLLECTION, id));
  }, []);

  // Add folder
  const addFolder = useCallback(async (name: string, jlptLevel: JLPTLevel, createdBy?: string): Promise<ReadingFolder> => {
    const levelFolders = folders.filter(f => f.jlptLevel === jlptLevel);
    const maxOrder = levelFolders.length > 0 ? Math.max(...levelFolders.map(f => f.order)) : 0;

    const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), {
      name,
      jlptLevel,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      createdBy,
    });

    return {
      id: docRef.id,
      name,
      jlptLevel,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      createdBy,
    };
  }, [folders]);

  // Update folder
  const updateFolder = useCallback(async (id: string, data: Partial<ReadingFolder>) => {
    await updateDoc(doc(db, FOLDERS_COLLECTION, id), data);
  }, []);

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    await deleteDoc(doc(db, FOLDERS_COLLECTION, id));
    // Also delete all passages in this folder
    const passagesInFolder = passages.filter(p => p.folderId === id);
    for (const passage of passagesInFolder) {
      await deleteDoc(doc(db, PASSAGES_COLLECTION, passage.id));
    }
  }, [passages]);

  // Get folders by level
  const getFoldersByLevel = useCallback((level: JLPTLevel) => {
    return folders.filter(f => f.jlptLevel === level).sort((a, b) => a.order - b.order);
  }, [folders]);

  // Get passages by folder
  const getPassagesByFolder = useCallback((folderId: string) => {
    return passages.filter(p => p.folderId === folderId);
  }, [passages]);

  // Get passages by level
  const getPassagesByLevel = useCallback((level: JLPTLevel) => {
    return passages.filter(p => p.jlptLevel === level);
  }, [passages]);

  return {
    passages,
    folders,
    loading,
    addPassage,
    updatePassage,
    deletePassage,
    addFolder,
    updateFolder,
    deleteFolder,
    getFoldersByLevel,
    getPassagesByFolder,
    getPassagesByLevel,
  };
}
