// Data export/import utilities

import type { Flashcard, Lesson } from '../types/flashcard';
import type { StudySession, GameSession, JLPTSession } from '../types/user';

// Export data structure
export interface ExportData {
  version: string;
  exportedAt: string;
  flashcards: Flashcard[];
  lessons: Lesson[];
  studySessions?: StudySession[];
  gameSessions?: GameSession[];
  jlptSessions?: JLPTSession[];
}

// Export format options
export type ExportFormat = 'json' | 'csv';

// Create export data object
export function createExportData(
  flashcards: Flashcard[],
  lessons: Lesson[],
  studySessions?: StudySession[],
  gameSessions?: GameSession[],
  jlptSessions?: JLPTSession[]
): ExportData {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    flashcards,
    lessons,
    studySessions,
    gameSessions,
    jlptSessions,
  };
}

// Export to JSON file
export function exportToJSON(data: ExportData, filename?: string): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `flashcard-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export flashcards to CSV
export function exportToCSV(flashcards: Flashcard[], filename?: string): void {
  const headers = ['vocabulary', 'kanji', 'sinoVietnamese', 'meaning', 'jlptLevel', 'examples'];
  const rows = flashcards.map(card => [
    escapeCsvField(card.vocabulary),
    escapeCsvField(card.kanji),
    escapeCsvField(card.sinoVietnamese),
    escapeCsvField(card.meaning),
    card.jlptLevel,
    escapeCsvField(card.examples.join(' | ')),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `flashcards-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to escape CSV fields
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Parse imported JSON file
export async function parseImportFile(file: File): Promise<ExportData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // Validate structure
        if (!data.flashcards || !Array.isArray(data.flashcards)) {
          console.error('Invalid import file: missing flashcards array');
          resolve(null);
          return;
        }

        resolve(data);
      } catch (error) {
        console.error('Failed to parse import file:', error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      console.error('Failed to read file');
      resolve(null);
    };

    reader.readAsText(file);
  });
}

// Validate imported flashcard data
export function validateFlashcard(card: Partial<Flashcard>): boolean {
  return !!(
    card.vocabulary &&
    card.meaning &&
    card.jlptLevel &&
    ['N5', 'N4', 'N3', 'N2', 'N1'].includes(card.jlptLevel)
  );
}

// Generate import summary
export function getImportSummary(data: ExportData): {
  flashcardCount: number;
  lessonCount: number;
  byLevel: Record<string, number>;
} {
  const byLevel: Record<string, number> = {};

  data.flashcards.forEach(card => {
    byLevel[card.jlptLevel] = (byLevel[card.jlptLevel] || 0) + 1;
  });

  return {
    flashcardCount: data.flashcards.length,
    lessonCount: data.lessons?.length || 0,
    byLevel,
  };
}
