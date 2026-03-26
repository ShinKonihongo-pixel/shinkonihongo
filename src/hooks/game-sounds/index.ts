// Game sounds module barrel re-export
// Types, configs, hook, and context provider

export type {
  SoundEffectType,
  MusicCategory,
  MusicTrack,
  CustomSoundEffect,
  GameSoundSettings,
  MusicPattern,
} from './sound-configs';

export {
  MUSIC_CATEGORY_LABELS,
  MUSIC_TRACKS,
  SOUND_CONFIGS,
  MUSIC_PATTERNS,
  STORAGE_KEY,
  DEFAULT_SETTINGS,
} from './sound-configs';

export { createBackgroundMusic } from './music-generator';

export {
  useGameSounds,
  type UseGameSoundsReturn,
  GameSoundsProvider,
  useGameSoundsContext,
} from './use-game-sounds-hook';
