// Golden Bell Game Types - "Rung Chuông Vàng"
// Elimination-style quiz game with solo/team modes and skill system

import type { JLPTLevel } from './flashcard';

// ============ BASE TYPES ============

// Question difficulty levels
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// Question category types
export type QuestionCategory = 'grammar' | 'vocabulary' | 'kanji' | 'culture';

// Player status in game
export type PlayerStatus = 'alive' | 'eliminated' | 'winner';

// Game mode
export type GoldenBellGameMode = 'solo' | 'team';

// Game status
export type GoldenBellGameStatus =
  | 'waiting'       // Waiting for players
  | 'starting'      // Countdown before game
  | 'question'      // Showing question
  | 'answering'     // Players answering
  | 'revealing'     // Showing correct answer & eliminations
  | 'skill_phase'   // Skill spin wheel phase
  | 'finished';     // Game over

// ============ SKILL SYSTEM ============

// Solo skill types
export type GoldenBellSoloSkillType = 'self_rescue' | 'shield' | 'double_time' | 'fifty_fifty';

// Team-only skill types
export type GoldenBellTeamSkillType = 'rescue_teammate';

// All skill types
export type GoldenBellSkillType = GoldenBellSoloSkillType | GoldenBellTeamSkillType;

// Skill definition
export interface GoldenBellSkill {
  type: GoldenBellSkillType;
  name: string;
  description: string;
  emoji: string;
  isSolo: boolean;
  isTeam: boolean;
}

// Solo skills catalog
export const GOLDEN_BELL_SOLO_SKILLS: Record<GoldenBellSoloSkillType, GoldenBellSkill> = {
  self_rescue: {
    type: 'self_rescue',
    name: 'Tự Cứu',
    description: 'Tự động hồi sinh khi bị loại',
    emoji: '💖',
    isSolo: true,
    isTeam: false,
  },
  shield: {
    type: 'shield',
    name: 'Khiên Bảo Vệ',
    description: 'Chặn 1 lần bị loại',
    emoji: '🛡️',
    isSolo: true,
    isTeam: false,
  },
  double_time: {
    type: 'double_time',
    name: 'Gấp Đôi Thời Gian',
    description: 'Nhận gấp đôi thời gian trả lời',
    emoji: '⏰',
    isSolo: true,
    isTeam: false,
  },
  fifty_fifty: {
    type: 'fifty_fifty',
    name: '50/50',
    description: 'Loại bỏ 2 đáp án sai',
    emoji: '✂️',
    isSolo: true,
    isTeam: false,
  },
};

// Team skills catalog
export const GOLDEN_BELL_TEAM_SKILLS: Record<GoldenBellTeamSkillType, GoldenBellSkill> = {
  rescue_teammate: {
    type: 'rescue_teammate',
    name: 'Cứu Đồng Đội',
    description: 'Hồi sinh đồng đội đã bị loại',
    emoji: '🤝',
    isSolo: false,
    isTeam: true,
  },
};

// All skills merged
export const ALL_GOLDEN_BELL_SKILLS: Record<GoldenBellSkillType, GoldenBellSkill> = {
  ...GOLDEN_BELL_SOLO_SKILLS,
  ...GOLDEN_BELL_TEAM_SKILLS,
};

// ============ TEAM SYSTEM ============

// Team color keys (extends racing game colors + green + orange)
export type GBTeamColorKey = 'red' | 'blue' | 'yellow' | 'purple' | 'green' | 'orange';

// Team color definitions
export const GB_TEAM_COLORS: Record<GBTeamColorKey, { name: string; color: string; emoji: string }> = {
  red: { name: 'Đỏ', color: '#ef4444', emoji: '🔴' },
  blue: { name: 'Xanh Dương', color: '#3b82f6', emoji: '🔵' },
  yellow: { name: 'Vàng', color: '#eab308', emoji: '🟡' },
  purple: { name: 'Tím', color: '#a855f7', emoji: '🟣' },
  green: { name: 'Xanh Lá', color: '#22c55e', emoji: '🟢' },
  orange: { name: 'Cam', color: '#f97316', emoji: '🟠' },
};

// Team structure
export interface GoldenBellTeam {
  id: string;
  name: string;
  colorKey: GBTeamColorKey;
  emoji: string;
  members: string[];         // Player IDs
  aliveCount: number;
  totalCorrect: number;
}

// Team result for rankings
export interface GoldenBellTeamResult {
  teamId: string;
  teamName: string;
  colorKey: GBTeamColorKey;
  emoji: string;
  rank: number;
  aliveMembers: number;
  totalMembers: number;
  totalCorrect: number;
  mvpId?: string;
  mvpName?: string;
}

// ============ CUSTOM QUESTIONS ============

export interface CustomGoldenBellQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  timeLimit: number;
  explanation?: string;
  createdBy: string;
  createdAt: string;
}

// ============ SKILL PHASE DATA ============

export interface SkillPhaseData {
  eligiblePlayers: string[];    // Player IDs who can spin
  completedPlayers: string[];   // Players who already spun
  currentSpinner?: string;      // Player currently spinning
}

// ============ CORE INTERFACES ============

// Question structure
export interface GoldenBellQuestion {
  id: string;
  questionText: string;
  options: string[];          // 4 options (A, B, C, D)
  correctIndex: number;       // Index of correct answer (0-3)
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  timeLimit: number;          // Seconds to answer
  explanation?: string;       // Optional explanation for answer
}

