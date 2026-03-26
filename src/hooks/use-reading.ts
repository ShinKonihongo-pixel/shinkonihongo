// Hook for reading comprehension CRUD operations

import { useState, useCallback, useEffect } from 'react';
import type { ReadingPassage, ReadingPassageFormData, ReadingFolder } from '../types/reading';
import type { JLPTLevel } from '../types/flashcard';
import {
  subscribeToPassages,
  subscribeToReadingFolders,
  addPassage as addPassageService,
  updatePassage as updatePassageService,
  deletePassage as deletePassageService,
  addReadingFolder,
  updateReadingFolder as updateReadingFolderService,
  deleteReadingFolder,
  deletePassagesByFolder,
} from '../services/firestore/reading-service';

export function useReading() {
  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [folders, setFolders] = useState<ReadingFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to passages
  useEffect(() => {
    const unsubscribe = subscribeToPassages((data) => {
      setPassages(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to folders
  useEffect(() => {
    const unsubscribe = subscribeToReadingFolders((data) => {
      setFolders(data);
    });
    return () => unsubscribe();
  }, []);

  // Add passage
  const addPassage = useCallback(async (data: ReadingPassageFormData, createdBy?: string): Promise<ReadingPassage> => {
    return addPassageService(data, createdBy);
  }, []);

  // Update passage
  const updatePassage = useCallback(async (id: string, data: Partial<ReadingPassage>) => {
    await updatePassageService(id, data);
  }, []);

  // Delete passage
  const deletePassage = useCallback(async (id: string) => {
    await deletePassageService(id);
  }, []);

  // Add folder (order auto-incremented per level)
  const addFolder = useCallback(async (name: string, jlptLevel: JLPTLevel, createdBy?: string): Promise<ReadingFolder> => {
    const levelFolders = folders.filter(f => f.jlptLevel === jlptLevel);
    const maxOrder = levelFolders.length > 0 ? Math.max(...levelFolders.map(f => f.order)) : 0;
    return addReadingFolder(name, jlptLevel, maxOrder + 1, createdBy);
  }, [folders]);

  // Update folder
  const updateFolder = useCallback(async (id: string, data: Partial<ReadingFolder>) => {
    await updateReadingFolderService(id, data);
  }, []);

  // Delete folder and cascade-delete its passages
  const deleteFolder = useCallback(async (id: string) => {
    await deletePassagesByFolder(id, passages);
    await deleteReadingFolder(id);
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
