import { useState, useMemo } from 'react';
import { GAMES } from '../../../types/game-hub';
import type { JLPTLevel } from '../../../types/flashcard';
import type { GameRoomSetupProps, GameRoomConfig } from './types';
import { RoomHeader } from './room-header';
import { FormFields } from './form-fields';
import { RulesSection } from './rules-section';
import { RoomPreview } from './room-preview';
import { RoomFooter } from './room-footer';

export function GameRoomSetup({
  gameType,
  config,
  onCreateRoom,
  onBack,
  loading = false,
  error,
}: GameRoomSetupProps) {
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

  const roomConfig = useMemo<GameRoomConfig>(() => ({
    title: title.trim() || gameInfo.name,
    maxPlayers,
    timePerQuestion: config.showTimePerQuestion ? timePerQuestion : undefined,
    totalRounds: config.showTotalRounds ? totalRounds : undefined,
    jlptLevel: config.showJLPTLevel ? jlptLevel : undefined,
    categories: config.showCategories ? selectedCategories as string[] : undefined,
    skillsEnabled: toggleStates['skills'],
    difficultyProgression: toggleStates['difficulty'],
    ...toggleStates,
  }), [
    title, maxPlayers, timePerQuestion, totalRounds,
    jlptLevel, selectedCategories, toggleStates,
    config, gameInfo.name
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(roomConfig);
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setToggleStates(prev => ({ ...prev, [id]: enabled }));
  };

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
            gameInfoName={gameInfo.name}
          />

          {config.rules && <RulesSection rules={config.rules} />}

          <RoomPreview
            gameInfo={gameInfo}
            config={config}
            title={title}
            maxPlayers={maxPlayers}
            totalRounds={totalRounds}
            timePerQuestion={timePerQuestion}
            jlptLevel={jlptLevel}
            skillsEnabled={toggleStates['skills']}
          />
        </form>

        <RoomFooter
          gameInfo={gameInfo}
          loading={loading}
          onBack={onBack}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
