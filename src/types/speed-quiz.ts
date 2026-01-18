// Speed Quiz Types - "Ai Nhanh Hơn Ai" game
// Type the correct answer as fast as possible

// Game status
export type SpeedQuizStatus =
  | 'waiting'      // Waiting for players
  | 'starting'     // Countdown
  | 'playing'      // Question active
  | 'result'       // Show round result
  | 'skill_phase'  // Skill selection (every 5 rounds)
  | 'finished';    // Game over

// Special skill types
export type SpeedQuizSkillType =
  | 'double_points'    // 2x điểm trong 2 lượt tiếp
  | 'steal_points'     // Cướp 50 điểm từ đối thủ
  | 'shield'           // Không bị trừ điểm trong 2 lượt
  | 'extra_hint'       // +2 lượt gợi ý
  | 'slow_others'      // Đối thủ bị delay 2 giây
  | 'reveal_first';    // Hiện chữ cái đầu miễn phí

export interface SpeedQuizSkill {
  type: SpeedQuizSkillType;
  name: string;
  description: string;
  emoji: string;
  targetOther: boolean;
}

export const SPEED_QUIZ_SKILLS: Record<SpeedQuizSkillType, SpeedQuizSkill> = {
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

// Question structure
export interface SpeedQuizQuestion {
  id: string;
  display: string;        // What is shown (e.g., kanji, vocab)
  answer: string;         // Correct answer (e.g., meaning, reading)
  hints: string[];        // Progressive hints
  points: number;         // Points for correct answer
  penalty: number;        // Points deducted for wrong answer
  timeLimit: number;      // Seconds
  category: 'vocabulary' | 'kanji' | 'grammar';
}

// Player in game
export interface SpeedQuizPlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  hintsUsed: number;
  hintsRemaining: number;
  currentAnswer?: string;
  answerTime?: number;     // ms to answer
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
}

// Round result
export interface SpeedQuizRoundResult {
  questionId: string;
  correctAnswer: string;
  playerResults: {
    odinhId: string;
    answer: string;
    isCorrect: boolean;
    timeMs: number;
    pointsEarned: number;
  }[];
  fastestPlayer?: string;
}

// Game settings
export interface SpeedQuizSettings {
  maxPlayers: number;
  minPlayers: number;
  totalRounds: number;
  timePerQuestion: number;
  hintsPerPlayer: number;
  pointsCorrect: number;
  pointsPenalty: number;
  skillsEnabled: boolean;
  skillInterval: number;   // Every X rounds
  contentSource: 'flashcard' | 'custom';
}

// Main game state
export interface SpeedQuizGame {
  id: string;
  code: string;
  hostId: string;
  title: string;
  settings: SpeedQuizSettings;
  status: SpeedQuizStatus;
  players: Record<string, SpeedQuizPlayer>;
  questions: SpeedQuizQuestion[];
  currentRound: number;
  currentQuestion: SpeedQuizQuestion | null;
  roundStartTime?: number;
  roundResults: SpeedQuizRoundResult[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Player result
export interface SpeedQuizPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;
  score: number;
  correctAnswers: number;
  accuracy: number;
  avgResponseTime: number;
  isWinner: boolean;
}

// Game results
export interface SpeedQuizResults {
  gameId: string;
  winner: SpeedQuizPlayerResult | null;
  rankings: SpeedQuizPlayerResult[];
  totalRounds: number;
  totalPlayers: number;
}

// Create game data
export interface CreateSpeedQuizData {
  title: string;
  totalRounds: number;
  timePerQuestion: number;
  maxPlayers: number;
  skillsEnabled: boolean;
}

// Default settings
export const DEFAULT_SPEED_QUIZ_SETTINGS: SpeedQuizSettings = {
  maxPlayers: 10,
  minPlayers: 2,
  totalRounds: 15,
  timePerQuestion: 10,
  hintsPerPlayer: 3,
  pointsCorrect: 100,
  pointsPenalty: 30,
  skillsEnabled: true,
  skillInterval: 5,
  contentSource: 'flashcard',
};

// Generate hint from answer
export function generateHints(answer: string): string[] {
  const hints: string[] = [];
  const len = answer.length;

  // Hint 1: First letter
  hints.push(`Chữ đầu: "${answer[0]}..."`);

  // Hint 2: Length
  hints.push(`Độ dài: ${len} ký tự`);

  // Hint 3: More letters
  if (len > 2) {
    const revealed = answer.slice(0, Math.ceil(len / 2));
    hints.push(`Nửa đầu: "${revealed}..."`);
  } else {
    hints.push(`Chữ cuối: "...${answer[len - 1]}"`);
  }

  return hints;
}
