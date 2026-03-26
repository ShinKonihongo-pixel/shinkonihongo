// Listening comprehension Firestore + Storage service
import type { ListeningAudio, ListeningFolder, KaiwaLine, TtsMode } from '../../types/listening';
import { normalizeLessonType, type ListeningLessonType } from '../../types/listening';
import type { JLPTLevel } from '../../types/flashcard';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import {
  COLLECTIONS,
  mapDoc,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  db,
  type Unsubscribe,
} from './collections';

export function subscribeToListeningAudios(callback: (audios: ListeningAudio[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.LISTENING_AUDIOS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const audios = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        ...mapDoc<ListeningAudio>(docSnap),
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      };
    });
    callback(audios);
  });
}

export function subscribeToListeningFolders(callback: (folders: ListeningFolder[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.LISTENING_FOLDERS), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(docSnap => {
      const raw = docSnap.data();
      return {
        id: docSnap.id,
        ...raw,
        lessonType: normalizeLessonType(raw.lessonType),
        createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      } as ListeningFolder;
    });
    callback(folders);
  });
}

// Upload file to Storage then save metadata to Firestore
export async function addListeningAudio(
  data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>,
  file: File,
  createdBy: string,
): Promise<ListeningAudio> {
  const fileName = `listening/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, file);
  const audioUrl = await getDownloadURL(storageRef);
  const duration = await getAudioDuration(file);

  const docRef = await addDoc(collection(db, COLLECTIONS.LISTENING_AUDIOS), {
    ...data,
    audioUrl,
    storagePath: fileName,
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
}

// Add a text-based (TTS) audio entry — no file upload required
export async function addTextAudio(
  data: {
    title: string;
    description: string;
    textContent: string;
    jlptLevel: JLPTLevel;
    folderId: string;
    ttsMode?: TtsMode;
    kaiwaLines?: KaiwaLine[];
  },
  createdBy: string,
): Promise<ListeningAudio> {
  const docData: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    textContent: data.textContent,
    isTextToSpeech: true,
    ttsMode: data.ttsMode || 'single',
    audioUrl: '',
    duration: 0,
    jlptLevel: data.jlptLevel,
    folderId: data.folderId,
    createdAt: new Date().toISOString(),
    createdBy,
  };
  if (data.kaiwaLines && data.kaiwaLines.length > 0) {
    docData.kaiwaLines = data.kaiwaLines;
  }
  const docRef = await addDoc(collection(db, COLLECTIONS.LISTENING_AUDIOS), docData);
  return {
    id: docRef.id,
    title: data.title,
    description: data.description,
    textContent: data.textContent,
    isTextToSpeech: true,
    ttsMode: data.ttsMode || 'single',
    kaiwaLines: data.kaiwaLines,
    audioUrl: '',
    duration: 0,
    jlptLevel: data.jlptLevel,
    folderId: data.folderId,
    createdAt: new Date(),
    createdBy,
  };
}

// Update listening audio metadata by id
export async function updateListeningAudio(id: string, data: Partial<ListeningAudio>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.LISTENING_AUDIOS, id), data);
}

// Delete audio: removes Storage file (if any) then Firestore document
export async function deleteListeningAudio(id: string, storagePath?: string): Promise<void> {
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch {
      // Ignore — file may already be deleted or missing
    }
  }
  await deleteDoc(doc(db, COLLECTIONS.LISTENING_AUDIOS, id));
}

// Add a listening folder
export async function addListeningFolder(
  name: string,
  jlptLevel: JLPTLevel,
  lessonType: ListeningLessonType = 'other',
  lessonNumber: number | undefined,
  createdBy: string,
): Promise<ListeningFolder> {
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
  const docRef = await addDoc(collection(db, COLLECTIONS.LISTENING_FOLDERS), docData);
  return { id: docRef.id, name, jlptLevel, lessonType, lessonNumber, createdAt: new Date(), createdBy };
}

// Update a listening folder by id
export async function updateListeningFolder(id: string, data: Partial<ListeningFolder>): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.LISTENING_FOLDERS, id), data);
}

// Delete a listening folder by id (caller is responsible for deleting child audios first)
export async function deleteListeningFolder(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.LISTENING_FOLDERS, id));
}

// Helper: resolve audio duration from a File object via HTMLAudioElement
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => resolve(audio.duration);
    audio.onerror = () => resolve(0);
    audio.src = URL.createObjectURL(file);
  });
}