// Player in Golden Bell game
export interface GoldenBellPlayer {
  odinhId: string;            // Player unique ID
  displayName: string;
  avatar: string;
  role?: string;              // User role for VIP styling
  status: PlayerStatus;
  correctAnswers: number;
  totalAnswers: number;
  currentAnswer?: number;     // Index of selected answer
  answerTime?: number;        // Time taken to answer (ms)
  eliminatedAt?: number;      // Question number when eliminated
  streak: number;             // Consecutive correct answers
  isBot?: boolean;            // Whether this is a bot player
  botIntelligence?: 'weak' | 'average' | 'smart' | 'genius';
  // Team mode
  teamId?: string;
  // Skill system
  skills: GoldenBellSkillType[];
  hasShield?: boolean;
  hasSelfRescue?: boolean;
  hasDoubleTime?: boolean;
  hasFiftyFifty?: boolean;
  fiftyFiftyExcluded?: number[];  // Indices of hidden wrong options
}

// Game settings
export interface GoldenBellSettings {
  maxPlayers: number;         // 10-100 players
  minPlayers: number;         // Minimum to start (default 2)
  questionCount: number;      // Total questions
  timePerQuestion: number;    // Seconds per question
  jlptLevel: JLPTLevel;
  categories: QuestionCategory[];
  difficultyProgression: boolean;  // Start easy, get harder
  contentSource: 'flashcard' | 'jlpt' | 'custom' | 'mixed';
  lessonId?: string;
  // Game mode
  gameMode: GoldenBellGameMode;
  teamCount?: number;              // 2-6 teams
  maxPlayersPerTeam?: number;      // 3-6 per team
  // Skill system
  skillsEnabled: boolean;
  skillInterval: number;           // Every N questions (default 5)
  enabledSkills?: GoldenBellSkillType[];
}

// Main game state
export interface GoldenBellGame {
  id: string;
  code: string;               // 6-digit join code
  hostId: string;
  title: string;
  settings: GoldenBellSettings;
  status: GoldenBellGameStatus;
  players: Record<string, GoldenBellPlayer>;
  questions: GoldenBellQuestion[];
  currentQuestionIndex: number;
  questionStartTime?: number;
  alivePlayers: number;       // Count of players still alive
  eliminatedThisRound: string[];  // Player IDs eliminated this round
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  // Team mode
  teams?: Record<string, GoldenBellTeam>;
  // Skill phase
  skillPhaseData?: SkillPhaseData;
  // Special question: only correct answerers are eligible for skill spin
  _skillEligiblePlayers?: string[];
}

// Player result for final rankings
export interface GoldenBellPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;               // Final position (1 = winner)
  correctAnswers: number;
  accuracy: number;           // Percentage correct
  survivedRounds: number;     // How many questions they survived
  longestStreak: number;
  isWinner: boolean;
  teamId?: string;
}

// Game results
export interface GoldenBellResults {
  gameId: string;
  winner: GoldenBellPlayerResult | null;
  rankings: GoldenBellPlayerResult[];
  totalQuestions: number;
  totalPlayers: number;
  // Team mode
  gameMode: GoldenBellGameMode;
  teamRankings?: GoldenBellTeamResult[];
}

// Create game form data
export interface CreateGoldenBellData {
  title: string;
  jlptLevel: JLPTLevel;
  contentSource: 'flashcard' | 'jlpt' | 'custom' | 'mixed';
  lessonId?: string;
  questionCount: number;
  timePerQuestion: number;
  maxPlayers: number;
  categories: QuestionCategory[];
  difficultyProgression: boolean;
  // Game mode
  gameMode?: GoldenBellGameMode;
  teamCount?: number;
  maxPlayersPerTeam?: number;
  // Skill system
  skillsEnabled?: boolean;
  skillInterval?: number;
}

// ============ CONSTANTS ============

// Category display info
export const CATEGORY_INFO: Record<QuestionCategory, { name: string; emoji: string; color: string }> = {
  grammar: { name: 'Ngữ pháp', emoji: '📖', color: '#4ecdc4' },
  vocabulary: { name: 'Từ vựng', emoji: '📝', color: '#ff6b6b' },
  kanji: { name: 'Kanji', emoji: '🈳', color: '#ffd93d' },
  culture: { name: 'Văn hóa', emoji: '🎌', color: '#6c5ce7' },
};

// Difficulty display info
export const DIFFICULTY_INFO: Record<QuestionDifficulty, { name: string; emoji: string; color: string }> = {
  easy: { name: 'Dễ', emoji: '⭐', color: '#2ecc71' },
  medium: { name: 'Trung bình', emoji: '⭐⭐', color: '#f39c12' },
  hard: { name: 'Khó', emoji: '⭐⭐⭐', color: '#e74c3c' },
};

// Answer option labels
export const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

// Answer option colors (Kahoot-style)
export const ANSWER_COLORS = [
  'linear-gradient(135deg, #e21b3c, #c0172a)',  // Red - A
  'linear-gradient(135deg, #1368ce, #0f5fc0)',  // Blue - B
  'linear-gradient(135deg, #d89e00, #c68f00)',  // Yellow - C
  'linear-gradient(135deg, #26890c, #1f7009)',  // Green - D
];

// Answer option shapes
export const ANSWER_SHAPES = ['▲', '◆', '●', '■'];
