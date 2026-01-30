// Unified Game Room Setup - Professional UI with Glass Morphism Dark Theme
// Features: Clean design, game-specific config, live preview, responsive layout

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  Clock,
  HelpCircle,
  Sparkles,
  Play,
  Settings,
  Layers,
  Zap,
  Eye,
  ChevronDown,
  X,
} from 'lucide-react';
import type { GameType, GameInfo } from '../../types/game-hub';
import { GAMES } from '../../types/game-hub';
import type { JLPTLevel } from '../../types/flashcard';

// ============ TYPES ============

export interface GameRoomConfig {
  title: string;
  maxPlayers: number;
  timePerQuestion?: number;
  totalRounds?: number;
  skillsEnabled?: boolean;
  jlptLevel?: JLPTLevel;
  categories?: string[];
  difficultyProgression?: boolean;
  // Game-specific extras
  [key: string]: unknown;
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  labels?: string[];
}

interface ToggleOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  defaultEnabled?: boolean;
}

interface SelectOption {
  value: string | number;
  label: string;
  color?: string;
}

export interface GameSetupConfig {
  // Basic settings
  showTitle?: boolean;
  titlePlaceholder?: string;
  maxTitleLength?: number;

  // Players
  showMaxPlayers?: boolean;
  maxPlayersOptions?: number[];
  maxPlayersSlider?: SliderConfig;

  // Time
  showTimePerQuestion?: boolean;
  timeSlider?: SliderConfig;

  // Rounds/Questions
  showTotalRounds?: boolean;
  roundsSlider?: SliderConfig;
  roundsLabel?: string;

  // JLPT Level
  showJLPTLevel?: boolean;

  // Categories/Types
  showCategories?: boolean;
  categories?: SelectOption[];
  multiSelectCategories?: boolean;

  // Toggles
  toggles?: ToggleOption[];

  // Custom sections
  customSections?: React.ReactNode;

  // Rules preview
  rules?: string[];
}

