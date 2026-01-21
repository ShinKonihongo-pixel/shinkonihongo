// Kaiwa feature constants

import type { JLPTLevel, ConversationStyle, ConversationTopic, KaiwaScenario } from '../types/kaiwa';

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

// Role-based scenarios for conversation practice
export const KAIWA_SCENARIOS: KaiwaScenario[] = [
  {
    id: 'shopping',
    topic: 'shopping',
    title: '買い物',
    titleVi: 'Mua sắm',
    roles: [
      { id: 'customer', name: 'お客さん', nameVi: 'Khách hàng', emoji: '🛍️' },
      { id: 'staff', name: '店員', nameVi: 'Nhân viên', emoji: '👔' },
    ],
    defaultUserRole: 'customer',
    startRole: 'staff',
  },
  {
    id: 'restaurant',
    topic: 'restaurant',
    title: 'レストラン',
    titleVi: 'Nhà hàng',
    roles: [
      { id: 'customer', name: 'お客さん', nameVi: 'Khách hàng', emoji: '🍽️' },
      { id: 'waiter', name: '店員', nameVi: 'Nhân viên phục vụ', emoji: '👨‍🍳' },
    ],
    defaultUserRole: 'customer',
    startRole: 'waiter',
  },
  {
    id: 'directions',
    topic: 'directions',
    title: '道案内',
    titleVi: 'Hỏi đường',
    roles: [
      { id: 'lost', name: '道に迷った人', nameVi: 'Người bị lạc', emoji: '😅' },
      { id: 'local', name: '地元の人', nameVi: 'Người địa phương', emoji: '🙋' },
    ],
    defaultUserRole: 'lost',
    startRole: 'lost',
  },
  {
    id: 'work',
    topic: 'work',
    title: '仕事',
    titleVi: 'Công việc',
    roles: [
      { id: 'employee', name: '社員', nameVi: 'Nhân viên', emoji: '👨‍💼' },
      { id: 'boss', name: '上司', nameVi: 'Sếp', emoji: '👨‍💻' },
    ],
    defaultUserRole: 'employee',
    startRole: 'boss',
  },
  {
    id: 'self_intro',
    topic: 'self_intro',
    title: '自己紹介',
    titleVi: 'Tự giới thiệu',
    roles: [
      { id: 'new_person', name: '新入生・新入社員', nameVi: 'Người mới', emoji: '🙋' },
      { id: 'senpai', name: '先輩', nameVi: 'Đàn anh/chị', emoji: '😊' },
    ],
    defaultUserRole: 'new_person',
    startRole: 'senpai',
  },
  {
    id: 'travel',
    topic: 'travel',
    title: '旅行',
    titleVi: 'Du lịch',
    roles: [
      { id: 'tourist', name: '観光客', nameVi: 'Du khách', emoji: '📸' },
      { id: 'guide', name: 'ガイド', nameVi: 'Hướng dẫn viên', emoji: '🎯' },
    ],
    defaultUserRole: 'tourist',
    startRole: 'guide',
  },
];

// Get scenario by topic
export function getScenarioByTopic(topic: ConversationTopic): KaiwaScenario | undefined {
  return KAIWA_SCENARIOS.find(s => s.topic === topic);
}
