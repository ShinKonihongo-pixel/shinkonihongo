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

// Bot intelligence levels (affects answer accuracy during gameplay)
export type BotIntelligence = 'weak' | 'average' | 'smart' | 'genius';

// Realistic Japanese first + last name combinations
const BOT_LAST_NAMES = [
  '田中', '佐藤', '鈴木', '高橋', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '松本', '井上', '木村', '林', '清水', '山口', '池田', '橋本',
  '阿部', '石川', '前田', '藤田', '小川', '岡田', '後藤', '村上', '長谷川', '近藤',
];
const BOT_FIRST_NAMES = [
  'さくら', 'ゆき', 'はな', 'りゅう', 'けんじ', 'あきら', 'めい', 'かいと',
  'そら', 'はるき', 'あおい', 'りん', 'たろう', 'ゆうま', 'ひなた', 'こうた',
  'みく', 'れん', 'なな', 'だいき', 'えみ', 'たけし', 'もも', 'しん',
  'あゆみ', 'こうじ', 'ゆい', 'まさ', 'けん', 'さき', 'りこ', 'ゆうと',
  'はると', 'みなと', 'いつき', 'あかり', 'ほのか', 'ここな', 'みさき', 'かなた',
];

// Human-like image avatars for bots (no emoji)
import { ILLUSTRATED_AVATARS, CUSTOM_AVATARS } from '../utils/avatar-icons';
const BOT_IMAGE_AVATARS = [...ILLUSTRATED_AVATARS, ...CUSTOM_AVATARS];

// Generate random bot with human-like appearance
export function generateBot(): { name: string; avatar: string; intelligence: BotIntelligence } {
  const lastName = BOT_LAST_NAMES[Math.floor(Math.random() * BOT_LAST_NAMES.length)];
  const firstName = BOT_FIRST_NAMES[Math.floor(Math.random() * BOT_FIRST_NAMES.length)];
  const avatar = BOT_IMAGE_AVATARS[Math.floor(Math.random() * BOT_IMAGE_AVATARS.length)];
  // Random intelligence distribution: 20% weak, 35% average, 30% smart, 15% genius
  const roll = Math.random();
  const intelligence: BotIntelligence = roll < 0.2 ? 'weak' : roll < 0.55 ? 'average' : roll < 0.85 ? 'smart' : 'genius';
  return { name: `${lastName} ${firstName}`, avatar, intelligence };
}

// Generate multiple unique bots
export function generateBots(count: number): Array<{ name: string; avatar: string; intelligence: BotIntelligence }> {
  const bots: Array<{ name: string; avatar: string; intelligence: BotIntelligence }> = [];
  const usedNames = new Set<string>();
  const usedAvatars = new Set<string>();

  while (bots.length < count) {
    const bot = generateBot();
    // Ensure unique name AND avatar
    if (!usedNames.has(bot.name) && !usedAvatars.has(bot.avatar)) {
      usedNames.add(bot.name);
      usedAvatars.add(bot.avatar);
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
