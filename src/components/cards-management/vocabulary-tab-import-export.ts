// VocabularyTab - Import/Export and Seed utility functions

import type { Flashcard, Lesson, JLPTLevel } from './cards-management-types';
import { seedN5Lessons, seedN4Lessons, fixLessonOrder } from '../../scripts/seed-n5-lessons';
import { downloadAsJSON, readJSONFileRaw, generateExportFilename } from '../../utils/data-export-import';

export interface VocabularyExportData {
  version: string;
  exportedAt: string;
  type: 'vocabulary';
  flashcards: Omit<Flashcard, 'id'>[];
  lessons: Omit<Lesson, 'id'>[];
  lessonIdMap: Record<string, { name: string; jlptLevel: JLPTLevel }>;
}

export function exportVocabularyData(cards: Flashcard[], lessons: Lesson[]): void {
  const lessonIdMap: Record<string, { name: string; jlptLevel: JLPTLevel }> = {};
  lessons.forEach(l => { lessonIdMap[l.id] = { name: l.name, jlptLevel: l.jlptLevel }; });
  const exportData: VocabularyExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    type: 'vocabulary',
    flashcards: cards.map(({ id: _, ...rest }) => rest),
    lessons: lessons.map(({ id: _, ...rest }) => rest),
    lessonIdMap,
  };
  const filename = generateExportFilename('vocabulary');
  downloadAsJSON(exportData, filename);
}

export async function importVocabularyData(
  file: File,
  cards: Flashcard[],
  lessons: Lesson[],
  onImportLesson: (data: Omit<Lesson, 'id'>) => Promise<Lesson>,
  onImportFlashcard: (data: Omit<Flashcard, 'id'>) => Promise<Flashcard>,
  onProgress: (msg: string) => void,
): Promise<{ lessonsImported: number; cardsImported: number }> {
  const data = await readJSONFileRaw(file) as VocabularyExportData;
  if (!data.type || (data.type !== 'vocabulary' && (data.type as string) !== 'flashcards')) {
    throw new Error('File không phải là dữ liệu từ vựng hợp lệ');
  }

  onProgress(`Đang import ${data.lessons.length} bài học...`);
  const oldToNewLessonIdMap: Record<string, string> = {};
  const sortedLessons = [...data.lessons].sort((a, b) => {
    if (a.parentId === null && b.parentId !== null) return -1;
    if (a.parentId !== null && b.parentId === null) return 1;
    return 0;
  });

  for (const lessonData of sortedLessons) {
    const oldId = Object.keys(data.lessonIdMap).find(
      id => data.lessonIdMap[id].name === lessonData.name && data.lessonIdMap[id].jlptLevel === lessonData.jlptLevel
    );
    const existingLesson = lessons.find(
      l => l.name === lessonData.name && l.jlptLevel === lessonData.jlptLevel &&
           (lessonData.parentId === null ? l.parentId === null : l.parentId !== null && oldToNewLessonIdMap[lessonData.parentId] === l.parentId)
    );
    if (existingLesson) { if (oldId) oldToNewLessonIdMap[oldId] = existingLesson.id; continue; }
    const newLessonData = { ...lessonData, parentId: lessonData.parentId ? oldToNewLessonIdMap[lessonData.parentId] || null : null };
    const newLesson = await onImportLesson(newLessonData);
    if (oldId) oldToNewLessonIdMap[oldId] = newLesson.id;
  }

  onProgress(`Đang import ${data.flashcards.length} từ vựng...`);
  let importedCards = 0;
  for (const cardData of data.flashcards) {
    const newLessonId = oldToNewLessonIdMap[cardData.lessonId] || cardData.lessonId;
    const existingCard = cards.find(c => c.vocabulary === cardData.vocabulary && c.lessonId === newLessonId);
    if (existingCard) continue;
    await onImportFlashcard({ ...cardData, lessonId: newLessonId });
    importedCards++;
  }

  return { lessonsImported: Object.keys(oldToNewLessonIdMap).length, cardsImported: importedCards };
}

export async function seedVocabularyLessons(
  level: 'N5' | 'N4',
  userId: string,
): Promise<{ success: boolean; created: number }> {
  const fns = { N5: seedN5Lessons, N4: seedN4Lessons };
  return fns[level](userId);
}

export async function fixVocabularyBai1Order(
  levelLessons: Lesson[],
): Promise<void> {
  await fixLessonOrder(levelLessons, 'Bài 1', 'N5', 1);
}
