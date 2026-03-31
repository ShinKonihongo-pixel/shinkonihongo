// Kanji Battle Types - "Đại Chiến Kanji" game
// Read kanji (type reading/meaning) or Write kanji (draw by stroke order)

// Game modes
export type KanjiBattleMode = 'read' | 'write';

// Game status
export type KanjiBattleStatus =
  | 'waiting'      // Waiting for players
  | 'starting'     // Countdown
  | 'playing'      // Question active
  | 'result'       // Show round result
  | 'skill_phase'  // Skill selection (every 5 rounds)
  | 'finished';    // Game over

// Special skill types (same as before)
export type KanjiBattleSkillType =
  | 'double_points'    // 2x points for 2 turns
  | 'steal_points'     // Steal 50 points from opponent
  | 'shield'           // No penalty for 2 turns
  | 'extra_hint'       // +2 hints
  | 'slow_others'      // Opponents delayed 2s
  | 'reveal_first';    // Reveal first character free

export interface KanjiBattleSkill {
  type: KanjiBattleSkillType;
  name: string;
  description: string;
  emoji: string;
  targetOther: boolean;
}

export const KANJI_BATTLE_SKILLS: Record<KanjiBattleSkillType, KanjiBattleSkill> = {
  double_points: {
    type: 'double_points',
    name: 'Điểm Đôi',
    description: '2x điểm trong 2 lượt tiếp theo',
    emoji: '✨',
    targetOther: false,
  },
  steal_points: {
    type: 'steal_points',
    name: 'Cướp Điểm',
    description: 'Lấy 50 điểm từ đối thủ',
    emoji: '💰',
    targetOther: true,
  },
  shield: {
    type: 'shield',
    name: 'Khiên Bảo Vệ',
    description: 'Không bị trừ điểm trong 2 lượt',
    emoji: '🛡️',
    targetOther: false,
  },
  extra_hint: {
    type: 'extra_hint',
    name: 'Gợi Ý Thêm',
    description: '+2 lượt gợi ý',
    emoji: '💡',
    targetOther: false,
  },
  slow_others: {
    type: 'slow_others',
    name: 'Làm Chậm',
    description: 'Đối thủ bị delay 2 giây',
    emoji: '🐌',
    targetOther: true,
  },
  reveal_first: {
    type: 'reveal_first',
    name: 'Tiết Lộ',
    description: 'Hiện chữ cái đầu miễn phí',
    emoji: '👁️',
    targetOther: false,
  },
};

// Stroke data for drawing
export interface StrokeData {
  points: { x: number; y: number }[];
  timestamp: number;
}

// Stroke match result
export interface StrokeMatchResult {
  strokeIndex: number;
  isCorrect: boolean;
  accuracy: number;       // 0-100
  directionMatch: boolean;
  orderCorrect: boolean;
}

// Question structure
export interface KanjiBattleQuestion {
  id: string;
  kanjiCharacter: string;
  onYomi: string[];
  kunYomi: string[];
  sinoVietnamese: string;
  meaning: string;
  sampleWords: { word: string; reading: string; meaning: string }[];
  acceptedAnswers: string[];  // All valid answers (meaning, SV, on, kun)
  strokeCount: number;
  strokePaths?: string[];     // SVG paths from KanjiVG
  points: number;
  penalty: number;
  timeLimit: number;
  hints: string[];
}

// Player in game
export interface KanjiBattlePlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  hintsUsed: number;
  hintsRemaining: number;
  currentAnswer?: string;
  answerTime?: number;
  isCorrect?: boolean;
  hasAnswered: boolean;
  hasShield: boolean;
  shieldTurns: number;
  hasDoublePoints: boolean;
  doublePointsTurns: number;
  isSlowed: boolean;
  slowedTurns: number;
  streak: number;
  isBot?: boolean;
  // Write mode fields
  drawnStrokes?: StrokeData[];
  strokeScore?: number;       // 0-100
  drawingTimeMs?: number;
}

// Round result
export interface KanjiBattleRoundResult {
  questionId: string;
  correctAnswer: string;
  playerResults: {
    odinhId: string;
    answer: string;
    isCorrect: boolean;
    timeMs: number;
    pointsEarned: number;
    strokeScore?: number;
  }[];
  fastestPlayer?: string;
}

// JLPT Level type for selection
import type { JLPTLevel } from './flashcard';
export type { JLPTLevel };

// Game settings
export interface KanjiBattleSettings {
  maxPlayers: number;
  minPlayers: number;
  totalRounds: number;
  timePerQuestion: number;
  hintsPerPlayer: number;
  pointsCorrect: number;
  pointsPenalty: number;
  skillsEnabled: boolean;
  skillInterval: number;
  contentSource: 'seed' | 'custom';
  gameMode: KanjiBattleMode;
  selectedLevels: JLPTLevel[];
}

// Main game state
export interface KanjiBattleGame {
  id: string;
  code: string;
  hostId: string;
  title: string;
  settings: KanjiBattleSettings;
  status: KanjiBattleStatus;
  players: Record<string, KanjiBattlePlayer>;
  questions: KanjiBattleQuestion[];
  currentRound: number;
  currentQuestion: KanjiBattleQuestion | null;
  roundStartTime?: number;
  roundResults: KanjiBattleRoundResult[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Player result
export interface KanjiBattlePlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;
  score: number;
  correctAnswers: number;
  accuracy: number;
  avgResponseTime: number;
  avgStrokeScore?: number;
  isWinner: boolean;
}

// Game results
export interface KanjiBattleResults {
  gameId: string;
  winner: KanjiBattlePlayerResult | null;
  rankings: KanjiBattlePlayerResult[];
  totalRounds: number;
  totalPlayers: number;
}

// Create game data
export interface CreateKanjiBattleData {
  title: string;
  totalRounds: number;
  timePerQuestion: number;
  maxPlayers: number;
  skillsEnabled: boolean;
  gameMode: KanjiBattleMode;
  selectedLevels: JLPTLevel[];
}

// Default settings
export const DEFAULT_KANJI_BATTLE_SETTINGS: KanjiBattleSettings = {
  maxPlayers: 10,
  minPlayers: 2,
  totalRounds: 15,
  timePerQuestion: 15,
  hintsPerPlayer: 3,
  pointsCorrect: 100,
  pointsPenalty: 30,
  skillsEnabled: true,
  skillInterval: 5,
  contentSource: 'seed',
  gameMode: 'read',
  selectedLevels: ['N5'],
};

// Generate hints for kanji
export function generateKanjiHints(question: KanjiBattleQuestion): string[] {
  const hints: string[] = [];

  // Hint 1: Stroke count
  hints.push(`Số nét: ${question.strokeCount} nét`);

  // Hint 2: First character of meaning
  if (question.meaning) {
    hints.push(`Nghĩa bắt đầu bằng: "${question.meaning[0]}..."`);
  }

  // Hint 3: Sample word
  if (question.sampleWords.length > 0) {
    const sample = question.sampleWords[0];
    hints.push(`Từ mẫu: ${sample.word} (${sample.meaning})`);
  }

  return hints;
}
