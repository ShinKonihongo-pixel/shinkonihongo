// AI Challenge Game Types - 1v1 Quiz battle against AI opponents
// Features 27 AI difficulty levels with gradually increasing accuracy and response speed
// Organized into 3 pages (9 per page): Beginner → Intermediate → Expert

// AI difficulty levels - 27 total
export type AIDifficulty =
  // Page 1: Beginner (1-9)
  | 'gentle'      // 1. Nhẹ Nhàng
  | 'friendly'    // 2. Thân Thiện
  | 'curious'     // 3. Tò Mò
  | 'eager'       // 4. Háo Hức
  | 'clever'      // 5. Khéo Léo
  | 'diligent'    // 6. Chăm Chỉ
  | 'quick'       // 7. Nhanh Nhẹn
  | 'smart'       // 8. Thông Minh
  | 'sharp'       // 9. Sắc Bén
  // Page 2: Intermediate (10-18)
  | 'skilled'     // 10. Tinh Nhuệ
  | 'excellent'   // 11. Xuất Sắc
  | 'talented'    // 12. Tài Năng
  | 'brilliant'   // 13. Lỗi Lạc
  | 'genius'      // 14. Thiên Tài
  | 'elite'       // 15. Tinh Hoa
  | 'master'      // 16. Bậc Thầy
  | 'grandmaster' // 17. Đại Sư
  | 'sage'        // 18. Hiền Triết
  // Page 3: Expert (19-27)
  | 'superior'    // 19. Siêu Việt
  | 'unbeatable'  // 20. Bất Bại
  | 'mythical'    // 21. Thần Thoại
  | 'legendary'   // 22. Huyền Thoại
  | 'immortal'    // 23. Bất Tử
  | 'divine'      // 24. Thần Thánh
  | 'celestial'   // 25. Thiên Giới
  | 'supreme'     // 26. Tối Thượng
  | 'champion';   // 27. Vô Địch

export type AIResponseSpeed = 'slow' | 'medium' | 'fast' | 'instant';

export interface AIOpponent {
  id: AIDifficulty;
  name: string;
  emoji: string;
  description: string;
  // Accuracy range (percentage)
  accuracyMin: number;
  accuracyMax: number;
  // Response speed category
  speed: AIResponseSpeed;
  // Speed ranges in milliseconds (min-max time to answer)
  speedRangeMs: [number, number];
  // Unlock requirement (wins needed) - now sequential: beat previous AI once
  unlockWins: number;
  // Visual color
  color: string;
  // Page number (1-3)
  page: 1 | 2 | 3;
  // Order within page (1-9)
  orderInPage: number;
}

