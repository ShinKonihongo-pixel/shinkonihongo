// Racing Game Types - "Đua Thuyền & Đua Ngựa: Học Tiếng Nhật"
// Players compete by answering Japanese questions to increase vehicle speed

import type { JLPTLevel } from './flashcard';

// Vehicle types available for racing
export type VehicleType = 'boat' | 'horse';

// Difficulty levels for questions
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// Special features from mystery box
export type SpecialFeatureType =
  | 'speed_boost'      // Tăng tốc độ +20%
  | 'shield'           // Bảo vệ khỏi hiệu ứng tiêu cực
  | 'slow_others'      // Giảm tốc độ đối thủ -10%
  | 'double_speed'     // Nhân đôi tốc độ câu tiếp theo
  | 'teleport'         // Tiến thêm 10% quãng đường
  | 'freeze';          // Đóng băng đối thủ 1 lượt

// Vehicle data with unlock requirements
export interface RacingVehicle {
  id: string;
  type: VehicleType;
  name: string;
  emoji: string;
  baseSpeed: number;        // km/h base speed
  maxSpeed: number;         // km/h max speed
  acceleration: number;     // Speed gain per correct answer
  unlockPoints: number;     // Points needed to unlock (0 = default)
  isUnlocked?: boolean;
}

// Default vehicles
export const DEFAULT_VEHICLES: RacingVehicle[] = [
  // Boats
  { id: 'boat_basic', type: 'boat', name: 'Thuyền Gỗ', emoji: '🚣', baseSpeed: 10, maxSpeed: 50, acceleration: 5, unlockPoints: 0 },
  { id: 'boat_sail', type: 'boat', name: 'Thuyền Buồm', emoji: '⛵', baseSpeed: 15, maxSpeed: 60, acceleration: 6, unlockPoints: 100 },
  { id: 'boat_speed', type: 'boat', name: 'Ca Nô', emoji: '🚤', baseSpeed: 20, maxSpeed: 80, acceleration: 8, unlockPoints: 300 },
  { id: 'boat_ship', type: 'boat', name: 'Tàu Thủy', emoji: '🛳️', baseSpeed: 25, maxSpeed: 100, acceleration: 10, unlockPoints: 500 },
  // Horses
  { id: 'horse_basic', type: 'horse', name: 'Ngựa Nâu', emoji: '🐴', baseSpeed: 15, maxSpeed: 60, acceleration: 6, unlockPoints: 0 },
  { id: 'horse_white', type: 'horse', name: 'Bạch Mã', emoji: '🦄', baseSpeed: 20, maxSpeed: 70, acceleration: 7, unlockPoints: 150 },
  { id: 'horse_race', type: 'horse', name: 'Ngựa Đua', emoji: '🏇', baseSpeed: 25, maxSpeed: 90, acceleration: 9, unlockPoints: 400 },
  { id: 'horse_legend', type: 'horse', name: 'Thiên Mã', emoji: '🐎', baseSpeed: 30, maxSpeed: 120, acceleration: 12, unlockPoints: 600 },
];

// Special feature definition
export interface SpecialFeature {
  type: SpecialFeatureType;
  name: string;
  description: string;
  emoji: string;
  duration?: number;  // Rounds the effect lasts
}

// Available special features
export const SPECIAL_FEATURES: Record<SpecialFeatureType, SpecialFeature> = {
  speed_boost: { type: 'speed_boost', name: 'Tăng Tốc', description: 'Tăng 20% tốc độ trong 3 lượt', emoji: '🚀', duration: 3 },
  shield: { type: 'shield', name: 'Khiên Bảo Vệ', description: 'Miễn nhiễm hiệu ứng tiêu cực 2 lượt', emoji: '🛡️', duration: 2 },
  slow_others: { type: 'slow_others', name: 'Giảm Tốc', description: 'Giảm 10% tốc độ đối thủ 2 lượt', emoji: '🐌', duration: 2 },
  double_speed: { type: 'double_speed', name: 'Nhân Đôi', description: 'Nhân đôi tốc độ câu tiếp theo', emoji: '⚡', duration: 1 },
  teleport: { type: 'teleport', name: 'Dịch Chuyển', description: 'Tiến thêm 10% quãng đường', emoji: '✨' },
  freeze: { type: 'freeze', name: 'Đóng Băng', description: 'Đóng băng đối thủ 1 lượt', emoji: '❄️', duration: 1 },
};

