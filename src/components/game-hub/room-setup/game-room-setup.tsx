// @refresh reset
import { useState, useMemo } from 'react';
import { GAMES } from '../../../types/game-hub';
import type { JLPTLevel } from '../../../types/flashcard';
import type { GameRoomSetupProps, GameRoomConfig } from './types';
import { useBodyScrollLock } from '../../../hooks/use-body-scroll-lock';
import { RoomHeader } from './room-header';
import { FormFields } from './form-fields';
import { RulesSection } from './rules-section';
import { RoomFooter } from './room-footer';

export function GameRoomSetup({
  gameType,
  config,
  onCreateRoom,
  onBack,
  loading = false,
  error,
  inline = false,
  getAvailableQuestionCount,
  getLessonsByLevel,
  userRole,
}: GameRoomSetupProps) {
  useBodyScrollLock();
  const gameInfo = GAMES[gameType];

  const [title, setTitle] = useState(config.titlePlaceholder || gameInfo.name);
  const [maxPlayers, setMaxPlayers] = useState(
    config.maxPlayersSlider?.defaultValue || config.maxPlayersOptions?.[2] || 10
  );
  const [timePerQuestion, setTimePerQuestion] = useState(
    config.timeSlider?.defaultValue || 15
  );
  const [totalRounds, setTotalRounds] = useState(
    config.roundsSlider?.defaultValue || 20
  );
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [selectedCategories, setSelectedCategories] = useState<(string | number)[]>(
    config.categories?.slice(0, 2).map(c => c.value) || []
  );
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    config.toggles?.forEach(t => {
      initial[t.id] = t.defaultEnabled ?? true;
    });
    return initial;
  });

  // Lesson picker state
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);

  // Game mode state (solo/team)
  const [gameMode, setGameMode] = useState(config.gameModeDefault || 'solo');
  const [teamCount, setTeamCount] = useState(config.teamCountSlider?.defaultValue || 3);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(config.maxPlayersPerTeamSlider?.defaultValue || 4);

  const roomConfig = useMemo<GameRoomConfig>(() => ({
    title: title.trim() || gameInfo.name,
    maxPlayers,
    timePerQuestion: config.showTimePerQuestion ? timePerQuestion : undefined,
    totalRounds: config.showTotalRounds ? totalRounds : undefined,
    jlptLevel: config.showJLPTLevel ? jlptLevel : undefined,
    selectedLessons: config.showLessonPicker ? selectedLessons : undefined,
    categories: config.showCategories ? selectedCategories as string[] : undefined,
    skillsEnabled: toggleStates['skills'],
    difficultyProgression: true,
    ...toggleStates,
    // Game mode fields
    ...(config.showGameMode ? {
      gameMode,
      teamCount: gameMode === 'team' ? teamCount : undefined,
      maxPlayersPerTeam: gameMode === 'team' ? maxPlayersPerTeam : undefined,
    } : {}),
  }), [
    title, maxPlayers, timePerQuestion, totalRounds,
    jlptLevel, selectedLessons, selectedCategories, toggleStates,
    config, gameInfo.name, gameMode, teamCount, maxPlayersPerTeam,
  ]);

  // Check if enough questions available for selected settings
  const requiredCount = totalRounds;
  const availableCount = getAvailableQuestionCount ? getAvailableQuestionCount(jlptLevel) : undefined;
  const hasEnoughQuestions = availableCount === undefined || availableCount >= requiredCount;

  const handleCreate = () => {
    if (!hasEnoughQuestions) return;
    onCreateRoom(roomConfig);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setToggleStates(prev => ({ ...prev, [id]: enabled }));
  };

  // Inline mode: render form content without modal wrapper
  if (inline) {
    return (
      <div className="setup-form-inline">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <FormFields
            config={config}
            title={title}
            setTitle={setTitle}
            jlptLevel={jlptLevel}
            setJlptLevel={setJlptLevel}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            maxPlayers={maxPlayers}
            setMaxPlayers={setMaxPlayers}
            totalRounds={totalRounds}
            setTotalRounds={setTotalRounds}
            timePerQuestion={timePerQuestion}
            setTimePerQuestion={setTimePerQuestion}
            toggleStates={toggleStates}
            handleToggle={handleToggle}
            selectedLessons={selectedLessons}
            setSelectedLessons={setSelectedLessons}
            getLessonsByLevel={getLessonsByLevel}
            gameInfoName={gameInfo.name}
            gameMode={gameMode}
            setGameMode={setGameMode}
            teamCount={teamCount}
            setTeamCount={setTeamCount}
            maxPlayersPerTeam={maxPlayersPerTeam}
            setMaxPlayersPerTeam={setMaxPlayersPerTeam}
            userRole={userRole}
          />

          {config.rules && <RulesSection rules={config.rules} />}
        </form>
      </div>
    );
  }

  return (
    <div className="rm-overlay" onClick={onBack}>
      <div className="rm-modal large" onClick={e => e.stopPropagation()}>
        <RoomHeader gameInfo={gameInfo} onBack={onBack} />

        <form className="rm-body" onSubmit={handleSubmit}>
          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <FormFields
            config={config}
            title={title}
            setTitle={setTitle}
            jlptLevel={jlptLevel}
            setJlptLevel={setJlptLevel}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            maxPlayers={maxPlayers}
            setMaxPlayers={setMaxPlayers}
            totalRounds={totalRounds}
            setTotalRounds={setTotalRounds}
            timePerQuestion={timePerQuestion}
            setTimePerQuestion={setTimePerQuestion}
            toggleStates={toggleStates}
            handleToggle={handleToggle}
            selectedLessons={selectedLessons}
            setSelectedLessons={setSelectedLessons}
            getLessonsByLevel={getLessonsByLevel}
            gameInfoName={gameInfo.name}
            gameMode={gameMode}
            setGameMode={setGameMode}
            teamCount={teamCount}
            setTeamCount={setTeamCount}
            maxPlayersPerTeam={maxPlayersPerTeam}
            setMaxPlayersPerTeam={setMaxPlayersPerTeam}
            userRole={userRole}
          />

          {config.rules && <RulesSection rules={config.rules} />}
        </form>

        <RoomFooter
          gameInfo={gameInfo}
          loading={loading}
          onBack={onBack}
          onSubmit={handleCreate}
          disabled={!hasEnoughQuestions}
          availableCount={availableCount}
          requiredCount={requiredCount}
        />
      </div>
    </div>
  );
}
