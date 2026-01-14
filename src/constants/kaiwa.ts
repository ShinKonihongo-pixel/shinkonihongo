// Kaiwa feature constants

import type { JLPTLevel, ConversationStyle, ConversationTopic } from '../types/kaiwa';

export const JLPT_LEVELS: { value: JLPTLevel; label: string }[] = [
  { value: 'N5', label: 'N5 (Sơ cấp)' },
  { value: 'N4', label: 'N4' },
  { value: 'N3', label: 'N3' },
  { value: 'N2', label: 'N2' },
  { value: 'N1', label: 'N1 (Cao cấp)' },
];

export const CONVERSATION_STYLES: { value: ConversationStyle; label: string }[] = [
  { value: 'casual', label: 'Thân mật (タメ口)' },
  { value: 'polite', label: 'Lịch sự (です/ます)' },
  { value: 'formal', label: 'Trang trọng (敬語)' },
];

export const CONVERSATION_TOPICS: { value: ConversationTopic; label: string; icon: string }[] = [
  { value: 'free', label: 'Tự do', icon: '💬' },
  { value: 'greetings', label: 'Chào hỏi (挨拶)', icon: '👋' },
  { value: 'self_intro', label: 'Tự giới thiệu (自己紹介)', icon: '🙋' },
  { value: 'shopping', label: 'Mua sắm (買い物)', icon: '🛍️' },
  { value: 'restaurant', label: 'Nhà hàng (レストラン)', icon: '🍽️' },
  { value: 'travel', label: 'Du lịch (旅行)', icon: '✈️' },
  { value: 'work', label: 'Công việc (仕事)', icon: '💼' },
  { value: 'hobbies', label: 'Sở thích (趣味)', icon: '🎮' },
  { value: 'weather', label: 'Thời tiết (天気)', icon: '🌤️' },
  { value: 'directions', label: 'Hỏi đường (道案内)', icon: '🗺️' },
];

// Get style display text
export function getStyleDisplay(style: ConversationStyle): string {
  return style === 'casual' ? 'タメ口' : style === 'polite' ? 'です/ます' : '敬語';
}
