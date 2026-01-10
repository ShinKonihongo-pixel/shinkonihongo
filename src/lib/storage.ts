// LocalStorage utilities for flashcard persistence

const STORAGE_KEY = 'japanese-flashcards';

export function loadFromStorage<T>(key: string = STORAGE_KEY): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    console.error('Failed to load from localStorage');
    return null;
  }
}

export function saveToStorage<T>(data: T, key: string = STORAGE_KEY): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    console.error('Failed to save to localStorage');
    return false;
  }
}

export function clearStorage(key: string = STORAGE_KEY): void {
  localStorage.removeItem(key);
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Get today's date as ISO string (date only, no time)
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Check if a date is today or before
export function isDueForReview(dateString: string): boolean {
  const today = getTodayISO();
  return dateString <= today;
}
