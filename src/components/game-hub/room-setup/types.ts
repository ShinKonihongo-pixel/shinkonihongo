import type { GameType } from '../../../types/game-hub';
import type { JLPTLevel } from '../../../types/flashcard';

export interface GameRoomConfig {
  title: string;
  maxPlayers: number;
  timePerQuestion?: number;
  totalRounds?: number;
  skillsEnabled?: boolean;
  jlptLevel?: JLPTLevel;
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
  showJLPTLevel?: boolean;
  showCategories?: boolean;
  categories?: SelectOption[];
  multiSelectCategories?: boolean;
  toggles?: ToggleOption[];
  customSections?: React.ReactNode;
  rules?: string[];
}

export interface GameRoomSetupProps {
  gameType: GameType;
  config: GameSetupConfig;
  onCreateRoom: (roomConfig: GameRoomConfig) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];
