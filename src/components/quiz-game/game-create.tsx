/**
 * GameCreate — modal form for creating a new quiz-game room.
 *
 * Supports three question source modes:
 *  - "vocabulary" : questions drawn from app flashcards (kanji → meaning)
 *  - "kanji"      : questions drawn from app flashcards (kanji → hiragana reading)
 *  - "jlpt"       : questions drawn from the JLPT question bank, filtered by N-level
 *
 * Vocabulary and kanji modes share the lesson-picker and difficulty-filter UI;
 * JLPT mode replaces them with a level-pill selector (N5–N1).
 * Role-based limits cap the maximum rounds and player count for non-VIP users.
 */

import { useState } from 'react';
import type { Flashcard, JLPTLevel, Lesson } from '../../types/flashcard';
import type { JLPTQuestion } from '../../types/jlpt-question';
import type { CreateGameData, GameQuestionSource, GameDifficultyLevel, HostMode } from '../../types/quiz-game';
import type { AppSettings } from '../../hooks/use-settings';
import type { UserRole } from '../../types/user';
import { useBodyScrollLock } from '../../hooks/use-body-scroll-lock';
import { getMaxRounds, getMaxPlayers, VIP_MAX_ROUNDS, VIP_MAX_PLAYERS } from './game-create-types';
import { useGameCreateDerived } from './game-create-derived';
import { useGameCreateHandlers } from './game-create-handlers';
import { GameCreateHeader } from './game-create-header';
import { LessonPicker } from './game-create-lesson-picker';
import { JLPTPicker } from './game-create-jlpt-picker';
import { DifficultyPicker } from './game-create-difficulty-picker';
import { GameCreateSliders } from './game-create-sliders';
import { GameCreateFooter } from './game-create-footer';
import { ModalShell } from '../ui/modal-shell';

/**
 * Props for GameCreate.
 *
 * @prop flashcards         - Full flashcard pool; filtered by selected lessons at submit time.
 * @prop jlptQuestions      - Full JLPT question bank; filtered by selected levels at submit time.
 * @prop getLessonsByLevel  - Returns top-level lessons for a given JLPT level (e.g. "N5").
 * @prop getChildLessons    - Returns sub-lessons under a parent lesson ID.
 * @prop onCreateGame       - Called with the assembled CreateGameData when the form submits.
 * @prop onCancel           - Called when the user dismisses the modal without creating.
 * @prop loading            - True while the server is processing the create request.
 * @prop error              - Server-side error message to display in the form, or null.
 * @prop gameSettings       - App-level settings including quizDifficultyMix and gameQuestionContent.
 * @prop userRole           - Determines round/player caps and whether host-mode picker is shown.
 */
