import {
  Settings,
  Users,
  Clock,
  HelpCircle,
  Layers,
  BookOpen,
} from 'lucide-react';
import type { JLPTLevel, Lesson } from '../../../types/flashcard';
import type { GameSetupConfig } from './types';
import { JLPT_LEVELS } from './types';
import { SliderInput } from './slider-input';
import { SelectButtons } from './select-buttons';
import { ToggleSwitch } from './toggle-switch';
import { GameModeSection } from './game-mode-section';

interface FormFieldsProps {
  config: GameSetupConfig;
  title: string;
  setTitle: (value: string) => void;
  jlptLevel: JLPTLevel;
  setJlptLevel: (value: JLPTLevel) => void;
  selectedCategories: (string | number)[];
  setSelectedCategories: (value: (string | number)[]) => void;
  selectedLessons?: string[];
  setSelectedLessons?: (value: string[]) => void;
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  maxPlayers: number;
  setMaxPlayers: (value: number) => void;
  totalRounds: number;
  setTotalRounds: (value: number) => void;
  timePerQuestion: number;
  setTimePerQuestion: (value: number) => void;
  toggleStates: Record<string, boolean>;
  handleToggle: (id: string, enabled: boolean) => void;
  gameInfoName: string;
  gameMode: string;
  setGameMode: (value: string) => void;
  teamCount: number;
  setTeamCount: (value: number) => void;
  maxPlayersPerTeam: number;
  setMaxPlayersPerTeam: (value: number) => void;
  userRole?: string;
}

export function FormFields({
  config,
  title,
  setTitle,
  jlptLevel,
  setJlptLevel,
  selectedCategories,
  setSelectedCategories,
  selectedLessons = [],
  setSelectedLessons,
  getLessonsByLevel,
  maxPlayers,
  setMaxPlayers,
  totalRounds,
  setTotalRounds,
  timePerQuestion,
  setTimePerQuestion,
  toggleStates,
  handleToggle,
  gameInfoName,
  gameMode,
  setGameMode,
  teamCount,
  setTeamCount,
  maxPlayersPerTeam,
  setMaxPlayersPerTeam,
  userRole,
}: FormFieldsProps) {
  const lessons = config.showLessonPicker && getLessonsByLevel
    ? getLessonsByLevel(jlptLevel)
    : [];

  const toggleLesson = (lessonId: string) => {
    if (!setSelectedLessons) return;
    setSelectedLessons(
      selectedLessons.includes(lessonId)
        ? selectedLessons.filter(id => id !== lessonId)
        : [...selectedLessons, lessonId]
    );
  };
  return (
    <>
      {config.showTitle !== false && (
        <div className="rm-field">
          <label className="rm-label">
            <Settings size={16} />
            <span>Tên phòng</span>
          </label>
          <input
            type="text"
            className="rm-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={config.titlePlaceholder || `Phòng ${gameInfoName}`}
            maxLength={config.maxTitleLength || 40}
          />
        </div>
      )}

      {/* Game Mode Selector — only renders for configs with showGameMode */}
      {config.showGameMode && config.gameModeOptions && (
        <GameModeSection
          config={config}
          gameMode={gameMode}
          setGameMode={setGameMode}
          teamCount={teamCount}
          setTeamCount={setTeamCount}
          maxPlayersPerTeam={maxPlayersPerTeam}
          setMaxPlayersPerTeam={setMaxPlayersPerTeam}
          userRole={userRole}
        />
      )}

      {config.showJLPTLevel && (
        <div className="rm-field">
          <label className="rm-label">
            <Layers size={16} />
            <span>Cấp độ JLPT</span>
          </label>
          <SelectButtons
            options={JLPT_LEVELS.map(lvl => ({
              value: lvl,
              label: lvl,
            }))}
            selected={[jlptLevel]}
            onChange={(sel) => setJlptLevel(sel[0] as JLPTLevel)}
            size="medium"
          />
        </div>
      )}

      {config.showLessonPicker && getLessonsByLevel && lessons.length > 0 && (
        <div className="rm-field">
          <label className="rm-label">
            <BookOpen size={16} />
            <span>Chọn bài học {selectedLessons.length > 0 ? `(${selectedLessons.length})` : '(Tất cả)'}</span>
          </label>
          <div className="rm-lesson-list">
            {lessons.map(lesson => (
              <button
                key={lesson.id}
                type="button"
                className={`rm-pill ${selectedLessons.includes(lesson.id) ? 'active' : ''}`}
                onClick={() => toggleLesson(lesson.id)}
              >
                {lesson.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {config.showCategories && config.categories && (
        <div className="rm-field">
          <label className="rm-label">
            <HelpCircle size={16} />
            <span>Loại câu hỏi</span>
          </label>
          <SelectButtons
            options={config.categories}
            selected={selectedCategories}
            onChange={setSelectedCategories}
            multiSelect={config.multiSelectCategories}
            size="small"
          />
        </div>
      )}

      {config.showMaxPlayers && config.maxPlayersOptions && (
        <div className="rm-field">
          <label className="rm-label">
            <Users size={16} />
            <span>Số người chơi tối đa</span>
          </label>
          <SelectButtons
            options={config.maxPlayersOptions.map(n => ({ value: n, label: `${n}` }))}
            selected={[maxPlayers]}
            onChange={(sel) => setMaxPlayers(sel[0] as number)}
            size="medium"
          />
        </div>
      )}

      {config.showMaxPlayers && config.maxPlayersSlider && !config.maxPlayersOptions && (
        <SliderInput
          value={maxPlayers}
          onChange={setMaxPlayers}
          config={config.maxPlayersSlider}
          label="Số người chơi tối đa"
          icon={<Users size={16} />}
          suffix=" người"
        />
      )}

      {config.showTotalRounds && config.roundsSlider && (
        <SliderInput
          value={totalRounds}
          onChange={setTotalRounds}
          config={config.roundsSlider}
          label={config.roundsLabel || 'Số câu hỏi'}
          icon={<HelpCircle size={16} />}
          suffix={config.roundsSuffix || ' câu'}
        />
      )}

      {config.showTimePerQuestion && config.timeSlider && (
        <SliderInput
          value={timePerQuestion}
          onChange={setTimePerQuestion}
          config={config.timeSlider}
          label="Thời gian mỗi câu"
          icon={<Clock size={16} />}
          suffix="s"
        />
      )}

      {config.toggles && config.toggles.length > 0 && (
        <div className="rm-toggles">
          {config.toggles.map((toggle) => (
            <ToggleSwitch
              key={toggle.id}
              option={toggle}
              enabled={toggleStates[toggle.id] ?? true}
              onChange={(enabled) => handleToggle(toggle.id, enabled)}
            />
          ))}
        </div>
      )}

      {config.customSections}
    </>
  );
}
