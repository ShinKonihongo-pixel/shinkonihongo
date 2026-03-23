// Cached charDataLoader for HanziWriter
// Stores stroke data in IndexedDB so each character is fetched only once
// Falls back to in-memory cache if IndexedDB is unavailable

const DB_NAME = 'hanzi-writer-cache';
const STORE_NAME = 'chars';
const DB_VERSION = 1;
const CDN_URL = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0';

// In-memory cache (immediate, survives within session)
const memCache = new Map<string, unknown>();

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function getFromIDB(char: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(char);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveToIDB(char: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, char);
  } catch {
    // Silently fail — mem cache still works
  }
}

/**
 * Cached charDataLoader for HanziWriter.create() options.
 * Usage: HanziWriter.create(el, char, { charDataLoader: cachedCharDataLoader, ... })
 */
export function cachedCharDataLoader(
  char: string,
  onComplete: (data: unknown) => void,
  onError?: () => void,
): void {
  // 1. Check memory cache (instant)
  const mem = memCache.get(char);
  if (mem) { onComplete(mem); return; }

  // 2. Check IndexedDB, then fetch if missing
  getFromIDB(char).then(cached => {
    if (cached) {
      memCache.set(char, cached);
      onComplete(cached);
      return;
    }

    // 3. Fetch from CDN
    fetch(`${CDN_URL}/${char}.json`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        memCache.set(char, data);
        saveToIDB(char, data); // fire-and-forget
        onComplete(data);
      })
      .catch(() => onError?.());
  });
}

/** Pre-cache a list of characters (call during idle time) */
export async function preCacheCharacters(chars: string[]): Promise<number> {
  let cached = 0;
  for (const char of chars) {
    if (memCache.has(char)) { cached++; continue; }
    const idb = await getFromIDB(char);
    if (idb) { memCache.set(char, idb); cached++; continue; }
    try {
      const r = await fetch(`${CDN_URL}/${char}.json`);
      if (r.ok) {
        const data = await r.json();
        memCache.set(char, data);
        await saveToIDB(char, data);
        cached++;
      }
    } catch { /* skip */ }
  }
  return cached;
}
