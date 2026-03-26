// Types for multiplayer Quiz Game feature

/** Power-up types a player can earn and use during special rounds. */
export type PowerUpType =
  | 'steal_points'      // Deduct points from another player
  | 'block_player'      // Prevent a player from answering the next question
  | 'double_points'     // Double the points earned on the next correct answer
  | 'shield'            // Negate the next incoming power-up from another player
  | 'time_freeze';      // Pause the countdown timer for yourself on the next question

export interface PowerUp {
  type: PowerUpType;
  name: string;
  description: string;
  icon: string;
}

// Registry of all available power-ups shown in the power-up selection UI
export const POWER_UPS: PowerUp[] = [
  { type: 'steal_points', name: 'Cướp điểm', description: 'Trừ 50 điểm của người chơi khác', icon: '💰' },
  { type: 'block_player', name: 'Phong tỏa', description: 'Cấm người chơi trả lời câu tiếp theo', icon: '🚫' },
  { type: 'double_points', name: 'Nhân đôi', description: 'Nhân 2 điểm ở câu tiếp theo', icon: '✨' },
  { type: 'shield', name: 'Lá chắn', description: 'Bảo vệ khỏi power-up của người khác', icon: '🛡️' },
  { type: 'time_freeze', name: 'Đóng băng', description: 'Thêm 5 giây cho câu tiếp theo', icon: '❄️' },
];

/** Represents one participant in an active game session. */
export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string;          // Emoji or icon chosen by the player
  role?: string;            // User role (e.g. 'admin', 'vip') — used for lobby styling
  isSpectator?: boolean;    // Host watching the game without competing
  isBot?: boolean;          // True for AI-controlled bot players
  score: number;
  isHost: boolean;
  isBlocked: boolean;       // True when a block_player power-up prevents answering this round
  hasDoublePoints: boolean; // True when double_points power-up is active for the next round
  hasShield: boolean;       // True when shield power-up will absorb the next incoming attack
  hasTimeFreeze: boolean;   // True when time_freeze power-up gives extra time next round
  currentAnswer: number | null; // Selected option index (0–3), null if unanswered
  answerTime: number | null;    // Milliseconds elapsed from question display to answer submission
  streak: number;           // Consecutive correct answers — feeds into streak bonus
  joinedAt: string;
}

/** A single question shown during one round of the game. */
export interface GameQuestion {
  id: string;
  flashcardId: string;      // Source flashcard or JLPT question ID (used for result tracking)
  question: string;         // The displayed question text (kanji, vocabulary, or JLPT sentence)
  correctAnswer: string;    // The text of the correct answer option
  options: string[];        // All 4 answer options in shuffled order
  correctIndex: number;     // Index of correctAnswer within options[]
  timeLimit: number;        // Seconds players have to answer
  isSpecialRound: boolean;  // When true, players choose a power-up after the reveal
}

/**
 * Lifecycle states of a game session.
 * Flow: waiting → starting → (question → answer_reveal → [power_up →] [leaderboard →])* → finished
 */
export type GameStatus =
  | 'waiting'       // Lobby open, players joining
  | 'starting'      // Countdown before first question
  | 'question'      // Question is visible, timer running
  | 'answer_reveal' // Correct answer displayed, scores updated
  | 'power_up'      // Special round: players select a power-up to use
  | 'leaderboard'   // Intermediate leaderboard displayed between rounds
  | 'finished';     // Game over, final results visible

/** Full game session document stored in Firestore. */
export interface QuizGame {
  id: string;
  code: string;                  // Short uppercase join code shown in the lobby (e.g. "AB12CD")
  hostId: string;
  hostName: string;
  title: string;
  status: GameStatus;
  players: Record<string, GamePlayer>; // Keyed by player ID for O(1) field updates in Firestore
  questions: GameQuestion[];
  currentRound: number;          // 0-indexed; increments after each answer_reveal
  totalRounds: number;           // Equals questions.length after creation
  timePerQuestion: number;       // Default seconds per question (individual questions may override)
  roundStartTime: number | null; // Unix ms timestamp set by host when a question begins
  createdAt: string;
  settings: GameSettings;
  // Display metadata shown in the lobby — not used for game logic
  source?: GameQuestionSource;
  jlptLevels?: string[];         // Which JLPT levels were included (jlpt source only)
  lessonNames?: string[];        // Human-readable lesson names (vocabulary/kanji source)
  hostMessage?: string;          // Optional announcement pinned in the lobby (max 50 chars)
}