interface GameCreateProps {
  flashcards: Flashcard[];
  jlptQuestions: JLPTQuestion[];
  getLessonsByLevel: (level: JLPTLevel) => Lesson[];
  getChildLessons: (parentId: string) => Lesson[];
  onCreateGame: (data: CreateGameData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  gameSettings: AppSettings;
  userRole?: UserRole;
}

export function GameCreate({
  flashcards,
  jlptQuestions,
  getLessonsByLevel,
  getChildLessons,
  onCreateGame,
  onCancel,
  loading,
  error,
  gameSettings,
  userRole,
}: GameCreateProps) {
  useBodyScrollLock();

  const [title, setTitle] = useState('');
  const [source, setSource] = useState<GameQuestionSource>('vocabulary');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [selectedJLPTLevels, setSelectedJLPTLevels] = useState<string[]>([]);
  const [totalRounds, setTotalRounds] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficultyLevel | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<JLPTLevel | null>(null);
  const [upgradeHint, setUpgradeHint] = useState<string | null>(null);
  const [lessonSearch, setLessonSearch] = useState('');
  const [hostMode, setHostMode] = useState<HostMode>('play');

  const isSuperAdmin = userRole === 'super_admin';
  const isFlashcardSource = source === 'vocabulary' || source === 'kanji';
  const isVipOrAdmin = userRole === 'super_admin' || userRole === 'vip_user';
  const maxRoundsLimit = getMaxRounds(userRole);
  const maxPlayersLimit = getMaxPlayers(userRole);

  const {
    canFulfillDifficulty,
    availableCards,
    filteredLessons,
    levelCardCount,
    selectedLessonNames,
    availableJLPTQuestions,
  } = useGameCreateDerived({
    flashcards,
    jlptQuestions,
    getLessonsByLevel,
    getChildLessons,
    selectedLessons,
    selectedJLPTLevels,
    selectedDifficulty,
    totalRounds,
    lessonSearch,
    mixConfig: gameSettings.quizDifficultyMix,
  });

  // Auto-deselect if selected difficulty can no longer be fulfilled
  if (selectedDifficulty && !canFulfillDifficulty[selectedDifficulty]) {
    setTimeout(() => setSelectedDifficulty(null), 0);
  }

  const {
    handleToggleDifficulty,
    handleToggleJLPTLevel,
    handleToggleLesson,
    handleSelectAllInLevel,
    handleSelectAllLevels,
    handleRoundsChange,
    handlePlayersChange,
    handleSubmit,
  } = useGameCreateHandlers({
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
  });

  const canSubmit = isFlashcardSource
    ? selectedLessons.length > 0 && availableCards >= 4
    : availableJLPTQuestions >= 4;

  const roundsPercent = ((totalRounds - 10) / (VIP_MAX_ROUNDS - 10)) * 100;
  const timePercent = ((timePerQuestion - 5) / (30 - 5)) * 100;
  const playersPercent = ((maxPlayers - 2) / (VIP_MAX_PLAYERS - 2)) * 100;

  return (
    <ModalShell isOpen onClose={onCancel} maxWidth={600} hideClose>
      <GameCreateHeader
          title={title}
          source={source}
          isFlashcardSource={isFlashcardSource}
          error={error}
          onTitleChange={setTitle}
          onSourceChange={setSource}
          onCancel={onCancel}
          onSelectAllInLevel={handleSelectAllInLevel}
          onSelectAllLevels={handleSelectAllLevels}
          onClearLessons={() => setSelectedLessons([])}
        />

        <div className="rm-body">
          {isFlashcardSource ? (
            <LessonPicker
              selectedLessons={selectedLessons}
              expandedLevel={expandedLevel}
              lessonSearch={lessonSearch}
              filteredLessons={filteredLessons}
              levelCardCount={levelCardCount}
              availableCards={availableCards}
              selectedDifficulty={selectedDifficulty}
              getLessonsByLevel={getLessonsByLevel}
              onLessonSearch={setLessonSearch}
              onToggleLesson={handleToggleLesson}
              onSelectAllInLevel={handleSelectAllInLevel}
              onExpandLevel={setExpandedLevel}
            />
          ) : (
            <JLPTPicker
              jlptQuestions={jlptQuestions}
              selectedJLPTLevels={selectedJLPTLevels}
              availableJLPTQuestions={availableJLPTQuestions}
              onToggleLevel={handleToggleJLPTLevel}
            />
          )}

          {isFlashcardSource && (
            <DifficultyPicker
              selectedDifficulty={selectedDifficulty}
              canFulfillDifficulty={canFulfillDifficulty}
              onToggleDifficulty={handleToggleDifficulty}
            />
          )}

          <GameCreateSliders
            isFlashcardSource={isFlashcardSource}
            isSuperAdmin={isSuperAdmin}
            isVipOrAdmin={isVipOrAdmin}
            totalRounds={totalRounds}
            timePerQuestion={timePerQuestion}
            maxPlayers={maxPlayers}
            hostMode={hostMode}
            maxRoundsLimit={maxRoundsLimit}
            maxPlayersLimit={maxPlayersLimit}
            upgradeHint={upgradeHint}
            roundsPercent={roundsPercent}
            timePercent={timePercent}
            playersPercent={playersPercent}
            onRoundsChange={handleRoundsChange}
            onTimeChange={setTimePerQuestion}
            onPlayersChange={handlePlayersChange}
            onHostModeChange={setHostMode}
          />
        </div>

        <GameCreateFooter
          isFlashcardSource={isFlashcardSource}
          availableCards={availableCards}
          availableJLPTQuestions={availableJLPTQuestions}
          totalRounds={totalRounds}
          loading={loading}
          canSubmit={canSubmit}
          onCancel={onCancel}
          onSubmit={handleSubmit}
        />
    </ModalShell>
  );
}
