import type { GameType } from '../../../types/game-hub';
import type { JLPTLevel, Lesson } from '../../../types/flashcard';

export interface GameRoomConfig {
  title: string;
  maxPlayers: number;
  timePerQuestion?: number;
  totalRounds?: number;
  skillsEnabled?: boolean;
  jlptLevel?: JLPTLevel;
  selectedLessons?: string[];
  categories?: string[];
  difficultyProgression?: boolean;
  [key: string]: unknown;
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  labels?: string[];
}

export interface ToggleOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  defaultEnabled?: boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  color?: string;
}

export interface GameModeOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export interface GameSetupConfig {
  showTitle?: boolean;
  titlePlaceholder?: string;
  maxTitleLength?: number;
  showMaxPlayers?: boolean;
  maxPlayersOptions?: number[];
  maxPlayersSlider?: SliderConfig;
  showTimePerQuestion?: boolean;
  timeSlider?: SliderConfig;
  showTotalRounds?: boolean;
  roundsSlider?: SliderConfig;
  roundsLabel?: string;
  roundsSuffix?: string;
  showJLPTLevel?: boolean;
  showLessonPicker?: boolean;
  showCategories?: boolean;
  categories?: SelectOption[];
  multiSelectCategories?: boolean;
  toggles?: ToggleOption[];
  customSections?: React.ReactNode;
  rules?: string[];
  /** Game mode selector (e.g., solo vs team) */
  showGameMode?: boolean;
  gameModeOptions?: GameModeOption[];
  gameModeDefault?: string;
  /** Team config sliders (shown when game mode = 'team') */
  teamCountSlider?: SliderConfig;
  maxPlayersPerTeamSlider?: SliderConfig;
  /** VIP limits for team config (free users get clamped) */
  teamCountFreeMax?: number;
  maxPlayersPerTeamFreeMax?: number;
}

export interface GameRoomSetupProps {
  gameType: GameType;
  config: GameSetupConfig;
  onCreateRoom: (roomConfig: GameRoomConfig) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  /** When true, renders form content without modal overlay wrapper */
  inline?: boolean;
  /** Callback to get available question count for a given JLPT level */
  getAvailableQuestionCount?: (level: JLPTLevel) => number;
  /** Callback to get lessons for a given JLPT level */
  getLessonsByLevel?: (level: JLPTLevel) => Lesson[];
  /** User role for VIP/admin feature gating */
  userRole?: string;
}

export { JLPT_LEVELS } from '../../../constants/jlpt';