/** Tunable parameters that affect scoring and pacing, with safe defaults. */
export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  showLeaderboardEvery: number; // Display the leaderboard after every N rounds
  specialRoundEvery: number;    // Trigger a power-up round every N rounds
  basePoints: number;           // Points awarded for a correct answer before bonuses
  streakBonus: number;          // Extra points added per consecutive correct answer in a streak
  timeBonus: boolean;           // When true, faster answers earn proportionally more points
}

// Default game settings used when the host does not override specific fields
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  minPlayers: 2,
  maxPlayers: 20,
  showLeaderboardEvery: 5,
  specialRoundEvery: 5,
  basePoints: 100,
  streakBonus: 10,
  timeBonus: true,
};

/**
 * Determines which question bank and answer format the game uses:
 * - `vocabulary`: flashcard-based; question shows kanji/vocab, answers are Vietnamese meanings
 * - `kanji`:      flashcard-based; question shows kanji only, answers are hiragana readings
 *                 Distractors are chosen from similar-sounding readings to maximise difficulty.
 * - `flashcards`: legacy alias for `vocabulary` (kept for backward compatibility)
 * - `jlpt`:       draws from the JLPT question bank; uses pre-authored answer options
 */
export type GameQuestionSource = 'vocabulary' | 'kanji' | 'jlpt' | 'flashcards';

/** What text is displayed as the question prompt. */
export type GameQuestionContent = 'kanji' | 'vocabulary' | 'meaning';

/**
 * What text is used as answer options.
 * `vocabulary_meaning` concatenates both fields (e.g. "さくら - cherry blossom")
 * to make distractors harder to dismiss by meaning alone.
 */
export type GameAnswerContent = 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning';

/** Card difficulty levels, mirroring the flashcard difficulty system. */
export type GameDifficultyLevel = 'super_hard' | 'hard' | 'medium' | 'easy';

/**
 * Percentage breakdown of card difficulties for one game difficulty tier.
 * Values are relative weights, not strict percentages — they are normalised in filterByDifficultyMix.
 */
export type DifficultyMixRow = { super_hard: number; hard: number; medium: number; easy: number };

/** Maps each game difficulty tier to its card difficulty breakdown. */
export type DifficultyMixConfig = Record<GameDifficultyLevel, DifficultyMixRow>;

/** Whether the host participates as a player or only observes. */
export type HostMode = 'play' | 'spectate';

/**
 * Payload submitted by the host UI when creating a new game.
 * Fields are source-specific: JLPT fields are ignored for flashcard sources and vice versa.
 */
export interface CreateGameData {
  title: string;
  /** Which question bank to draw from — determines the entire question generation path. */
  source: GameQuestionSource;
  /** Controls whether the host competes or just watches. Only relevant for super-admin accounts. */
  hostMode?: HostMode;
  /** IDs of lessons whose flashcards will be used (vocabulary/kanji sources only). */
  lessonIds: string[];
  /** Human-readable lesson names stored on the game document for lobby display. */
  lessonNames?: string[];
  /** Selected difficulty tier(s); only the first element is used for mix calculations. */
  difficultyLevels?: GameDifficultyLevel[];
  /** Per-tier card difficulty ratios loaded from app settings. */
  difficultyMix?: DifficultyMixConfig;
  /** Which JLPT levels to include (jlpt source only). */
  jlptLevels?: string[];
  /** Which JLPT question categories to include (jlpt source only). */
  jlptCategories?: string[];
  /** Number of rounds (questions) in the game, typically 20–50. */
  totalRounds: number;
  /** Seconds allowed per question, typically 10–30. */
  timePerQuestion: number;
  /** Hard cap on players; enforced by role-based limits in the UI. */
  maxPlayers?: number;
  /** What to display as the question text (vocabulary/kanji sources). */
  questionContent?: GameQuestionContent;
  /** What to display as the answer options (vocabulary/kanji sources). */
  answerContent?: GameAnswerContent;
  /** Overrides for specific GameSettings fields; unset fields use defaults. */
  settings?: Partial<GameSettings>;
}

/** A player's answer submission for one round. */
export interface PlayerAnswer {
  playerId: string;
  questionIndex: number;
  answerIndex: number;
  answerTime: number; // Milliseconds from question display to submission
}

/** Records how a power-up was used in a given round. */
export interface PowerUpUsage {
  usedBy: string;              // Player ID of the power-up activator
  type: PowerUpType;
  targetPlayerId?: string;     // Required for steal_points and block_player
  round: number;
}

/** Final statistics for one player at the end of a game. */
export interface PlayerResult {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  longestStreak: number;
  powerUpsUsed: number;
}

/** Aggregated results for the entire game, persisted after the game ends. */
export interface GameResults {
  gameId: string;
  gameTitle: string;
  totalRounds: number;
  totalPlayers: number;
  rankings: PlayerResult[];
  endedAt: string;
}
