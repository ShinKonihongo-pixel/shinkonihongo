// Bingo Game Types - Trò chơi Bingo số
// 6 dãy số, mỗi dãy 5 số (1-99), bốc số ngẫu nhiên, ai BINGO trước thắng

// Game status
export type BingoGameStatus =
  | 'waiting'      // Waiting for players
  | 'starting'     // Countdown before game
  | 'playing'      // Game in progress
  | 'skill_phase'  // Skill selection phase (every 5 turns)
  | 'finished';    // Game over

// Special skill types (available every 5 turns)
export type BingoSkillType =
  | 'remove_mark'      // Xoá số đã trúng của người chơi bất kỳ
  | 'auto_add'         // Tự động thêm số vào dãy của mình
  | 'increase_luck'    // Tăng tỉ lệ trúng ở đợt sau
  | 'block_turn'       // Chặn lượt chơi của người khác
  | 'fifty_fifty';     // 50/50 - Tự động xóa 2 phương án sai

// Skill info for display
export interface BingoSkill {
  type: BingoSkillType;
  name: string;
  description: string;
  emoji: string;
  targetOther: boolean; // true = needs to select target player
}

// Skill definitions
export const BINGO_SKILLS: Record<BingoSkillType, BingoSkill> = {
  remove_mark: {
    type: 'remove_mark',
    name: 'Xóa Dấu',
    description: 'Xoá một số đã trúng của đối thủ',
    emoji: '🗑️',
    targetOther: true,
  },
  auto_add: {
    type: 'auto_add',
    name: 'Thêm Số',
    description: 'Tự động đánh dấu một số trong dãy của bạn',
    emoji: '✨',
    targetOther: false,
  },
  increase_luck: {
    type: 'increase_luck',
    name: 'May Mắn',
    description: 'Tăng 30% tỉ lệ trúng số trong 3 lượt sau',
    emoji: '🍀',
    targetOther: false,
  },
  block_turn: {
    type: 'block_turn',
    name: 'Chặn Lượt',
    description: 'Đối thủ không thể bốc số lượt kế tiếp',
    emoji: '🚫',
    targetOther: true,
  },
  fifty_fifty: {
    type: 'fifty_fifty',
    name: '50/50',
    description: 'Giữ lại để dùng trong câu hỏi tiếp theo',
    emoji: '🎲',
    targetOther: false,
  },
};

// A single number cell in a row
export interface BingoCell {
  number: number;
  marked: boolean;
}

// A row of 5 numbers
export interface BingoRow {
  id: string;
  cells: BingoCell[];
  isComplete: boolean; // All 5 numbers marked = BINGO eligible
}

// Player in Bingo game
export interface BingoPlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  rows: BingoRow[];           // 6 rows of numbers
  markedCount: number;        // Total marked numbers
  completedRows: number;      // Rows with all 5 marked
  canBingo: boolean;          // Has at least one complete row
  hasBingoed: boolean;        // Already claimed bingo
  isBlocked: boolean;         // Blocked from drawing next turn
  luckBonus: number;          // Luck multiplier (1.0 = normal)
  luckTurnsLeft: number;      // Turns remaining for luck bonus
  hasSkillAvailable: boolean; // Can use skill this phase
  hasFiftyFifty: boolean;     // Has 50/50 skill stored
  isBot?: boolean;
}

// Drawn number history
export interface DrawnNumber {
  number: number;
  drawerId: string;           // Who drew it
  drawerName: string;
  timestamp: number;
}

// Game settings
export interface BingoGameSettings {
  maxPlayers: number;         // Max 20 players recommended
  minPlayers: number;         // Min 2 to start
  numberRange: [number, number]; // Default [1, 99]
  rowsPerPlayer: number;      // Default 6
  numbersPerRow: number;      // Default 5
  skillsEnabled: boolean;     // Enable special skills
  skillInterval: number;      // Turns between skill phases (default 5)
}

// Main game state
export interface BingoGame {
  id: string;
  code: string;               // 6-digit join code
  hostId: string;
  title: string;
  settings: BingoGameSettings;
  status: BingoGameStatus;
  players: Record<string, BingoPlayer>;
  drawnNumbers: DrawnNumber[];
  availableNumbers: number[]; // Numbers not yet drawn
  currentTurn: number;        // Turn counter
  currentDrawerId: string | null; // Who is drawing
  lastDrawnNumber: number | null;
  winnerId: string | null;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Player result for rankings
export interface BingoPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;
  markedCount: number;
  completedRows: number;
  isWinner: boolean;
}

// Game results
export interface BingoResults {
  gameId: string;
  winner: BingoPlayerResult | null;
  rankings: BingoPlayerResult[];
  totalTurns: number;
  totalPlayers: number;
  drawnNumbers: number[];
}

// Create game form data
export interface CreateBingoGameData {
  title: string;
  maxPlayers: number;
  skillsEnabled: boolean;
}

// Generate random bingo rows for a player
export function generateBingoRows(
  rowCount: number = 6,
  numbersPerRow: number = 5,
  range: [number, number] = [1, 99]
): BingoRow[] {
  const [min, max] = range;
  const allNumbers: number[] = [];

  // Generate all possible numbers
  for (let i = min; i <= max; i++) {
    allNumbers.push(i);
  }

  // Shuffle array
  const shuffled = [...allNumbers].sort(() => Math.random() - 0.5);

  // Take unique numbers for all rows
  const totalNeeded = rowCount * numbersPerRow;
  const selectedNumbers = shuffled.slice(0, totalNeeded);

  // Create rows
  const rows: BingoRow[] = [];
  for (let r = 0; r < rowCount; r++) {
    const rowNumbers = selectedNumbers.slice(r * numbersPerRow, (r + 1) * numbersPerRow);
    // Sort numbers in row for display
    rowNumbers.sort((a, b) => a - b);

    rows.push({
      id: `row-${r}`,
      cells: rowNumbers.map(num => ({ number: num, marked: false })),
      isComplete: false,
    });
  }

  return rows;
}

// Generate available numbers pool
export function generateNumberPool(range: [number, number] = [1, 99]): number[] {
  const [min, max] = range;
  const numbers: number[] = [];
  for (let i = min; i <= max; i++) {
    numbers.push(i);
  }
  return numbers.sort(() => Math.random() - 0.5); // Shuffle
}

// Check if a row is complete
export function isRowComplete(row: BingoRow): boolean {
  return row.cells.every(cell => cell.marked);
}

// Check if player can claim bingo
export function canClaimBingo(player: BingoPlayer): boolean {
  return player.rows.some(row => isRowComplete(row)) && !player.hasBingoed;
}

// Default settings
export const DEFAULT_BINGO_SETTINGS: BingoGameSettings = {
  maxPlayers: 20,
  minPlayers: 2,
  numberRange: [1, 99],
  rowsPerPlayer: 6,
  numbersPerRow: 5,
  skillsEnabled: true,
  skillInterval: 5,
};