// Mystery box with special question
export interface MysteryBox {
  difficulty: QuestionDifficulty;
  reward: SpecialFeatureType;
  isOpened: boolean;
}

// Racing question structure
export interface RacingQuestion {
  id: string;
  questionText: string;       // The question (kanji/vocabulary)
  options: string[];          // 4 answer options
  correctIndex: number;       // Index of correct answer
  difficulty: QuestionDifficulty;
  timeLimit: number;          // Seconds to answer
  speedBonus: number;         // Speed gained for correct answer
  isMysteryBox?: boolean;     // Is this a mystery box question
  mysteryBox?: MysteryBox;
}

// Player in racing game
export interface RacingPlayer {
  odinhId: string;            // Player unique ID
  displayName: string;
  avatar: string;
  vehicle: RacingVehicle;
  currentSpeed: number;       // Current speed in km/h
  distance: number;           // Distance traveled (0-100%)
  correctAnswers: number;
  totalAnswers: number;
  streak: number;             // Consecutive correct answers
  activeFeatures: ActiveFeature[];  // Currently active special features
  hasShield: boolean;
  isFrozen: boolean;
  currentAnswer?: number;     // Index of selected answer
  answerTime?: number;        // Time taken to answer
  isFinished: boolean;        // Crossed finish line
  finishPosition?: number;    // Final position (1st, 2nd, etc.)
  totalPoints: number;        // Points earned this race
  isBot?: boolean;            // Is this player a bot?
}

// Active special feature on player
export interface ActiveFeature {
  type: SpecialFeatureType;
  remainingRounds: number;
}

// Game settings
export interface RacingGameSettings {
  raceType: VehicleType;
  trackLength: number;        // Total distance in km
  questionCount: number;      // Total questions
  timePerQuestion: number;    // Seconds per question
  mysteryBoxFrequency: number; // Every N questions
  maxPlayers: number;
  minPlayers: number;
  jlptLevel: JLPTLevel;
  contentSource: 'flashcard' | 'jlpt';
  lessonId?: string;
}

// Game status
export type RacingGameStatus =
  | 'waiting'           // Waiting for players
  | 'starting'          // Countdown
  | 'racing'            // Main gameplay
  | 'question'          // Showing question
  | 'answering'         // Players answering
  | 'revealing'         // Showing correct answer
  | 'mystery_box'       // Mystery box event
  | 'finished';         // Race complete

// Main racing game state
export interface RacingGame {
  id: string;
  code: string;               // 6-digit join code
  hostId: string;
  title: string;
  settings: RacingGameSettings;
  status: RacingGameStatus;
  players: Record<string, RacingPlayer>;
  questions: RacingQuestion[];
  currentQuestionIndex: number;
  questionStartTime?: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Game results
export interface RacingGameResults {
  gameId: string;
  rankings: RacingPlayerResult[];
  totalQuestions: number;
  raceType: VehicleType;
  trackLength: number;
}

export interface RacingPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  vehicle: RacingVehicle;
  position: number;
  distance: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  pointsEarned: number;
  featuresUsed: number;
}

// Create game form data
export interface CreateRacingGameData {
  title: string;
  raceType: VehicleType;
  jlptLevel: JLPTLevel;
  contentSource: 'flashcard' | 'jlpt';
  lessonId?: string;
  questionCount: number;
  timePerQuestion: number;
  trackLength: number;
}

// User's unlocked vehicles and points
export interface UserRacingProgress {
  odinhUserId: string;
  totalPoints: number;
  unlockedVehicles: string[];  // Vehicle IDs
  racesPlayed: number;
  racesWon: number;
  totalCorrectAnswers: number;
}
