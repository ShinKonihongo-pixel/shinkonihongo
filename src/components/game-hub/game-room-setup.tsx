// Re-export from refactored modules for backward compatibility
export {
  GameRoomSetup,
  BINGO_SETUP_CONFIG,
  SPEED_QUIZ_SETUP_CONFIG,
  GOLDEN_BELL_SETUP_CONFIG,
  PICTURE_GUESS_SETUP_CONFIG,
  WORD_MATCH_SETUP_CONFIG,
} from './room-setup';

export type {
  GameRoomConfig,
  GameSetupConfig,
  GameRoomSetupProps,
} from './room-setup';
