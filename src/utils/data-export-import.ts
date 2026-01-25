// Export/Import utilities for flashcards and JLPT data

import type { Flashcard, Lesson, GrammarCard } from '../types/flashcard';
import type { JLPTQuestion, JLPTFolder } from '../types/jlpt-question';

// Version for compatibility checking
const EXPORT_VERSION = '1.0';

// Export data types
export interface FlashcardsExportData {
  version: string;
  type: 'flashcards';
  exportedAt: string;
  lessons: Omit<Lesson, 'id'>[];
  flashcards: Omit<Flashcard, 'id'>[];
  grammarCards: Omit<GrammarCard, 'id'>[];
  // Map old lessonIds to lessonName for re-linking on import
  lessonIdMap: Record<string, { name: string; jlptLevel: string; parentName: string | null }>;
}

export interface JLPTExportData {
  version: string;
  type: 'jlpt';
  exportedAt: string;
  folders: Omit<JLPTFolder, 'id'>[];
  questions: Omit<JLPTQuestion, 'id'>[];
  // Map old folderIds to folder info for re-linking
  folderIdMap: Record<string, { name: string; level: string; category: string }>;
}

export type ExportData = FlashcardsExportData | JLPTExportData;

// ============ EXPORT FUNCTIONS ============

export function exportFlashcardsData(
  cards: Flashcard[],
  lessons: Lesson[],
  grammarCards: GrammarCard[]
): FlashcardsExportData {
  // Build lesson ID map for re-linking
  const lessonIdMap: FlashcardsExportData['lessonIdMap'] = {};
  lessons.forEach(lesson => {
    const parent = lesson.parentId ? lessons.find(l => l.id === lesson.parentId) : null;
    lessonIdMap[lesson.id] = {
      name: lesson.name,
      jlptLevel: lesson.jlptLevel,
      parentName: parent?.name || null,
    };
  });

  // Remove IDs from data (will be regenerated on import)
  const lessonsWithoutId = lessons.map(({ id, ...rest }) => rest);
  const cardsWithoutId = cards.map(({ id, ...rest }) => rest);
  const grammarWithoutId = grammarCards.map(({ id, ...rest }) => rest);

  return {
    version: EXPORT_VERSION,
    type: 'flashcards',
    exportedAt: new Date().toISOString(),
    lessons: lessonsWithoutId,
    flashcards: cardsWithoutId,
    grammarCards: grammarWithoutId,
    lessonIdMap,
  };
}

export function exportJLPTData(
  questions: JLPTQuestion[],
  folders: JLPTFolder[]
): JLPTExportData {
  // Build folder ID map for re-linking
  const folderIdMap: JLPTExportData['folderIdMap'] = {};
  folders.forEach(folder => {
    folderIdMap[folder.id] = {
      name: folder.name,
      level: folder.level,
      category: folder.category,
    };
  });

  const foldersWithoutId = folders.map(({ id, ...rest }) => rest);
  const questionsWithoutId = questions.map(({ id, ...rest }) => rest);

  return {
    version: EXPORT_VERSION,
    type: 'jlpt',
    exportedAt: new Date().toISOString(),
    folders: foldersWithoutId,
    questions: questionsWithoutId,
    folderIdMap,
  };
}

// ============ DOWNLOAD HELPER ============

export function downloadAsJSON(data: ExportData, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============ IMPORT HELPERS ============

export function readJSONFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.version || !data.type) {
          reject(new Error('File không hợp lệ: thiếu version hoặc type'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('File JSON không hợp lệ'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
    reader.readAsText(file);
  });
}

export function validateFlashcardsImport(data: unknown): data is FlashcardsExportData {
  const d = data as FlashcardsExportData;
  return (
    d.type === 'flashcards' &&
    Array.isArray(d.lessons) &&
    Array.isArray(d.flashcards) &&
    Array.isArray(d.grammarCards) &&
    typeof d.lessonIdMap === 'object'
  );
}

export function validateJLPTImport(data: unknown): data is JLPTExportData {
  const d = data as JLPTExportData;
  return (
    d.type === 'jlpt' &&
    Array.isArray(d.folders) &&
    Array.isArray(d.questions) &&
    typeof d.folderIdMap === 'object'
  );
}

// Generate filename with timestamp
export function generateExportFilename(type: 'flashcards' | 'jlpt'): string {
  const date = new Date().toISOString().split('T')[0];
  return `${type}-export-${date}.json`;
}
