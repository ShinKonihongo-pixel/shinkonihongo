// IndexedDB storage for offline functionality

import type { Flashcard, Lesson } from '../types/flashcard';

const DB_NAME = 'flashcard-offline-db';
const DB_VERSION = 1;

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('flashcards')) {
        db.createObjectStore('flashcards', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('lessons')) {
        db.createObjectStore('lessons', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

// Save flashcards to IndexedDB
export async function saveFlashcardsOffline(cards: Flashcard[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('flashcards', 'readwrite');
  const store = tx.objectStore('flashcards');

  // Clear existing and add all
  store.clear();
  cards.forEach(card => store.put(card));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Load flashcards from IndexedDB
export async function loadFlashcardsOffline(): Promise<Flashcard[]> {
  const db = await openDB();
  const tx = db.transaction('flashcards', 'readonly');
  const store = tx.objectStore('flashcards');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Save lessons to IndexedDB
export async function saveLessonsOffline(lessons: Lesson[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('lessons', 'readwrite');
  const store = tx.objectStore('lessons');

  store.clear();
  lessons.forEach(lesson => store.put(lesson));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Load lessons from IndexedDB
export async function loadLessonsOffline(): Promise<Lesson[]> {
  const db = await openDB();
  const tx = db.transaction('lessons', 'readonly');
  const store = tx.objectStore('lessons');
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Save last synced timestamp
export async function saveLastSynced(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readwrite');
  const store = tx.objectStore('metadata');
  store.put({ key: 'lastSynced', value: new Date().toISOString() });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// Get last synced timestamp
export async function getLastSynced(): Promise<string | null> {
  const db = await openDB();
  const tx = db.transaction('metadata', 'readonly');
  const store = tx.objectStore('metadata');
  const request = store.get('lastSynced');

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      db.close();
      resolve(request.result?.value || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Check if IndexedDB is supported
export function isIndexedDBSupported(): boolean {
  return 'indexedDB' in window;
}

// Get offline data status
export async function getOfflineStatus(): Promise<{
  hasData: boolean;
  flashcardCount: number;
  lessonCount: number;
  lastSynced: string | null;
}> {
  try {
    const [cards, lessons, lastSynced] = await Promise.all([
      loadFlashcardsOffline(),
      loadLessonsOffline(),
      getLastSynced(),
    ]);

    return {
      hasData: cards.length > 0,
      flashcardCount: cards.length,
      lessonCount: lessons.length,
      lastSynced,
    };
  } catch {
    return {
      hasData: false,
      flashcardCount: 0,
      lessonCount: 0,
      lastSynced: null,
    };
  }
}

// Clear all offline data
export async function clearOfflineData(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['flashcards', 'lessons', 'metadata'], 'readwrite');

  tx.objectStore('flashcards').clear();
  tx.objectStore('lessons').clear();
  tx.objectStore('metadata').clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
