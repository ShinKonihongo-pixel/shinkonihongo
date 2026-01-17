// Game Hub Types - Unified game center for all mini-games

// Available games in the hub
export type GameType = 'quiz' | 'boat-racing' | 'horse-racing' | 'golden-bell' | 'picture-guess';

// Racing sub-types
export type RacingType = 'boat' | 'horse';

// Game info for display
export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  playerRange: string;
  features: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  isNew?: boolean;
  isPopular?: boolean;
  category?: 'racing' | 'quiz' | 'elimination' | 'puzzle';
}

// Game hub state
export interface GameHubState {
  selectedGame: GameType | null;
  joinCode: string | null;
}

// Waiting room - shows available games to join
export interface WaitingRoomGame {
  id: string;
  code: string;
  gameType: GameType;
  title: string;
  hostName: string;
  hostAvatar: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string;
  status: 'waiting' | 'starting';
}

// Bot names for auto-fill
export const BOT_NAMES = [
  'Sakura', 'Yuki', 'Hana', 'Ryu', 'Kenji', 'Akira', 'Mei', 'Kaito',
  'Sora', 'Haruki', 'Aoi', 'Rin', 'Taro', 'Yuma', 'Hinata', 'Kota',
  'Miku', 'Ren', 'Nana', 'Daiki', 'Emi', 'Takeshi', 'Momo', 'Shin',
  'Ayumi', 'Koji', 'Yui', 'Masa', 'Kira', 'Ken', 'Saki', 'Riko'
];

// Bot avatars
export const BOT_AVATARS = ['🤖', '🎭', '🎪', '🎨', '🎯', '🎲', '🎮', '🕹️', '👾', '🦊', '🐱', '🐼'];

// Generate random bot
export function generateBot(): { name: string; avatar: string } {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const avatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
  const suffix = Math.floor(Math.random() * 100);
  return { name: `${name}${suffix}`, avatar };
}

// Generate multiple unique bots
export function generateBots(count: number): Array<{ name: string; avatar: string }> {
  const bots: Array<{ name: string; avatar: string }> = [];
  const usedNames = new Set<string>();

  while (bots.length < count) {
    const bot = generateBot();
    if (!usedNames.has(bot.name)) {
      usedNames.add(bot.name);
      bots.push(bot);
    }
  }
  return bots;
}

// Game configurations
export const GAMES: Record<GameType, GameInfo> = {
  quiz: {
    id: 'quiz',
    name: 'Quiz Battle',
    description: 'Đối kháng kiến thức tiếng Nhật với bạn bè',
    icon: '🎯',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
    playerRange: '1-20',
    features: ['Power-ups', 'Bảng xếp hạng', 'Nhiều chế độ'],
    difficulty: 'medium',
    isPopular: true,
    category: 'quiz',
  },
  'boat-racing': {
    id: 'boat-racing',
    name: 'Đua Thuyền',
    description: 'Đua thuyền học từ vựng - trả lời nhanh để về đích',
    icon: '🚣',
    color: '#4ECDC4',
    gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
    playerRange: '2-8',
    features: ['Đua realtime', 'Phòng chờ', 'Auto-match bots'],
    difficulty: 'easy',
    category: 'racing',
  },
  'horse-racing': {
    id: 'horse-racing',
    name: 'Đua Ngựa',
    description: 'Phi nước đại cùng kiến thức - về đích đầu tiên!',
    icon: '🏇',
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
    playerRange: '2-8',
    features: ['Đua realtime', 'Phòng chờ', 'Auto-match bots'],
    difficulty: 'easy',
    category: 'racing',
    isNew: true,
  },
  'golden-bell': {
    id: 'golden-bell',
    name: 'Rung Chuông Vàng',
    description: 'Trả lời sai bị loại - người cuối cùng chiến thắng',
    icon: '🔔',
    color: '#FFD93D',
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #FF9F43 100%)',
    playerRange: '2-100',
    features: ['Loại trực tiếp', 'Hồi hộp căng thẳng', 'Nhiều người chơi'],
    difficulty: 'hard',
    isPopular: true,
    category: 'elimination',
  },
  'picture-guess': {
    id: 'picture-guess',
    name: 'Đuổi Hình Bắt Chữ',
    description: 'Nhìn hình emoji đoán từ tiếng Nhật',
    icon: '🖼️',
    color: '#00ACC1',
    gradient: 'linear-gradient(135deg, #00ACC1 0%, #26C6DA 100%)',
    playerRange: '1-20',
    features: ['Gợi ý thông minh', 'Điểm tốc độ', 'Ôn từ vựng'],
    difficulty: 'easy',
    category: 'puzzle',
  },
};

// Get all games as array
export const getAllGames = (): GameInfo[] => Object.values(GAMES);

// Get games by difficulty
export const getGamesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): GameInfo[] =>
  getAllGames().filter(g => g.difficulty === difficulty);

// Get popular games
export const getPopularGames = (): GameInfo[] =>
  getAllGames().filter(g => g.isPopular);

// Get new games
export const getNewGames = (): GameInfo[] =>
  getAllGames().filter(g => g.isNew);

// Get racing games
export const getRacingGames = (): GameInfo[] =>
  getAllGames().filter(g => g.category === 'racing');

// Get games by category
export const getGamesByCategory = (category: string): GameInfo[] =>
  getAllGames().filter(g => g.category === category);
