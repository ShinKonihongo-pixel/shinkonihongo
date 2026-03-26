// Barrel re-export for hooks/settings — all public symbols from sub-modules
// Consumers can import directly: import { useSettings, AppSettings } from 'hooks/settings'

export type {
  CardBackgroundType,
  CardFrameId,
  CustomFrameSettings,
  AppBackgroundId,
  GameQuestionContent,
  GameAnswerContent,
  GameQuestionSource,
  JLPTLevelOption,
  MemorizationFilter,
  AutoAddDifficulty,
  JLPTLevelKey,
  FlashcardDifficulty,
  AICustomSettings,
  AIDifficultyId,
  QuestionSource,
  JLPTLevelQuestionConfig,
  GlobalTheme,
  AppSettings,
} from './settings-types';

export { DEFAULT_AI_CUSTOM_SETTINGS } from './settings-types';

export { DEFAULT_SETTINGS } from './settings-defaults';

export type { AppBackgroundPreset, CardFramePreset } from './settings-presets';
export {
  APP_BACKGROUND_PRESETS,
  CARD_FRAME_PRESETS,
  THEME_PRESETS,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from './settings-presets';

export { useSettings } from './use-app-settings';
export { useGlobalTheme } from './use-global-theme';
