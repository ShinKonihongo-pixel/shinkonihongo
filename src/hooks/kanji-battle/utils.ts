// Utility functions for kanji battle

import type { KanjiBattleQuestion, KanjiBattleMode, JLPTLevel } from '../../types/kanji-battle';
import { generateKanjiHints } from '../../types/kanji-battle';
import { getKanjiSeedForLevel } from '../../data/kanji-seed/index';
import { shuffleArray } from '../../lib/game-utils';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Re-export shuffleArray for backwards compatibility
export { shuffleArray };

export function convertKanjiSeedToQuestions(
  selectedLevels: JLPTLevel[],
  count: number,
  timeLimit: number,
  _mode: KanjiBattleMode // Reserved for future mode-specific logic
): KanjiBattleQuestion[] {
  // Gather kanji from all selected levels
  const allKanji = selectedLevels.flatMap(level => {
    // Use dummy lessonIds since we just need the kanji data
    return getKanjiSeedForLevel(level, ['seed-lesson']);
  });

  const shuffled = shuffleArray(allKanji).slice(0, count);

  return shuffled.map(kanji => {
    const acceptedAnswers = [
      kanji.meaning,
      kanji.sinoVietnamese,
      ...kanji.onYomi,
      ...kanji.kunYomi,
    ].filter(Boolean).map(a => a.toLowerCase().trim());

    const question: KanjiBattleQuestion = {
      id: generateId(),
      kanjiCharacter: kanji.character,
      onYomi: kanji.onYomi,
      kunYomi: kanji.kunYomi,
      sinoVietnamese: kanji.sinoVietnamese,
      meaning: kanji.meaning,
      sampleWords: kanji.sampleWords || [],
      acceptedAnswers,
      strokeCount: kanji.strokeCount,
      points: 100,
      penalty: 30,
      timeLimit,
      hints: [],
    };

    // Generate hints after creating the question
    question.hints = generateKanjiHints(question);

    return question;
  });
}
