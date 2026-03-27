/**
 * useGameCreateHandlers — all state mutation and submit logic for GameCreate.
 */

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { JLPTLevel } from '../../types/flashcard';
import type { CreateGameData, GameQuestionSource, GameDifficultyLevel, HostMode } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';
import { JLPT_LEVELS } from '../../constants/jlpt';
import { getMaxRounds, getMaxPlayers } from './game-create-types';
import type { UserRole } from '../../types/user';

interface HandlersParams {
  userRole: UserRole | undefined;
  source: GameQuestionSource;
  isFlashcardSource: boolean;
  isSuperAdmin: boolean;
  title: string;
  selectedLessons: string[];
  selectedJLPTLevels: string[];
  selectedDifficulty: GameDifficultyLevel | null;
  totalRounds: number;
  timePerQuestion: number;
  maxPlayers: number;
  hostMode: HostMode;
  availableCards: number;
  availableJLPTQuestions: number;
  selectedLessonNames: string[];
  gameSettings: AppSettings;
  getLessonsByLevel: (level: JLPTLevel) => { id: string; name: string }[];
  getChildLessons: (parentId: string) => { id: string; name: string }[];
  setSelectedLessons: Dispatch<SetStateAction<string[]>>;
  setSelectedJLPTLevels: Dispatch<SetStateAction<string[]>>;
  setSelectedDifficulty: Dispatch<SetStateAction<GameDifficultyLevel | null>>;
  setTotalRounds: Dispatch<SetStateAction<number>>;
  setMaxPlayers: Dispatch<SetStateAction<number>>;
  setUpgradeHint: Dispatch<SetStateAction<string | null>>;
  onCreateGame: (data: CreateGameData) => Promise<void>;
}

export function useGameCreateHandlers({
  userRole,
  source,
  isFlashcardSource,
  isSuperAdmin,
  title,
  selectedLessons,
  selectedJLPTLevels,
  selectedDifficulty,
  totalRounds,
  timePerQuestion,
  maxPlayers,
  hostMode,
  availableCards,
  availableJLPTQuestions,
  selectedLessonNames,
  gameSettings,
  getLessonsByLevel,
  getChildLessons,
  setSelectedLessons,
  setSelectedJLPTLevels,
  setSelectedDifficulty,
  setTotalRounds,
  setMaxPlayers,
  setUpgradeHint,
  onCreateGame,
}: HandlersParams) {
  const maxRoundsLimit = getMaxRounds(userRole);
  const maxPlayersLimit = getMaxPlayers(userRole);

  const showUpgradeHint = (field: string) => {
    setUpgradeHint(field);
    setTimeout(() => setUpgradeHint(prev => (prev === field ? null : prev)), 3000);
  };

  const handleToggleDifficulty = (diff: GameDifficultyLevel) => {
    setSelectedDifficulty(prev => (prev === diff ? null : diff));
  };

  const handleToggleJLPTLevel = (level: string) => {
    setSelectedJLPTLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level],
    );
  };

  const handleToggleLesson = (lessonId: string) => {
    const children = getChildLessons(lessonId);
    const allIds = [lessonId, ...children.map(c => c.id)];
    setSelectedLessons(prev => {
      if (prev.includes(lessonId)) return prev.filter(id => !allIds.includes(id));
      return [...new Set([...prev, ...allIds])];
    });
  };

  const handleSelectAllInLevel = (level: JLPTLevel) => {
    const allLessonIds: string[] = [];
    getLessonsByLevel(level).forEach(lesson => {
      allLessonIds.push(lesson.id);
      getChildLessons(lesson.id).forEach(child => allLessonIds.push(child.id));
    });
    const allSelected = allLessonIds.every(id => selectedLessons.includes(id));
    if (allSelected) {
      setSelectedLessons(prev => prev.filter(id => !allLessonIds.includes(id)));
    } else {
      setSelectedLessons(prev => [...new Set([...prev, ...allLessonIds])]);
    }
  };

  const handleSelectAllLevels = useCallback(() => {
    JLPT_LEVELS.forEach(level => {
      const allLessonIds: string[] = [];
      getLessonsByLevel(level).forEach(lesson => {
        allLessonIds.push(lesson.id);
        getChildLessons(lesson.id).forEach(child => allLessonIds.push(child.id));
      });
      setSelectedLessons(prev => [...new Set([...prev, ...allLessonIds])]);
    });
  }, [getLessonsByLevel, getChildLessons, setSelectedLessons]);

  const handleRoundsChange = (val: number) => {
    if (val > maxRoundsLimit) { setTotalRounds(maxRoundsLimit); showUpgradeHint('rounds'); }
    else setTotalRounds(val);
  };

  const handlePlayersChange = (val: number) => {
    if (val > maxPlayersLimit) { setMaxPlayers(maxPlayersLimit); showUpgradeHint('players'); }
    else setMaxPlayers(val);
  };

  /**
   * Assembles and submits CreateGameData. Routing differs by source:
   *
   * Flashcard sources (vocabulary / kanji):
   *  - Guard: at least one lesson selected and ≥4 available cards.
   *  - Cap totalRounds to availableCards so the generator never runs out of questions.
   *
   * JLPT source:
   *  - Guard: ≥4 questions match the selected level filters.
   *  - lessonIds is empty — the server filters by jlptLevels instead.
   *
   * hostMode is only forwarded for super_admin users.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFlashcardSource) {
      if (selectedLessons.length === 0 || availableCards < 4) return;
      const actualRounds = Math.min(totalRounds, availableCards);
      await onCreateGame({
        title: title || (source === 'kanji' ? 'Đại Chiến Kanji' : 'Đại Chiến Từ Vựng'),
        source,
        hostMode: isSuperAdmin ? hostMode : undefined,
        lessonIds: selectedLessons,
        lessonNames: selectedLessonNames,
        difficultyLevels: selectedDifficulty ? [selectedDifficulty] : undefined,
        difficultyMix: gameSettings.quizDifficultyMix,
        totalRounds: actualRounds,
        timePerQuestion,
        maxPlayers,
        questionContent: source === 'kanji' ? 'kanji' : 'vocabulary',
        answerContent: source === 'kanji' ? 'vocabulary' : 'meaning',
        settings: { specialRoundEvery: 5 },
      });
    } else {
      if (availableJLPTQuestions < 4) return;
      const actualRounds = Math.min(totalRounds, availableJLPTQuestions);
      await onCreateGame({
        title: title || 'Đại Chiến JLPT',
        source: 'jlpt',
        hostMode: isSuperAdmin ? hostMode : undefined,
        lessonIds: [],
        jlptLevels: selectedJLPTLevels.length > 0 ? selectedJLPTLevels : undefined,
        totalRounds: actualRounds,
        timePerQuestion,
        maxPlayers,
        settings: { specialRoundEvery: 5 },
      });
    }
  };

  return {
    handleToggleDifficulty,
    handleToggleJLPTLevel,
    handleToggleLesson,
    handleSelectAllInLevel,
    handleSelectAllLevels,
    handleRoundsChange,
    handlePlayersChange,
    handleSubmit,
  };
}