// All 27 AI opponents configuration - progressive difficulty
export const AI_OPPONENTS: Record<AIDifficulty, AIOpponent> = {
  // ========== PAGE 1: BEGINNER (1-9) ==========
  gentle: {
    id: 'gentle',
    name: 'Nhẹ Nhàng',
    emoji: '🌸',
    description: 'Mới bắt đầu, trả lời chậm rãi',
    accuracyMin: 40,
    accuracyMax: 50,
    speed: 'slow',
    speedRangeMs: [10000, 14000],
    unlockWins: 0,
    color: '#a8e6cf',
    page: 1,
    orderInPage: 1,
  },
  friendly: {
    id: 'friendly',
    name: 'Thân Thiện',
    emoji: '🐰',
    description: 'Dễ thương và nhẹ nhàng',
    accuracyMin: 45,
    accuracyMax: 55,
    speed: 'slow',
    speedRangeMs: [9000, 13000],
    unlockWins: 1,
    color: '#ffb6c1',
    page: 1,
    orderInPage: 2,
  },
  curious: {
    id: 'curious',
    name: 'Tò Mò',
    emoji: '🦉',
    description: 'Thích khám phá, đôi khi chậm',
    accuracyMin: 48,
    accuracyMax: 58,
    speed: 'slow',
    speedRangeMs: [8500, 12000],
    unlockWins: 2,
    color: '#dda0dd',
    page: 1,
    orderInPage: 3,
  },
  eager: {
    id: 'eager',
    name: 'Háo Hức',
    emoji: '🐕',
    description: 'Nhiệt tình và nhanh nhẹn',
    accuracyMin: 50,
    accuracyMax: 60,
    speed: 'slow',
    speedRangeMs: [8000, 11000],
    unlockWins: 3,
    color: '#ffd3a5',
    page: 1,
    orderInPage: 4,
  },
  clever: {
    id: 'clever',
    name: 'Khéo Léo',
    emoji: '🦊',
    description: 'Tinh ranh và nhanh trí',
    accuracyMin: 52,
    accuracyMax: 62,
    speed: 'medium',
    speedRangeMs: [7000, 10000],
    unlockWins: 4,
    color: '#ff9a56',
    page: 1,
    orderInPage: 5,
  },
  diligent: {
    id: 'diligent',
    name: 'Chăm Chỉ',
    emoji: '🐝',
    description: 'Cần cù và kiên trì',
    accuracyMin: 55,
    accuracyMax: 65,
    speed: 'medium',
    speedRangeMs: [6500, 9500],
    unlockWins: 5,
    color: '#f4d03f',
    page: 1,
    orderInPage: 6,
  },
  quick: {
    id: 'quick',
    name: 'Nhanh Nhẹn',
    emoji: '🐇',
    description: 'Phản xạ nhanh, đôi khi vội',
    accuracyMin: 57,
    accuracyMax: 67,
    speed: 'medium',
    speedRangeMs: [6000, 9000],
    unlockWins: 6,
    color: '#88d8b0',
    page: 1,
    orderInPage: 7,
  },
  smart: {
    id: 'smart',
    name: 'Thông Minh',
    emoji: '🧠',
    description: 'Suy nghĩ logic, cân nhắc kỹ',
    accuracyMin: 60,
    accuracyMax: 70,
    speed: 'medium',
    speedRangeMs: [5500, 8500],
    unlockWins: 7,
    color: '#7fcdbb',
    page: 1,
    orderInPage: 8,
  },
  sharp: {
    id: 'sharp',
    name: 'Sắc Bén',
    emoji: '🦅',
    description: 'Nhìn xa trông rộng',
    accuracyMin: 62,
    accuracyMax: 72,
    speed: 'medium',
    speedRangeMs: [5000, 8000],
    unlockWins: 8,
    color: '#41b3a3',
    page: 1,
    orderInPage: 9,
  },

  // ========== PAGE 2: INTERMEDIATE (10-18) ==========
  skilled: {
    id: 'skilled',
    name: 'Tinh Nhuệ',
    emoji: '⚔️',
    description: 'Kỹ năng vững vàng',
    accuracyMin: 65,
    accuracyMax: 75,
    speed: 'medium',
    speedRangeMs: [4500, 7000],
    unlockWins: 9,
    color: '#e85a4f',
    page: 2,
    orderInPage: 1,
  },
  excellent: {
    id: 'excellent',
    name: 'Xuất Sắc',
    emoji: '⭐',
    description: 'Vượt trội hơn số đông',
    accuracyMin: 67,
    accuracyMax: 77,
    speed: 'medium',
    speedRangeMs: [4000, 6500],
    unlockWins: 10,
    color: '#ffd700',
    page: 2,
    orderInPage: 2,
  },
  talented: {
    id: 'talented',
    name: 'Tài Năng',
    emoji: '💎',
    description: 'Năng khiếu bẩm sinh',
    accuracyMin: 70,
    accuracyMax: 80,
    speed: 'fast',
    speedRangeMs: [3500, 6000],
    unlockWins: 11,
    color: '#b19cd9',
    page: 2,
    orderInPage: 3,
  },
  brilliant: {
    id: 'brilliant',
    name: 'Lỗi Lạc',
    emoji: '✨',
    description: 'Trí tuệ sáng chói',
    accuracyMin: 72,
    accuracyMax: 82,
    speed: 'fast',
    speedRangeMs: [3200, 5500],
    unlockWins: 12,
    color: '#e0aaff',
    page: 2,
    orderInPage: 4,
  },
  genius: {
    id: 'genius',
    name: 'Thiên Tài',
    emoji: '🎯',
    description: 'IQ vượt trội',
    accuracyMin: 74,
    accuracyMax: 84,
    speed: 'fast',
    speedRangeMs: [3000, 5000],
    unlockWins: 13,
    color: '#c77dff',
    page: 2,
    orderInPage: 5,
  },
  elite: {
    id: 'elite',
    name: 'Tinh Hoa',
    emoji: '🏅',
    description: 'Top 1% thế giới',
    accuracyMin: 76,
    accuracyMax: 86,
    speed: 'fast',
    speedRangeMs: [2800, 4500],
    unlockWins: 14,
    color: '#9d4edd',
    page: 2,
    orderInPage: 6,
  },
  master: {
    id: 'master',
    name: 'Bậc Thầy',
    emoji: '🥋',
    description: 'Đã đạt tới đỉnh cao',
    accuracyMin: 78,
    accuracyMax: 88,
    speed: 'fast',
    speedRangeMs: [2500, 4000],
    unlockWins: 15,
    color: '#7b2cbf',
    page: 2,
    orderInPage: 7,
  },
  grandmaster: {
    id: 'grandmaster',
    name: 'Đại Sư',
    emoji: '🧙',
    description: 'Kiến thức uyên thâm',
    accuracyMin: 80,
    accuracyMax: 90,
    speed: 'fast',
    speedRangeMs: [2200, 3500],
    unlockWins: 16,
    color: '#5a189a',
    page: 2,
    orderInPage: 8,
  },
  sage: {
    id: 'sage',
    name: 'Hiền Triết',
    emoji: '📚',
    description: 'Trí tuệ ngàn năm',
    accuracyMin: 82,
    accuracyMax: 91,
    speed: 'fast',
    speedRangeMs: [2000, 3200],
    unlockWins: 17,
    color: '#3c096c',
    page: 2,
    orderInPage: 9,
  },

  // ========== PAGE 3: EXPERT (19-27) ==========
  superior: {
    id: 'superior',
    name: 'Siêu Việt',
    emoji: '🔥',
    description: 'Vượt xa mọi giới hạn',
    accuracyMin: 84,
    accuracyMax: 92,
    speed: 'fast',
    speedRangeMs: [1800, 3000],
    unlockWins: 18,
    color: '#ff6b6b',
    page: 3,
    orderInPage: 1,
  },
  unbeatable: {
    id: 'unbeatable',
    name: 'Bất Bại',
    emoji: '👑',
    description: 'Chưa từng biết thua',
    accuracyMin: 85,
    accuracyMax: 93,
    speed: 'fast',
    speedRangeMs: [1600, 2800],
    unlockWins: 19,
    color: '#feca57',
    page: 3,
    orderInPage: 2,
  },
  mythical: {
    id: 'mythical',
    name: 'Thần Thoại',
    emoji: '🐉',
    description: 'Chỉ tồn tại trong truyền thuyết',
    accuracyMin: 86,
    accuracyMax: 94,
    speed: 'instant',
    speedRangeMs: [1400, 2500],
    unlockWins: 20,
    color: '#ee5a24',
    page: 3,
    orderInPage: 3,
  },
  legendary: {
    id: 'legendary',
    name: 'Huyền Thoại',
    emoji: '🦁',
    description: 'Tên tuổi vang danh thiên hạ',
    accuracyMin: 88,
    accuracyMax: 95,
    speed: 'instant',
    speedRangeMs: [1200, 2200],
    unlockWins: 21,
    color: '#d63031',
    page: 3,
    orderInPage: 4,
  },
  immortal: {
    id: 'immortal',
    name: 'Bất Tử',
    emoji: '🌟',
    description: 'Vĩnh hằng bất diệt',
    accuracyMin: 89,
    accuracyMax: 96,
    speed: 'instant',
    speedRangeMs: [1000, 2000],
    unlockWins: 22,
    color: '#e17055',
    page: 3,
    orderInPage: 5,
  },
  divine: {
    id: 'divine',
    name: 'Thần Thánh',
    emoji: '⚡',
    description: 'Quyền năng thần thánh',
    accuracyMin: 90,
    accuracyMax: 97,
    speed: 'instant',
    speedRangeMs: [900, 1800],
    unlockWins: 23,
    color: '#fdcb6e',
    page: 3,
    orderInPage: 6,
  },
  celestial: {
    id: 'celestial',
    name: 'Thiên Giới',
    emoji: '🌌',
    description: 'Đến từ cõi trời cao',
    accuracyMin: 92,
    accuracyMax: 98,
    speed: 'instant',
    speedRangeMs: [800, 1600],
    unlockWins: 24,
    color: '#a29bfe',
    page: 3,
    orderInPage: 7,
  },
  supreme: {
    id: 'supreme',
    name: 'Tối Thượng',
    emoji: '💫',
    description: 'Đứng trên tất cả',
    accuracyMin: 94,
    accuracyMax: 99,
    speed: 'instant',
    speedRangeMs: [700, 1400],
    unlockWins: 25,
    color: '#6c5ce7',
    page: 3,
    orderInPage: 8,
  },
  champion: {
    id: 'champion',
    name: 'Vô Địch',
    emoji: '🏆',
    description: 'Đỉnh cao tuyệt đối, không ai sánh bằng',
    accuracyMin: 96,
    accuracyMax: 100,
    speed: 'instant',
    speedRangeMs: [500, 1200],
    unlockWins: 26,
    color: '#9b59b6',
    page: 3,
    orderInPage: 9,
  },
};

