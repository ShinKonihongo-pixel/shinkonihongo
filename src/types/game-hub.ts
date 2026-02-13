// Game Hub Types - Unified game center for all mini-games

// Available games in the hub
export type GameType = 'quiz' | 'golden-bell' | 'picture-guess' | 'bingo' | 'kanji-battle' | 'word-match' | 'ai-challenge' | 'image-word' | 'word-scramble';

// Game info for display
export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  icon: string;
  iconImage?: string; // Optional image URL for custom icon
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
    name: 'Đại Chiến Tiếng Nhật',
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
  'bingo': {
    id: 'bingo',
    name: 'Bingo',
    description: 'Bốc số may mắn - 6 dãy số, ai BINGO trước thắng!',
    icon: '🎱',
    color: '#9C27B0',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #E040FB 100%)',
    playerRange: '2-20',
    features: ['6 dãy × 5 số', 'Kỹ năng đặc biệt', 'Multiplayer'],
    difficulty: 'easy',
    isNew: true,
    category: 'puzzle',
  },
  'kanji-battle': {
    id: 'kanji-battle',
    name: 'Đại Chiến Kanji',
    description: 'Đọc hoặc viết kanji nhanh nhất - tích điểm cao nhất thắng!',
    icon: '⚔️',
    color: '#FF5722',
    gradient: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
    playerRange: '2-20',
    features: ['Đọc Kanji', 'Viết Kanji', 'Kỹ năng đặc biệt'],
    difficulty: 'medium',
    isNew: true,
    category: 'quiz',
  },
  'word-match': {
    id: 'word-match',
    name: 'Nối Từ Thách Đấu',
    description: 'Nối cặp từ nhanh và chính xác - vòng quay may mắn!',
    icon: '🔗',
    color: '#00BCD4',
    gradient: 'linear-gradient(135deg, #00BCD4 0%, #4DD0E1 100%)',
    playerRange: '2-10',
    features: ['5 cặp/câu', 'Vòng quay', 'Thách đấu'],
    difficulty: 'easy',
    isNew: true,
    category: 'quiz',
  },
  'ai-challenge': {
    id: 'ai-challenge',
    name: 'Thách Đấu AI',
    description: 'Đấu trí 1v1 với AI - 10 cấp độ thử thách',
    icon: '🤖',
    iconImage: '/images/ai-robot.png',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    playerRange: '1',
    features: ['10 cấp AI', 'Mở khóa dần', 'Lưu tiến độ'],
    difficulty: 'medium',
    isNew: true,
    category: 'quiz',
  },
  'image-word': {
    id: 'image-word',
    name: 'Nối Hình - Từ',
    description: 'Nối hình ảnh với từ vựng tiếng Nhật tương ứng',
    icon: '🖼️',
    color: '#E91E63',
    gradient: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    playerRange: '1',
    features: ['Tự tạo bài', 'Ảnh tùy chỉnh', 'Lưu tiến độ'],
    difficulty: 'easy',
    isNew: true,
    category: 'puzzle',
  },
  'word-scramble': {
    id: 'word-scramble',
    name: 'Sắp Xếp Từ',
    description: 'Sắp xếp các chữ cái bị xáo trộn thành từ vựng đúng',
    icon: '🔀',
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    playerRange: '1',
    features: ['Chọn bài học', 'Gợi ý thông minh', 'Điểm theo thời gian'],
    difficulty: 'medium',
    isNew: true,
    category: 'puzzle',
  },
};

// Get all games as array
export const getAllGames = (): GameInfo[] => Object.values(GAMES);

// Get visible games (filtering out hidden ones)
export const getVisibleGames = (hiddenGameIds: GameType[]): GameInfo[] =>
  getAllGames().filter(g => !hiddenGameIds.includes(g.id));

// Get games by difficulty
export const getGamesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): GameInfo[] =>
  getAllGames().filter(g => g.difficulty === difficulty);

// Get popular games
export const getPopularGames = (): GameInfo[] =>
  getAllGames().filter(g => g.isPopular);

// Get new games
export const getNewGames = (): GameInfo[] =>
  getAllGames().filter(g => g.isNew);

// Get games by category
export const getGamesByCategory = (category: string): GameInfo[] =>
  getAllGames().filter(g => g.category === category);