interface GameRoomSetupProps {
  gameType: GameType;
  config: GameSetupConfig;
  onCreateRoom: (roomConfig: GameRoomConfig) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

// ============ DEFAULT CONFIGS ============

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// ============ SUB COMPONENTS ============

// Slider Input with labels
function SliderInput({
  value,
  onChange,
  config,
  label,
  icon,
  suffix = '',
}: {
  value: number;
  onChange: (v: number) => void;
  config: SliderConfig;
  label: string;
  icon?: React.ReactNode;
  suffix?: string;
}) {
  const percent = ((value - config.min) / (config.max - config.min)) * 100;

  return (
    <div className="rm-field">
      <label className="rm-label">
        {icon}
        <span>{label}</span>
        <span className="rm-label-hint">
          <span className="rm-label-value">{value}{suffix}</span>
        </span>
      </label>
      <div className="rm-slider-wrap">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rm-slider"
          style={{ '--progress': `${percent}%` } as React.CSSProperties}
        />
        {config.labels && (
          <div className="rm-slider-labels">
            {config.labels.map((lbl, i) => (
              <span key={i}>{lbl}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Toggle Switch
function ToggleSwitch({
  option,
  enabled,
  onChange,
}: {
  option: ToggleOption;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="rm-toggle-row">
      <div className="rm-toggle-info">
        {option.icon && <span className="rm-toggle-icon">{option.icon}</span>}
        <div className="rm-toggle-text">
          <span className="rm-toggle-label">{option.label}</span>
          {option.description && (
            <span className="rm-toggle-desc">{option.description}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className={`rm-toggle-btn ${enabled ? 'active' : ''}`}
        onClick={() => onChange(!enabled)}
      />
    </div>
  );
}

// Select Buttons (Pills)
function SelectButtons({
  options,
  selected,
  onChange,
  multiSelect = false,
  size = 'medium',
}: {
  options: SelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  multiSelect?: boolean;
  size?: 'small' | 'medium' | 'large';
}) {
  const handleClick = (value: string | number) => {
    if (multiSelect) {
      if (selected.includes(value)) {
        if (selected.length > 1) {
          onChange(selected.filter(s => s !== value));
        }
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange([value]);
    }
  };

  const sizeClass = size === 'small' ? 'sm' : size === 'large' ? 'lg' : '';

  return (
    <div className="rm-pills">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`rm-pill ${sizeClass} ${selected.includes(opt.value) ? 'active' : ''}`}
          onClick={() => handleClick(opt.value)}
          data-level={typeof opt.value === 'string' && opt.value.startsWith('N') ? opt.value : undefined}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export function GameRoomSetup({
  gameType,
  config,
  onCreateRoom,
  onBack,
  loading = false,
  error,
}: GameRoomSetupProps) {
  const gameInfo: GameInfo = GAMES[gameType];

  // Form state
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

  const [showRules, setShowRules] = useState(false);

  // Build room config
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
        {/* Header */}
        <header className="rm-header">
          <div className="rm-header-gradient" style={{ background: gameInfo.gradient }} />
          <button className="rm-back-btn" onClick={onBack} type="button">
            <ArrowLeft size={20} />
          </button>
          <div className="rm-header-icon" style={{ background: gameInfo.gradient }}>
            {gameInfo.iconImage ? (
              <img src={gameInfo.iconImage} alt={gameInfo.name} />
            ) : (
              <span>{gameInfo.icon}</span>
            )}
          </div>
          <div className="rm-header-content">
            <h1 className="rm-title">Tạo Phòng Chơi</h1>
            <span className="rm-subtitle">{gameInfo.name}</span>
          </div>
          <button className="rm-close-btn" onClick={onBack} type="button">
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <form className="rm-body" onSubmit={handleSubmit}>
          {/* Error Message */}
          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Room Title */}
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
                placeholder={config.titlePlaceholder || `Phòng ${gameInfo.name}`}
                maxLength={config.maxTitleLength || 40}
              />
            </div>
          )}

          {/* JLPT Level */}
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

          {/* Categories */}
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

          {/* Max Players - Button Options */}
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

          {/* Max Players - Slider */}
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

          {/* Total Rounds / Questions */}
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

          {/* Time Per Question */}
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

          {/* Toggle Options */}
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

          {/* Custom Sections */}
          {config.customSections}

          {/* Rules Toggle */}
          {config.rules && config.rules.length > 0 && (
            <>
              <button
                type="button"
                className={`rm-rules-toggle ${showRules ? 'open' : ''}`}
                onClick={() => setShowRules(!showRules)}
              >
                <Eye size={16} />
                <span>Xem trước luật chơi</span>
                <ChevronDown size={16} />
              </button>

              {showRules && (
                <div className="rm-rules">
                  <h4 className="rm-rules-title">Luật chơi</h4>
                  <ul className="rm-rules-list">
                    {config.rules.map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Preview Card */}
          <div className="rm-preview">
            <div className="rm-preview-header">
              <span className="rm-preview-icon" style={{ background: gameInfo.gradient }}>
                {gameInfo.icon}
              </span>
              <div className="rm-preview-title">
                <span className="rm-preview-name">{title || gameInfo.name}</span>
                <span className="rm-preview-game">{gameInfo.name}</span>
              </div>
            </div>
            <div className="rm-preview-stats">
              <div className="rm-preview-stat">
                <Users size={14} />
                <span>{maxPlayers} người</span>
              </div>
              {config.showTotalRounds && (
                <div className="rm-preview-stat">
                  <HelpCircle size={14} />
                  <span>{totalRounds} câu</span>
                </div>
              )}
              {config.showTimePerQuestion && (
                <div className="rm-preview-stat">
                  <Clock size={14} />
                  <span>{timePerQuestion}s/câu</span>
                </div>
              )}
              {config.showJLPTLevel && (
                <div className="rm-preview-stat">
                  <Layers size={14} />
                  <span>{jlptLevel}</span>
                </div>
              )}
              {toggleStates['skills'] && (
                <div className="rm-preview-stat highlight">
                  <Sparkles size={14} />
                  <span>Kỹ năng</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <footer className="rm-footer">
          <button
            type="button"
            className="rm-btn rm-btn-ghost"
            onClick={onBack}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="rm-btn rm-btn-primary rm-btn-lg"
            disabled={loading}
            onClick={handleSubmit}
            style={{ background: gameInfo.gradient }}
          >
            {loading ? (
              <>
                <span className="rm-spinner" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Play size={20} fill="white" />
                <span>Tạo Phòng</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ============ PRE-CONFIGURED SETUPS ============

// Bingo Game Setup Config
export const BINGO_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Bingo Vui Vẻ',
  showMaxPlayers: true,
  maxPlayersOptions: [4, 6, 8, 10, 15, 20],
  toggles: [
    {
      id: 'skills',
      label: 'Kỹ năng đặc biệt',
      description: 'Mở khóa kỹ năng sau mỗi 5 lượt',
      icon: <Sparkles size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '🎯 Mỗi người chơi có 6 dãy, mỗi dãy 5 số (1-99)',
    '🎰 Bốc số ngẫu nhiên, đánh dấu số trùng',
    '🏆 Ai có đủ 5 số trong một dãy nhấn BINGO trước thắng!',
  ],
};

// Speed Quiz Setup Config
export const SPEED_QUIZ_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Speed Quiz',
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 20,
    step: 1,
    defaultValue: 10,
    labels: ['2', '10', '20'],
  },
  showTotalRounds: true,
  roundsSlider: {
    min: 5,
    max: 30,
    step: 5,
    defaultValue: 15,
    labels: ['5', '15', '30'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 5,
    max: 20,
    step: 5,
    defaultValue: 10,
    labels: ['5s', '10s', '20s'],
  },
  toggles: [
    {
      id: 'skills',
      label: 'Kỹ năng đặc biệt',
      description: 'Mở khóa kỹ năng mỗi 5 câu',
      icon: <Zap size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '⚡ Gõ đáp án nhanh nhất để ghi điểm',
    '💡 Có 3 lượt gợi ý miễn phí',
    '🏆 Người có điểm cao nhất thắng',
  ],
};

// Golden Bell Setup Config
export const GOLDEN_BELL_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Rung Chuông Vàng',
  showJLPTLevel: true,
  showCategories: true,
  multiSelectCategories: true,
  categories: [
    { value: 'vocabulary', label: '📝 Từ vựng' },
    { value: 'kanji', label: '漢 Kanji' },
    { value: 'grammar', label: '📖 Ngữ pháp' },
    { value: 'culture', label: '🎌 Văn hóa' },
  ],
  showTotalRounds: true,
  roundsSlider: {
    min: 10,
    max: 50,
    step: 5,
    defaultValue: 20,
    labels: ['10', '30', '50'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 10,
    max: 30,
    step: 5,
    defaultValue: 15,
    labels: ['10s', '20s', '30s'],
  },
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 10,
    max: 100,
    step: 10,
    defaultValue: 20,
    labels: ['10', '50', '100'],
  },
  toggles: [
    {
      id: 'difficulty',
      label: 'Tăng độ khó dần',
      description: 'Câu hỏi sẽ khó hơn theo thời gian',
      icon: <Layers size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '🔔 Trả lời sai = Bị loại',
    '🏆 Người cuối cùng sống sót chiến thắng',
    '⏱️ Hết giờ = Tính như sai',
  ],
};

// Picture Guess Setup Config
export const PICTURE_GUESS_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Đuổi Hình Bắt Chữ',
  showJLPTLevel: true,
  showTotalRounds: true,
  roundsLabel: 'Số câu đố',
  roundsSlider: {
    min: 5,
    max: 30,
    step: 5,
    defaultValue: 15,
    labels: ['5', '15', '30'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 10,
    max: 60,
    step: 10,
    defaultValue: 30,
    labels: ['10s', '30s', '60s'],
  },
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 20,
    step: 1,
    defaultValue: 10,
    labels: ['2', '10', '20'],
  },
  toggles: [
    {
      id: 'hints',
      label: 'Cho phép gợi ý',
      description: 'Người chơi có thể xin gợi ý',
      icon: <HelpCircle size={18} />,
      defaultEnabled: true,
    },
    {
      id: 'speedBonus',
      label: 'Điểm tốc độ',
      description: 'Trả lời nhanh được thêm điểm',
      icon: <Zap size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '🖼️ Xem emoji đoán từ tiếng Nhật',
    '💡 Có thể dùng gợi ý (mất điểm)',
    '⚡ Trả lời nhanh = Điểm cao hơn',
  ],
};

// Word Match Setup Config
export const WORD_MATCH_SETUP_CONFIG: GameSetupConfig = {
  showTitle: true,
  titlePlaceholder: 'Nối Từ Thách Đấu',
  showJLPTLevel: true,
  showTotalRounds: true,
  roundsLabel: 'Số vòng',
  roundsSlider: {
    min: 5,
    max: 20,
    step: 5,
    defaultValue: 10,
    labels: ['5', '10', '20'],
  },
  showTimePerQuestion: true,
  timeSlider: {
    min: 30,
    max: 90,
    step: 15,
    defaultValue: 60,
    labels: ['30s', '60s', '90s'],
  },
  showMaxPlayers: true,
  maxPlayersSlider: {
    min: 2,
    max: 10,
    step: 1,
    defaultValue: 4,
    labels: ['2', '5', '10'],
  },
  toggles: [
    {
      id: 'luckyWheel',
      label: 'Vòng quay may mắn',
      description: 'Quay số ngẫu nhiên mỗi vòng',
      icon: <Sparkles size={18} />,
      defaultEnabled: true,
    },
  ],
  rules: [
    '🔗 Nối 5 cặp từ mỗi vòng',
    '⏱️ Nối nhanh = Điểm cao',
    '🎯 Nối sai bị trừ điểm',
  ],
};
