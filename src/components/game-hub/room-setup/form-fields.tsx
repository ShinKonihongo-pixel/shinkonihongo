import {
  Settings,
  Users,
  Clock,
  HelpCircle,
  Layers,
} from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { GameSetupConfig } from './types';
import { JLPT_LEVELS } from './types';
import { SliderInput } from './slider-input';
import { SelectButtons } from './select-buttons';
import { ToggleSwitch } from './toggle-switch';

interface FormFieldsProps {
  config: GameSetupConfig;
  title: string;
  setTitle: (value: string) => void;
  jlptLevel: JLPTLevel;
  setJlptLevel: (value: JLPTLevel) => void;
  selectedCategories: (string | number)[];
  setSelectedCategories: (value: (string | number)[]) => void;
  maxPlayers: number;
  setMaxPlayers: (value: number) => void;
  totalRounds: number;
  setTotalRounds: (value: number) => void;
  timePerQuestion: number;
  setTimePerQuestion: (value: number) => void;
  toggleStates: Record<string, boolean>;
  handleToggle: (id: string, enabled: boolean) => void;
  gameInfoName: string;
}

export function FormFields({
  config,
  title,
  setTitle,
  jlptLevel,
  setJlptLevel,
  selectedCategories,
  setSelectedCategories,
  maxPlayers,
  setMaxPlayers,
  totalRounds,
  setTotalRounds,
  timePerQuestion,
  setTimePerQuestion,
  toggleStates,
  handleToggle,
  gameInfoName,
}: FormFieldsProps) {
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
          suffix=" câu"
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
