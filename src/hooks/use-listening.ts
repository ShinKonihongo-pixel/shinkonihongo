// Hook for listening comprehension CRUD operations
// Manages listening lessons organized by JLPT level, lesson number, and lesson type
// Audio files are stored in Firebase Storage; metadata lives in Firestore

import { useState, useCallback, useEffect } from 'react';
import type { ListeningAudio, ListeningFolder, KaiwaLine, TtsMode } from '../types/listening';
import { normalizeLessonType, type ListeningLessonType } from '../types/listening';
import type { JLPTLevel } from '../types/flashcard';
import {
  subscribeToListeningAudios,
  subscribeToListeningFolders,
  addListeningAudio as addListeningAudioService,
  addTextAudio as addTextAudioService,
  updateListeningAudio as updateListeningAudioService,
  deleteListeningAudio as deleteListeningAudioService,
  addListeningFolder as addListeningFolderService,
  updateListeningFolder as updateListeningFolderService,
  deleteListeningFolder as deleteListeningFolderService,
} from '../services/firestore/listening-service';

// Re-export for backward compat (consumers import from this hook)
export { normalizeLessonType };
export type { ListeningLessonType };

export const LISTENING_LESSON_TYPES: { value: ListeningLessonType; label: string }[] = [
  { value: 'practice', label: '練習' },
  { value: 'conversation', label: '会話' },
  { value: 'reading', label: '読解' },
  { value: 'bunpou', label: '文型' },
  { value: 'reibun', label: '例文' },
  { value: 'other', label: 'その他' },
];

// Pre-defined lesson ranges per level
export const LISTENING_LESSONS: Record<string, { start: number; end: number }> = {
  N5: { start: 1, end: 25 },
  N4: { start: 26, end: 50 },
};

export function useListening() {
  const [audios, setAudios] = useState<ListeningAudio[]>([]);
  const [folders, setFolders] = useState<ListeningFolder[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to audios
  useEffect(() => {
    const unsubscribe = subscribeToListeningAudios((data) => {
      setAudios(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to folders
  useEffect(() => {
    const unsubscribe = subscribeToListeningFolders((data) => {
      setFolders(data);
    });
    return () => unsubscribe();
  }, []);

  // Add audio with file upload (stores in Firebase Storage)
  const addAudio = useCallback(async (
    data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>,
    file: File,
    createdBy: string
  ): Promise<ListeningAudio> => {
    return addListeningAudioService(data, file, createdBy);
  }, []);

  // Add text-based audio entry (TTS, no file upload). Supports single text or kaiwa mode.
  const addTextAudio = useCallback(async (
    data: {
      title: string; description: string; textContent: string;
      jlptLevel: JLPTLevel; folderId: string;
      ttsMode?: TtsMode; kaiwaLines?: KaiwaLine[];
    },
    createdBy: string
  ): Promise<ListeningAudio> => {
    return addTextAudioService(data, createdBy);
  }, []);

  // Update audio
  const updateAudio = useCallback(async (id: string, data: Partial<ListeningAudio>) => {
    await updateListeningAudioService(id, data);
  }, []);

  // Delete audio (removes from Firebase Storage if applicable)
  const deleteAudio = useCallback(async (id: string) => {
    const audio = audios.find(a => a.id === id);
    const storagePath = audio?.storagePath;
    await deleteListeningAudioService(id, storagePath);
  }, [audios]);

  // Get playable audio URL (directly from Firebase Storage URL)
  const getAudioUrl = useCallback(async (audio: ListeningAudio): Promise<string | null> => {
    return audio.audioUrl || null;
  }, []);

  // Add folder (with lessonNumber support)
  const addFolder = useCallback(async (
    name: string,
    jlptLevel: JLPTLevel,
    lessonType: ListeningLessonType = 'other',
    lessonNumber: number | undefined,
    createdBy: string
  ): Promise<ListeningFolder> => {
    return addListeningFolderService(name, jlptLevel, lessonType, lessonNumber, createdBy);
  }, []);

  // Update folder
  const updateFolder = useCallback(async (id: string, data: Partial<ListeningFolder>) => {
    await updateListeningFolderService(id, data);
  }, []);

  // Delete folder and all its audios
  const deleteFolder = useCallback(async (id: string) => {
    const audiosInFolder = audios.filter(a => a.folderId === id);
    for (const audio of audiosInFolder) {
      await deleteAudio(audio.id);
    }
    await deleteListeningFolderService(id);
  }, [audios, deleteAudio]);

  // Get folders by level
  const getFoldersByLevel = useCallback((level: JLPTLevel) => {
    return folders.filter(f => f.jlptLevel === level);
  }, [folders]);

  // Get folders by level and lesson type
  const getFoldersByLevelAndType = useCallback((level: JLPTLevel, lessonType: ListeningLessonType) => {
    return folders.filter(f => f.jlptLevel === level && f.lessonType === lessonType);
  }, [folders]);

  // Get folders by level and lesson number
  const getFoldersByLevelAndLesson = useCallback((level: JLPTLevel, lessonNumber: number) => {
    return folders.filter(f => f.jlptLevel === level && f.lessonNumber === lessonNumber);
  }, [folders]);

  // Get folders by level, lesson number, and type
  const getFoldersByLevelLessonAndType = useCallback((level: JLPTLevel, lessonNumber: number, lessonType: ListeningLessonType) => {
    return folders.filter(f => f.jlptLevel === level && f.lessonNumber === lessonNumber && f.lessonType === lessonType);
  }, [folders]);

  // Get audios by folder
  const getAudiosByFolder = useCallback((folderId: string) => {
    return audios.filter(a => a.folderId === folderId);
  }, [audios]);

  // Get audios by level
  const getAudiosByLevel = useCallback((level: JLPTLevel) => {
    return audios.filter(a => a.jlptLevel === level);
  }, [audios]);

  // Get count by level
  const getCountByLevel = useCallback((level: JLPTLevel) => {
    return audios.filter(a => a.jlptLevel === level).length;
  }, [audios]);

  return {
    audios,
    folders,
    loading,
    addAudio,
    addTextAudio,
    updateAudio,
    deleteAudio,
    addFolder,
    updateFolder,
    deleteFolder,
    getFoldersByLevel,
    getFoldersByLevelAndType,
    getFoldersByLevelAndLesson,
    getFoldersByLevelLessonAndType,
    getAudiosByFolder,
    getAudiosByLevel,
    getCountByLevel,
    getAudioUrl,
  };
}
