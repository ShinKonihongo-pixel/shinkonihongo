/**
 * useGameCreateDerived — derived state memos for GameCreate.
 * Centralises all expensive computations so the orchestrator stays lean.
 */

import { useMemo } from 'react';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { GameDifficultyLevel } from '../../types/quiz-game';
import { JLPT_LEVELS } from '../../constants/jlpt';

type MixConfig = Record<GameDifficultyLevel, Record<GameDifficultyLevel, number>>;

interface DerivedStateParams {
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  selectedLessons: string[];
  selectedJLPTLevels: string[];
  selectedDifficulty: GameDifficultyLevel | null;
  totalRounds: number;
  lessonSearch: string;
  mixConfig: MixConfig;
}

export function useGameCreateDerived({
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  selectedLessons,
  selectedJLPTLevels,
  selectedDifficulty,
  totalRounds,
  lessonSearch,
  mixConfig,
}: DerivedStateParams) {
  const lessonCards = useMemo(
    () => flashcards.filter(c => selectedLessons.includes(c.lessonId)),
    [flashcards, selectedLessons],
  );

  const difficultyCount = useMemo(() => {
    const counts: Record<GameDifficultyLevel, number> = { super_hard: 0, hard: 0, medium: 0, easy: 0 };
    for (const c of lessonCards) {
      if (c.difficultyLevel && c.difficultyLevel !== 'unset') {
        counts[c.difficultyLevel]++;
      }
    }
    return counts;
  }, [lessonCards]);

  const canFulfillDifficulty = useMemo(() => {
    const result: Record<GameDifficultyLevel, boolean> = { super_hard: false, hard: false, medium: false, easy: false };
    const levels: GameDifficultyLevel[] = ['super_hard', 'hard', 'medium', 'easy'];

    for (const level of levels) {
      const row = mixConfig[level];
      const rowTotal = row.super_hard + row.hard + row.medium + row.easy;
      if (rowTotal === 0) {
        result[level] = lessonCards.length >= 4;
        continue;
      }
      let ok = true;
      for (const cardDiff of levels) {
        const pct = row[cardDiff] / rowTotal;
        const needed = Math.ceil(pct * totalRounds);
        if (needed > 0 && difficultyCount[cardDiff] < needed) {
          ok = false;
          break;
        }
      }
      result[level] = ok;
    }
    return result;
  }, [mixConfig, totalRounds, difficultyCount, lessonCards.length]);

  const availableCards = useMemo(() => {
    if (!selectedDifficulty) return lessonCards.length;
    const row = mixConfig[selectedDifficulty];
    const rowTotal = row.super_hard + row.hard + row.medium + row.easy;
    if (rowTotal === 0) return lessonCards.length;
    const levels: GameDifficultyLevel[] = ['super_hard', 'hard', 'medium', 'easy'];
    return levels.reduce(
      (sum, d) => sum + Math.min(difficultyCount[d], Math.ceil((row[d] / rowTotal) * 999)),
      0,
    );
  }, [lessonCards.length, selectedDifficulty, mixConfig, difficultyCount]);

  const allLessonsMap = useMemo(() => {
    const map = new Map<string, string>();
    JLPT_LEVELS.forEach(level => {
      getLessonsByLevel(level).forEach(lesson => {
        map.set(lesson.id, lesson.name);
        getChildLessons(lesson.id).forEach(child => map.set(child.id, child.name));
      });
    });
    return map;
  }, [getLessonsByLevel, getChildLessons]);

  const filteredLessons = useMemo<Lesson[] | null>(() => {
    if (!lessonSearch.trim()) return null;
    const q = lessonSearch.toLowerCase();
    const all: Lesson[] = [];
    JLPT_LEVELS.forEach(level => {
      getLessonsByLevel(level).forEach(l => {
        if (l.name.toLowerCase().includes(q)) all.push(l);
        getChildLessons(l.id).forEach(child => {
          if (child.name.toLowerCase().includes(q)) all.push(child);
        });
      });
    });
    return all;
  }, [lessonSearch, getLessonsByLevel, getChildLessons]);

  const levelCardCount = useMemo(() => {
    const counts: Record<string, number> = {};
    JLPT_LEVELS.forEach(level => {
      const ids = new Set<string>();
      getLessonsByLevel(level).forEach(l => {
        ids.add(l.id);
        getChildLessons(l.id).forEach(child => ids.add(child.id));
      });
      counts[level] = flashcards.filter(c => ids.has(c.lessonId)).length;
    });
    return counts;
  }, [flashcards, getLessonsByLevel, getChildLessons]);

  const selectedLessonNames = useMemo(
    () => selectedLessons.map(id => allLessonsMap.get(id) || id).slice(0, 5),
    [selectedLessons, allLessonsMap],
  );

  const availableJLPTQuestions = useMemo(() => {
    let filtered = jlptQuestions;
    if (selectedJLPTLevels.length > 0) {
      filtered = filtered.filter(q => selectedJLPTLevels.includes(q.level));
    }
    return filtered.length;
  }, [jlptQuestions, selectedJLPTLevels]);

  return {
    lessonCards,
    difficultyCount,
    canFulfillDifficulty,
    availableCards,
    allLessonsMap,
    filteredLessons,
    levelCardCount,
    selectedLessonNames,
    availableJLPTQuestions,
  };
}
