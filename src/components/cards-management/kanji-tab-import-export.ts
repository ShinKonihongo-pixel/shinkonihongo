// KanjiTab - Import/Export utility functions

import type { KanjiCard, KanjiLesson } from '../../types/kanji';
import { downloadAsJSON, readJSONFileRaw } from '../../utils/data-export-import';

export function exportKanjiData(kanjiCards: KanjiCard[], kanjiLessons: KanjiLesson[]): void {
  const data = { kanjiCards, kanjiLessons };
  downloadAsJSON(data, `kanji-export-${new Date().toISOString().split('T')[0]}.json`);
}

export async function importKanjiData(
  file: File,
  onImportKanjiCard: (data: Omit<KanjiCard, 'id'>) => Promise<KanjiCard>,
): Promise<number> {
  const data = await readJSONFileRaw(file) as { kanjiCards?: Omit<KanjiCard, 'id'>[] };
  let imported = 0;
  for (const card of data.kanjiCards || []) {
    await onImportKanjiCard(card);
    imported++;
  }
  return imported;
}
