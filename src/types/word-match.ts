// Word Match Types - "Nối Từ Thách Đấu" game
// Players match word pairs (e.g., Japanese word - Vietnamese meaning)

// Game status
export type WordMatchStatus =
  | 'waiting'      // Waiting for players
  | 'starting'     // Countdown
  | 'playing'      // Active round
  | 'result'       // Show round result
  | 'wheel_spin'   // Lucky wheel spin (special round)
  | 'finished';    // Game over

// Special effect types (from wheel spin)
export type WordMatchEffectType =
  | 'challenge'      // Thách Đấu: Give hard pairs to opponent, get easy ones, steal points
  | 'disconnect'     // Ngắt Kết Nối: Skip opponent's next turn
  | 'shield';        // Lá Chắn: Protect from attacks for 1 turn

export interface WordMatchEffect {
  type: WordMatchEffectType;
  name: string;
  description: string;
  emoji: string;
  targetOther: boolean;
}

export const WORD_MATCH_EFFECTS: Record<WordMatchEffectType, WordMatchEffect> = {
  challenge: {
    type: 'challenge',
    name: 'Thách Đấu',
    description: 'Đối thủ nhận 5 cặp từ khó, bạn nhận 5 cặp dễ. Lấy điểm từ đối thủ!',
    emoji: '⚔️',
    targetOther: true,
  },
  disconnect: {
    type: 'disconnect',
    name: 'Ngắt Kết Nối',
    description: 'Cấm đối phương chơi trong lượt tiếp theo',
    emoji: '🔌',
    targetOther: true,
  },
  shield: {
    type: 'shield',
    name: 'Lá Chắn',
    description: 'Bảo vệ bản thân khỏi tấn công trong 1 lượt',
    emoji: '🛡️',
    targetOther: false,
  },
};

// Difficulty level for word pairs
export type WordPairDifficulty = 'easy' | 'medium' | 'hard';

// A word pair to match
export interface WordPair {
  id: string;
  left: string;          // Japanese word (kanji/vocab)
  right: string;         // Vietnamese meaning
  difficulty: WordPairDifficulty;
}

// A round of 5 word pairs
export interface WordMatchRound {
  id: string;
  pairs: WordPair[];           // 5 pairs
  isSpecial: boolean;          // Every 5th round is special
  timeLimit: number;           // Seconds for this round
}

// Player's answer for a round
export interface PlayerRoundAnswer {
  odinhId: string;
  matches: { leftId: string; rightId: string }[];  // Player's matched pairs
  correctCount: number;
  allCorrect: boolean;
  timeMs: number;
  pointsEarned: number;
}

// Round result
export interface WordMatchRoundResult {
  roundId: string;
  roundNumber: number;
  isSpecial: boolean;
  correctPairs: { leftId: string; rightId: string }[];
  playerResults: PlayerRoundAnswer[];
  wheelWinner?: string;    // Player who won wheel spin (special round)
}

// Player in game
export interface WordMatchPlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  score: number;
  correctPairs: number;
  perfectRounds: number;       // All 5 correct
  isDisconnected: boolean;     // Skipped this round
  disconnectedTurns: number;
  hasShield: boolean;
  shieldTurns: number;
  isChallenged: boolean;       // Gets hard pairs next round
  challengedBy?: string;
  currentMatches: { leftId: string; rightId: string }[];
  hasSubmitted: boolean;
  submitTime?: number;
  streak: number;
  isBot?: boolean;
}

// Game settings
export interface WordMatchSettings {
  maxPlayers: number;
  minPlayers: number;
  totalRounds: number;
  timePerRound: number;        // Seconds per round
  pairsPerRound: number;       // Always 5
  specialInterval: number;     // Every X rounds (5)
  pointsPerPair: number;
  bonusAllCorrect: number;     // Bonus for 5/5
  challengePointsSteal: number;
}

// Main game state
export interface WordMatchGame {
  id: string;
  code: string;
  hostId: string;
  title: string;
  settings: WordMatchSettings;
  status: WordMatchStatus;
  players: Record<string, WordMatchPlayer>;
  rounds: WordMatchRound[];
  currentRound: number;
  currentRoundData: WordMatchRound | null;
  roundStartTime?: number;
  roundResults: WordMatchRoundResult[];
  wheelSpinner?: string;       // Player spinning the wheel
  selectedEffect?: WordMatchEffectType;
  effectTarget?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Player result
export interface WordMatchPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;
  score: number;
  correctPairs: number;
  perfectRounds: number;
  accuracy: number;
  isWinner: boolean;
}

// Game results
export interface WordMatchResults {
  gameId: string;
  winner: WordMatchPlayerResult | null;
  rankings: WordMatchPlayerResult[];
  totalRounds: number;
  totalPairs: number;
}

// Create game data
export interface CreateWordMatchData {
  title: string;
  totalRounds: number;
  timePerRound: number;
  maxPlayers: number;
}

// Default settings
export const DEFAULT_WORD_MATCH_SETTINGS: WordMatchSettings = {
  maxPlayers: 10,
  minPlayers: 2,
  totalRounds: 15,
  timePerRound: 30,
  pairsPerRound: 5,
  specialInterval: 5,
  pointsPerPair: 20,
  bonusAllCorrect: 50,
  challengePointsSteal: 30,
};

// Generate shuffled display arrays for matching UI
export function shuffleForDisplay(pairs: WordPair[]): {
  leftItems: { id: string; text: string }[];
  rightItems: { id: string; text: string }[];
} {
  const leftItems = pairs.map(p => ({ id: p.id, text: p.left }));
  const rightItems = pairs.map(p => ({ id: p.id, text: p.right }));

  // Shuffle right items
  for (let i = rightItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
  }

  return { leftItems, rightItems };
}

// Check if matches are correct
export function checkMatches(
  playerMatches: { leftId: string; rightId: string }[],
  correctPairs: WordPair[]
): { correct: number; total: number; allCorrect: boolean } {
  let correct = 0;
  const total = correctPairs.length;

  playerMatches.forEach(match => {
    const pair = correctPairs.find(p => p.id === match.leftId);
    if (pair && pair.id === match.rightId) {
      correct++;
    }
  });

  return { correct, total, allCorrect: correct === total };
}

// Calculate points for a round
export function calculateRoundPoints(
  correctCount: number,
  allCorrect: boolean,
  settings: WordMatchSettings,
  hasDoublePoints: boolean = false
): number {
  let points = correctCount * settings.pointsPerPair;
  if (allCorrect) {
    points += settings.bonusAllCorrect;
  }
  if (hasDoublePoints) {
    points *= 2;
  }
  return points;
}
