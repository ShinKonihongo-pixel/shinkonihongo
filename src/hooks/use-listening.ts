// Hook for listening comprehension CRUD operations
// Manages listening lessons organized by JLPT level, lesson number, and lesson type
// Uses Firebase Storage for audio files (online, accessible from all devices)

import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { ListeningAudio, ListeningFolder, ListeningLessonType } from '../types/listening';
import type { JLPTLevel } from '../types/flashcard';

const AUDIOS_COLLECTION = 'listeningAudios';
const FOLDERS_COLLECTION = 'listeningFolders';

export type { ListeningLessonType };

export const LISTENING_LESSON_TYPES: { value: ListeningLessonType; label: string }[] = [
  { value: 'practice', label: '練習' },
  { value: 'conversation', label: '会話' },
  { value: 'reading', label: '読解' },
  { value: 'other', label: 'その他' },
];

// Backward compat: map old lesson types to new ones
export function normalizeLessonType(type?: string): ListeningLessonType {
  const map: Record<string, ListeningLessonType> = {
    vocabulary: 'practice',
    grammar: 'practice',
    conversation: 'conversation',
    general: 'other',
  };
  return map[type || ''] || (type as ListeningLessonType) || 'other';
}

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
    const q = query(collection(db, AUDIOS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date(),
      })) as ListeningAudio[];
      setAudios(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to folders (with normalization)
  useEffect(() => {
    const q = query(collection(db, FOLDERS_COLLECTION), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const raw = doc.data();
        return {
          id: doc.id,
          ...raw,
          lessonType: normalizeLessonType(raw.lessonType),
          createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        };
      }) as ListeningFolder[];
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
    // Upload audio file to Firebase Storage
    const fileName = `listening/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const audioUrl = await getDownloadURL(storageRef);

    // Get audio duration
    const duration = await getAudioDuration(file);

    // Save metadata to Firestore
    const docRef = await addDoc(collection(db, AUDIOS_COLLECTION), {
      ...data,
      audioUrl,
      storagePath: fileName, // Store path for deletion
      duration,
      createdAt: new Date().toISOString(),
      createdBy,
    });

    return {
      id: docRef.id,
      ...data,
      audioUrl,
      duration,
      createdAt: new Date(),
      createdBy,
    };
  }, []);

  // Update audio
  const updateAudio = useCallback(async (id: string, data: Partial<ListeningAudio>) => {
    await updateDoc(doc(db, AUDIOS_COLLECTION, id), data);
  }, []);

  // Delete audio (removes from Firebase Storage)
  const deleteAudio = useCallback(async (id: string) => {
    const audio = audios.find(a => a.id === id);
    if (audio) {
      // Delete from Firebase Storage
      const storagePath = (audio as ListeningAudio & { storagePath?: string }).storagePath;
      if (storagePath) {
        try {
          const storageRef = ref(storage, storagePath);
          await deleteObject(storageRef);
        } catch {
          // Ignore error if file doesn't exist
        }
      }
    }
    await deleteDoc(doc(db, AUDIOS_COLLECTION, id));
  }, [audios]);

  // Get playable audio URL (directly from Firebase Storage URL)
  const getAudioUrl = useCallback(async (audio: ListeningAudio): Promise<string | null> => {
    // Firebase Storage URLs are directly playable
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
    const docData: Record<string, unknown> = {
      name,
      jlptLevel,
      lessonType,
      createdAt: new Date().toISOString(),
      createdBy,
    };
    if (lessonNumber !== undefined) {
      docData.lessonNumber = lessonNumber;
    }
    const docRef = await addDoc(collection(db, FOLDERS_COLLECTION), docData);

    return {
      id: docRef.id,
      name,
      jlptLevel,
      lessonType,
      lessonNumber,
      createdAt: new Date(),
      createdBy,
    };
  }, []);

  // Update folder
  const updateFolder = useCallback(async (id: string, data: Partial<ListeningFolder>) => {
    await updateDoc(doc(db, FOLDERS_COLLECTION, id), data);
  }, []);

  // Delete folder and its audios
  const deleteFolder = useCallback(async (id: string) => {
    // Delete all audios in this folder
    const audiosInFolder = audios.filter(a => a.folderId === id);
    for (const audio of audiosInFolder) {
      await deleteAudio(audio.id);
    }
    await deleteDoc(doc(db, FOLDERS_COLLECTION, id));
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

// Helper to get audio duration
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = () => {
      resolve(0);
    };
    audio.src = URL.createObjectURL(file);
  });
}
