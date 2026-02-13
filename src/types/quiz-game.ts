// Types for multiplayer Quiz Game feature

// Power-up types available in special rounds
export type PowerUpType =
  | 'steal_points'      // Trừ điểm người chơi khác
  | 'block_player'      // Cấm người chơi ở màn tiếp theo
  | 'double_points'     // Nhân 2 điểm ở câu tiếp theo
  | 'shield'            // Bảo vệ khỏi power-up của người khác
  | 'time_freeze';      // Đóng băng thời gian cho mình

export interface PowerUp {
  type: PowerUpType;
  name: string;
  description: string;
  icon: string;
}

// Available power-ups
export const POWER_UPS: PowerUp[] = [
  { type: 'steal_points', name: 'Cướp điểm', description: 'Trừ 50 điểm của người chơi khác', icon: '💰' },
  { type: 'block_player', name: 'Phong tỏa', description: 'Cấm người chơi trả lời câu tiếp theo', icon: '🚫' },
  { type: 'double_points', name: 'Nhân đôi', description: 'Nhân 2 điểm ở câu tiếp theo', icon: '✨' },
  { type: 'shield', name: 'Lá chắn', description: 'Bảo vệ khỏi power-up của người khác', icon: '🛡️' },
  { type: 'time_freeze', name: 'Đóng băng', description: 'Thêm 5 giây cho câu tiếp theo', icon: '❄️' },
];

// Player in a game
export interface GamePlayer {
  id: string;
  name: string;
  avatar?: string; // Player avatar emoji/icon
  score: number;
  isHost: boolean;
  isBlocked: boolean;           // Bị block ở round hiện tại
  hasDoublePoints: boolean;     // Có nhân 2 điểm không
  hasShield: boolean;           // Có shield không
  hasTimeFreeze: boolean;       // Có thêm thời gian không
  currentAnswer: number | null; // Câu trả lời hiện tại (0-3)
  answerTime: number | null;    // Thời gian trả lời (ms)
  streak: number;               // Số câu đúng liên tiếp
  joinedAt: string;
}

// Question in a game round
export interface GameQuestion {
  id: string;
  flashcardId: string;
  question: string;             // Kanji hoặc vocabulary
  correctAnswer: string;        // Đáp án đúng
  options: string[];            // 4 lựa chọn (bao gồm đáp án đúng)
  correctIndex: number;         // Index của đáp án đúng
  timeLimit: number;            // Giây
  isSpecialRound: boolean;      // Round đặc biệt (có power-up)
}

// Game status
export type GameStatus =
  | 'waiting'       // Đang chờ người chơi
  | 'starting'      // Đang đếm ngược bắt đầu
  | 'question'      // Đang hiện câu hỏi
  | 'answer_reveal' // Đang hiện đáp án
  | 'power_up'      // Đang chọn power-up (special round)
  | 'leaderboard'   // Đang hiện bảng xếp hạng
  | 'finished';     // Kết thúc

// Main game session
export interface QuizGame {
  id: string;
  code: string;                 // 6-digit code để join
  hostId: string;               // ID của host
  hostName: string;
  title: string;
  status: GameStatus;
  players: Record<string, GamePlayer>;
  questions: GameQuestion[];
  currentRound: number;         // 0-indexed
  totalRounds: number;
  timePerQuestion: number;      // Giây mặc định
  roundStartTime: number | null; // Timestamp khi round bắt đầu
  createdAt: string;
  settings: GameSettings;
  // Metadata for display
  source?: GameQuestionSource;  // Nguồn câu hỏi
  jlptLevels?: string[];        // Các level JLPT đã chọn
  lessonNames?: string[];       // Tên các bài học đã chọn
}

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  showLeaderboardEvery: number; // Hiện bảng xếp hạng sau mỗi N câu
  specialRoundEvery: number;    // Round đặc biệt sau mỗi N câu
  basePoints: number;           // Điểm cơ bản cho câu đúng
  streakBonus: number;          // Bonus cho streak
  timeBonus: boolean;           // Có bonus theo thời gian không
}

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  minPlayers: 2,
  maxPlayers: 20,
  showLeaderboardEvery: 5,
  specialRoundEvery: 5,
  basePoints: 100,
  streakBonus: 10,
  timeBonus: true,
};

// Source type for game questions
export type GameQuestionSource = 'flashcards' | 'jlpt';

// Content type for questions and answers
export type GameQuestionContent = 'kanji' | 'vocabulary' | 'meaning';
export type GameAnswerContent = 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning';

// Difficulty levels for flashcard-based questions
export type GameDifficultyLevel = 'super_hard' | 'hard' | 'medium' | 'easy';

// Form data for creating a game
export interface CreateGameData {
  title: string;
  source: GameQuestionSource;   // Nguồn câu hỏi
  lessonIds: string[];          // Lessons to pick questions from (flashcards)
  lessonNames?: string[];       // Tên các bài học đã chọn (flashcards)
  difficultyLevels?: GameDifficultyLevel[]; // Mức độ khó (flashcards)
  jlptLevels?: string[];        // JLPT levels to pick from (jlpt)
  jlptCategories?: string[];    // JLPT categories to pick from (jlpt)
  totalRounds: number;          // 20-50
  timePerQuestion: number;      // 10-30 seconds
  maxPlayers?: number;          // Max players (role-based limit)
  questionContent?: GameQuestionContent;  // Nội dung câu hỏi (kanji/vocabulary/meaning)
  answerContent?: GameAnswerContent;      // Nội dung đáp án
  settings?: Partial<GameSettings>;
}

// Player answer submission
export interface PlayerAnswer {
  playerId: string;
  questionIndex: number;
  answerIndex: number;
  answerTime: number;           // ms từ khi câu hỏi hiện
}

// Power-up usage
export interface PowerUpUsage {
  usedBy: string;               // Player ID
  type: PowerUpType;
  targetPlayerId?: string;      // Cho steal_points và block_player
  round: number;
}

// Game result for a player
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

// Full game results
export interface GameResults {
  gameId: string;
  gameTitle: string;
  totalRounds: number;
  totalPlayers: number;
  rankings: PlayerResult[];
  endedAt: string;
}