// Get AI opponents by page
export function getAIsByPage(page: 1 | 2 | 3): AIOpponent[] {
  return Object.values(AI_OPPONENTS)
    .filter(ai => ai.page === page)
    .sort((a, b) => a.orderInPage - b.orderInPage);
}

// Get all AI opponents sorted by unlock order
export function getAllAIsSorted(): AIOpponent[] {
  return Object.values(AI_OPPONENTS).sort((a, b) => a.unlockWins - b.unlockWins);
}

// Game status
export type AIChallengeStatus =
  | 'idle'
  | 'selecting_ai'
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'answered'
  | 'revealing'
  | 'round_result'
  | 'finished';

// Question for the challenge
export interface AIChallengeQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  points: number;
  category: 'vocabulary' | 'kanji' | 'grammar';
}

// Player answer record
export interface AnswerRecord {
  questionId: string;
  answerIndex: number | null;
  isCorrect: boolean;
  timeMs: number;
  points: number;
}

// Round result
export interface RoundResult {
  questionId: string;
  playerAnswer: AnswerRecord;
  aiAnswer: AnswerRecord;
  winner: 'player' | 'ai' | 'tie';
}

// Game settings
export interface AIChallengeSettings {
  totalQuestions: number;
  timePerQuestion: number;
  pointsCorrect: number;
  pointsBonus: number; // Bonus for answering faster than AI
}

