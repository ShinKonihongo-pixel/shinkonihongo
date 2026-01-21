// Image-Word Storage Service
// Manages lessons persistence in localStorage

import type { ImageWordLesson, ImageWordPair } from '../types/image-word';

const STORAGE_KEY = 'image-word-lessons';

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get all lessons from localStorage
export function getImageWordLessons(): ImageWordLesson[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as ImageWordLesson[];
  } catch (error) {
    console.error('Failed to load image-word lessons:', error);
    return [];
  }
}

// Save a lesson (create or update)
export function saveImageWordLesson(lesson: Partial<ImageWordLesson> & { pairs: ImageWordPair[] }): ImageWordLesson {
  const lessons = getImageWordLessons();
  const now = Date.now();

  if (lesson.id) {
    // Update existing lesson
    const index = lessons.findIndex(l => l.id === lesson.id);
    if (index !== -1) {
      lessons[index] = {
        ...lessons[index],
        ...lesson,
        updatedAt: now,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
      return lessons[index];
    }
  }

  // Create new lesson
  const newLesson: ImageWordLesson = {
    id: generateId(),
    name: lesson.name || 'Bài mới',
    description: lesson.description,
    pairs: lesson.pairs || [],
    createdAt: now,
    updatedAt: now,
  };

  lessons.push(newLesson);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  return newLesson;
}

// Delete a lesson
export function deleteImageWordLesson(id: string): boolean {
  try {
    const lessons = getImageWordLessons();
    const filtered = lessons.filter(l => l.id !== id);
    if (filtered.length === lessons.length) return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete lesson:', error);
    return false;
  }
}

// Get a single lesson by ID
export function getImageWordLessonById(id: string): ImageWordLesson | null {
  const lessons = getImageWordLessons();
  return lessons.find(l => l.id === id) || null;
}

// Generate a new pair with unique ID
export function createImageWordPair(
  imageUrl: string,
  vocabulary: string,
  meaning: string,
  reading?: string
): ImageWordPair {
  return {
    id: generateId(),
    imageUrl,
    vocabulary,
    meaning,
    reading,
  };
}

// Import lessons from JSON
export function importImageWordLessons(data: ImageWordLesson[]): number {
  try {
    const existing = getImageWordLessons();
    const existingIds = new Set(existing.map(l => l.id));

    // Only add lessons that don't exist
    let imported = 0;
    data.forEach(lesson => {
      if (!existingIds.has(lesson.id)) {
        existing.push(lesson);
        imported++;
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return imported;
  } catch (error) {
    console.error('Failed to import lessons:', error);
    return 0;
  }
}

// Export all lessons as JSON
export function exportImageWordLessons(): string {
  const lessons = getImageWordLessons();
  return JSON.stringify(lessons, null, 2);
}
