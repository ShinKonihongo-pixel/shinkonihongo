// Speaking practice topics configuration

import type { SpeakingTopic, SpeakingTopicId } from '../types/speaking-practice';

export const SPEAKING_TOPICS: SpeakingTopic[] = [
  {
    id: 'greetings',
    name: '挨拶',
    nameVi: 'Chào hỏi',
    icon: '👋',
    description: 'Luyện các mẫu câu chào hỏi, tự giới thiệu cơ bản',
    color: '#10b981',
  },
  {
    id: 'shopping',
    name: '買い物',
    nameVi: 'Mua sắm',
    icon: '🛍️',
    description: 'Hỏi giá, kích cỡ, màu sắc khi mua hàng',
    color: '#f59e0b',
  },
  {
    id: 'restaurant',
    name: 'レストラン',
    nameVi: 'Nhà hàng',
    icon: '🍽️',
    description: 'Gọi món, thanh toán, hỏi thực đơn',
    color: '#ef4444',
  },
  {
    id: 'travel',
    name: '旅行',
    nameVi: 'Du lịch',
    icon: '✈️',
    description: 'Đặt vé, check-in khách sạn, hỏi thông tin',
    color: '#3b82f6',
  },
  {
    id: 'directions',
    name: '道案内',
    nameVi: 'Hỏi đường',
    icon: '🗺️',
    description: 'Hỏi và chỉ đường, phương hướng di chuyển',
    color: '#8b5cf6',
  },
  {
    id: 'work',
    name: '仕事',
    nameVi: 'Công việc',
    icon: '💼',
    description: 'Giao tiếp văn phòng, họp, báo cáo',
    color: '#6366f1',
  },
  {
    id: 'hobbies',
    name: '趣味',
    nameVi: 'Sở thích',
    icon: '🎮',
    description: 'Nói về sở thích, hoạt động yêu thích',
    color: '#ec4899',
  },
  {
    id: 'healthcare',
    name: '病院',
    nameVi: 'Bệnh viện',
    icon: '🏥',
    description: 'Khám bệnh, mô tả triệu chứng, mua thuốc',
    color: '#14b8a6',
  },
];

// Get topic by ID
export function getSpeakingTopicById(id: SpeakingTopicId): SpeakingTopic | undefined {
  return SPEAKING_TOPICS.find(t => t.id === id);
}

// Topic-specific dialogue prompts for AI
export const SPEAKING_TOPIC_PROMPTS: Record<SpeakingTopicId, string> = {
  greetings: `Create a greeting/self-introduction dialogue. Include:
- Morning/afternoon/evening greetings
- Self-introduction (name, occupation, hobbies)
- Asking about the other person
- Polite farewell`,

  shopping: `Create a shopping dialogue. Include:
- Greeting the shop staff
- Asking about items (size, color, price)
- Trying on / looking at items
- Making a purchase or politely declining`,

  restaurant: `Create a restaurant dialogue. Include:
- Being greeted and seated
- Looking at menu, asking recommendations
- Ordering food and drinks
- Asking for the bill, payment`,

  travel: `Create a travel-related dialogue. Include:
- Asking about transportation/tickets
- Hotel check-in/check-out
- Asking for tourist information
- Expressing preferences and needs`,

  directions: `Create a directions dialogue. Include:
- Politely stopping someone to ask
- Asking how to get to a place
- Understanding directions (left, right, straight)
- Thanking and confirming`,

  work: `Create a workplace dialogue. Include:
- Morning greetings with colleagues
- Discussing work tasks or meetings
- Making requests or asking for help
- Professional communication`,

  hobbies: `Create a hobbies discussion dialogue. Include:
- Asking about hobbies
- Explaining your own hobbies
- Discussing frequency and reasons
- Suggesting activities together`,

  healthcare: `Create a medical/healthcare dialogue. Include:
- Describing symptoms to a doctor
- Answering health-related questions
- Understanding instructions/prescriptions
- Pharmacy interactions`,
};

// Number of lines to generate per level
export const SPEAKING_LINES_PER_LEVEL: Record<string, number> = {
  N5: 4,
  N4: 5,
  N3: 6,
  N2: 6,
  N1: 8,
};