export const DEFAULT_AI_CHALLENGE_SETTINGS: AIChallengeSettings = {
  totalQuestions: 10,
  timePerQuestion: 15,
  pointsCorrect: 100,
  pointsBonus: 50,
};

// Player stats for this session
export interface PlayerStats {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: 'vip' | 'admin' | 'superadmin' | 'user';
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  bestStreak: number;
  averageTimeMs: number;
}

// AI stats for this session
export interface AIStats {
  difficulty: AIDifficulty;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
}

// Main game state
export interface AIChallengeGame {
  id: string;
  status: AIChallengeStatus;
  settings: AIChallengeSettings;
  aiDifficulty: AIDifficulty;
  // Questions
  questions: AIChallengeQuestion[];
  currentQuestionIndex: number;
  // Stats
  playerStats: PlayerStats;
  aiStats: AIStats;
  // Results
  roundResults: RoundResult[];
  // Timing
  questionStartTime: number | null;
  // Player progress tracking
  totalWins: number;
  totalGames: number;
}

// Game result
export interface AIChallengeResult {
  winner: 'player' | 'ai' | 'tie';
  playerScore: number;
  aiScore: number;
  playerCorrect: number;
  aiCorrect: number;
  totalQuestions: number;
  bestStreak: number;
  averageTimeMs: number;
  aiDifficulty: AIDifficulty;
  isNewUnlock: boolean;
  unlockedAI: AIDifficulty | null;
}

// Helper to check if AI is unlocked
export function isAIUnlocked(difficulty: AIDifficulty, totalWins: number): boolean {
  return totalWins >= AI_OPPONENTS[difficulty].unlockWins;
}

// Helper to get next locked AI
export function getNextLockedAI(totalWins: number): AIDifficulty | null {
  const aiList = getAllAIsSorted();
  for (const ai of aiList) {
    if (totalWins < ai.unlockWins) {
      return ai.id;
    }
  }
  return null;
}

// Helper to calculate AI answer with optional modifiers
export function calculateAIAnswer(
  ai: AIOpponent,
  correctIndex: number,
  optionsCount: number,
  accuracyModifier: number = 0,    // -20 to +20
  speedMultiplier: number = 1.0    // 0.5 to 2.0
): { answerIndex: number; isCorrect: boolean; timeMs: number } {
  // Determine if AI answers correctly based on accuracy range + modifier
  const baseAccuracy = ai.accuracyMin + Math.random() * (ai.accuracyMax - ai.accuracyMin);
  const accuracy = Math.min(100, Math.max(0, baseAccuracy + accuracyModifier));
  const isCorrect = Math.random() * 100 < accuracy;

  // Calculate answer index
  let answerIndex: number;
  if (isCorrect) {
    answerIndex = correctIndex;
  } else {
    // Pick a wrong answer
    const wrongIndices = Array.from({ length: optionsCount }, (_, i) => i)
      .filter(i => i !== correctIndex);
    answerIndex = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
  }

  // Calculate response time with speed multiplier (lower = faster)
  const [minMs, maxMs] = ai.speedRangeMs;
  const baseTime = minMs + Math.random() * (maxMs - minMs);
  const timeMs = baseTime / speedMultiplier; // Higher multiplier = AI answers faster

  return { answerIndex, isCorrect, timeMs: Math.round(timeMs) };
}
