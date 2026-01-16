// Slide templates for lecture editor
// Pre-made layouts for common teaching scenarios

import type { SlideFormData, SlideElement } from '../types/lecture';

// Template categories for organization
export type TemplateCategory = 'title' | 'content' | 'media' | 'quiz' | 'grammar' | 'vocabulary';

export interface SlideTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  thumbnail: string; // Simple text representation
  description: string;
  elements: SlideElement[];
  backgroundColor?: string;
}

// Generate unique IDs for elements
const genId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============ TITLE TEMPLATES ============
const titleSlideBasic: SlideTemplate = {
  id: 'title-basic',
  name: 'Tiêu đề cơ bản',
  category: 'title',
  thumbnail: '📌 Title',
  description: 'Slide tiêu đề đơn giản với tên bài và phụ đề',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: 'Tiêu đề bài học',
      position: { x: 10, y: 30, width: 80, height: 20 },
      style: { fontSize: '48px', fontWeight: 'bold', textAlign: 'center', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Phụ đề hoặc mô tả ngắn',
      position: { x: 15, y: 55, width: 70, height: 10 },
      style: { fontSize: '24px', fontStyle: 'italic', textAlign: 'center', color: '#7f8c8d' }
    }
  ],
  backgroundColor: '#ffffff'
};

const titleSlideJapanese: SlideTemplate = {
  id: 'title-japanese',
  name: 'Tiêu đề tiếng Nhật',
  category: 'title',
  thumbnail: '🇯🇵 日本語',
  description: 'Slide tiêu đề với kanji và romaji',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '第一課',
      position: { x: 10, y: 20, width: 80, height: 15 },
      style: { fontSize: '36px', textAlign: 'center', color: '#e74c3c' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Tiêu đề bài học',
      position: { x: 10, y: 40, width: 80, height: 20 },
      style: { fontSize: '48px', fontWeight: 'bold', textAlign: 'center', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Mục tiêu: Học viên sẽ...',
      position: { x: 15, y: 65, width: 70, height: 15 },
      style: { fontSize: '20px', textAlign: 'center', color: '#7f8c8d' }
    }
  ],
  backgroundColor: '#fef9e7'
};

// ============ CONTENT TEMPLATES ============
const contentBulletPoints: SlideTemplate = {
  id: 'content-bullets',
  name: 'Danh sách điểm',
  category: 'content',
  thumbnail: '• Bullets',
  description: 'Slide với các điểm chính dạng bullet',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: 'Nội dung chính',
      position: { x: 5, y: 5, width: 90, height: 12 },
      style: { fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'text',
      content: '• Điểm thứ nhất\n• Điểm thứ hai\n• Điểm thứ ba\n• Điểm thứ tư',
      position: { x: 5, y: 22, width: 90, height: 65 },
      style: { fontSize: '24px', lineHeight: '2', color: '#34495e' }
    }
  ],
  backgroundColor: '#ffffff'
};

const contentTwoColumns: SlideTemplate = {
  id: 'content-two-cols',
  name: 'Hai cột',
  category: 'content',
  thumbnail: '▌▐ 2 Cols',
  description: 'Slide chia 2 cột để so sánh',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: 'So sánh',
      position: { x: 5, y: 5, width: 90, height: 10 },
      style: { fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 5, y: 18, width: 43, height: 75 },
      style: { backgroundColor: '#e8f6f3', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Cột 1\n\n• Nội dung\n• Nội dung',
      position: { x: 7, y: 20, width: 39, height: 70 },
      style: { fontSize: '20px', lineHeight: '1.8', color: '#1abc9c' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 52, y: 18, width: 43, height: 75 },
      style: { backgroundColor: '#fdebd0', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Cột 2\n\n• Nội dung\n• Nội dung',
      position: { x: 54, y: 20, width: 39, height: 70 },
      style: { fontSize: '20px', lineHeight: '1.8', color: '#e67e22' }
    }
  ],
  backgroundColor: '#ffffff'
};

// ============ GRAMMAR TEMPLATES ============
const grammarPattern: SlideTemplate = {
  id: 'grammar-pattern',
  name: 'Mẫu ngữ pháp',
  category: 'grammar',
  thumbnail: '📖 Grammar',
  description: 'Giải thích cấu trúc ngữ pháp',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '文法 - Ngữ pháp',
      position: { x: 5, y: 3, width: 90, height: 10 },
      style: { fontSize: '28px', fontWeight: 'bold', color: '#8e44ad' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 5, y: 15, width: 90, height: 25 },
      style: { backgroundColor: '#f5eef8', borderRadius: '12px', border: '2px solid #8e44ad' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'N + は + Adj/Noun + です',
      position: { x: 10, y: 20, width: 80, height: 15 },
      style: { fontSize: '32px', fontWeight: 'bold', textAlign: 'center', color: '#8e44ad' }
    },
    {
      id: genId(),
      type: 'text',
      content: '📝 Giải thích:',
      position: { x: 5, y: 45, width: 90, height: 8 },
      style: { fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Đây là cấu trúc cơ bản để mô tả...',
      position: { x: 5, y: 55, width: 90, height: 15 },
      style: { fontSize: '18px', color: '#34495e' }
    },
    {
      id: genId(),
      type: 'text',
      content: '💡 Ví dụ:\n• これは本です。(Đây là sách.)\n• 私は学生です。(Tôi là sinh viên.)',
      position: { x: 5, y: 72, width: 90, height: 25 },
      style: { fontSize: '18px', lineHeight: '1.8', color: '#27ae60', backgroundColor: '#e8f8f5', padding: '12px', borderRadius: '8px' }
    }
  ],
  backgroundColor: '#ffffff'
};

const grammarComparison: SlideTemplate = {
  id: 'grammar-compare',
  name: 'So sánh ngữ pháp',
  category: 'grammar',
  thumbnail: '⚖️ Compare',
  description: 'So sánh 2 cấu trúc ngữ pháp',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '比較 - So sánh',
      position: { x: 5, y: 3, width: 90, height: 10 },
      style: { fontSize: '28px', fontWeight: 'bold', color: '#2980b9' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 3, y: 15, width: 45, height: 80 },
      style: { backgroundColor: '#ebf5fb', borderRadius: '12px' }
    },
    {
      id: genId(),
      type: 'text',
      content: '〜ている\n\nĐang làm gì đó\n(Hành động đang diễn ra)\n\n食べている\n= Đang ăn',
      position: { x: 5, y: 18, width: 41, height: 72 },
      style: { fontSize: '18px', lineHeight: '1.6', textAlign: 'center', color: '#2980b9' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'VS',
      position: { x: 45, y: 45, width: 10, height: 10 },
      style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#e74c3c' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 52, y: 15, width: 45, height: 80 },
      style: { backgroundColor: '#fef9e7', borderRadius: '12px' }
    },
    {
      id: genId(),
      type: 'text',
      content: '〜てある\n\nTrạng thái kết quả\n(Ai đó đã làm)\n\n書いてある\n= Đã được viết',
      position: { x: 54, y: 18, width: 41, height: 72 },
      style: { fontSize: '18px', lineHeight: '1.6', textAlign: 'center', color: '#f39c12' }
    }
  ],
  backgroundColor: '#ffffff'
};

// ============ VOCABULARY TEMPLATES ============
const vocabularyCard: SlideTemplate = {
  id: 'vocab-card',
  name: 'Thẻ từ vựng',
  category: 'vocabulary',
  thumbnail: '🔤 Vocab',
  description: 'Trình bày từ vựng với kanji, hiragana và nghĩa',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '単語 - Từ vựng',
      position: { x: 5, y: 3, width: 90, height: 8 },
      style: { fontSize: '24px', fontWeight: 'bold', color: '#16a085' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 10, y: 15, width: 80, height: 45 },
      style: { backgroundColor: '#e8f8f5', borderRadius: '16px', border: '3px solid #1abc9c' }
    },
    {
      id: genId(),
      type: 'text',
      content: '食べる',
      position: { x: 15, y: 20, width: 70, height: 20 },
      style: { fontSize: '56px', fontWeight: 'bold', textAlign: 'center', color: '#1abc9c' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'たべる (taberu)',
      position: { x: 15, y: 42, width: 70, height: 10 },
      style: { fontSize: '24px', textAlign: 'center', color: '#7f8c8d' }
    },
    {
      id: genId(),
      type: 'text',
      content: '🍽️ Ăn (Động từ nhóm 2)',
      position: { x: 10, y: 65, width: 80, height: 12 },
      style: { fontSize: '28px', textAlign: 'center', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'text',
      content: '例文: 朝ごはんを食べる。\n→ Ăn bữa sáng.',
      position: { x: 10, y: 80, width: 80, height: 18 },
      style: { fontSize: '18px', textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic' }
    }
  ],
  backgroundColor: '#ffffff'
};

const vocabularyList: SlideTemplate = {
  id: 'vocab-list',
  name: 'Danh sách từ vựng',
  category: 'vocabulary',
  thumbnail: '📋 List',
  description: 'Danh sách nhiều từ vựng',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '今日の単語 - Từ vựng hôm nay',
      position: { x: 5, y: 3, width: 90, height: 10 },
      style: { fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }
    },
    {
      id: genId(),
      type: 'text',
      content: '① 食べる (たべる) - Ăn\n② 飲む (のむ) - Uống\n③ 行く (いく) - Đi\n④ 来る (くる) - Đến\n⑤ 見る (みる) - Nhìn, xem',
      position: { x: 5, y: 18, width: 90, height: 75 },
      style: { fontSize: '24px', lineHeight: '2.2', color: '#2c3e50' }
    }
  ],
  backgroundColor: '#fff5f5'
};

// ============ QUIZ TEMPLATES ============
const quizMultipleChoice: SlideTemplate = {
  id: 'quiz-mc',
  name: 'Câu hỏi trắc nghiệm',
  category: 'quiz',
  thumbnail: '❓ Quiz',
  description: 'Câu hỏi với 4 đáp án',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '問題 - Câu hỏi',
      position: { x: 5, y: 3, width: 90, height: 8 },
      style: { fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 5, y: 13, width: 90, height: 20 },
      style: { backgroundColor: '#f5eef8', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: '「___」は日本語で何ですか？',
      position: { x: 7, y: 16, width: 86, height: 14 },
      style: { fontSize: '26px', textAlign: 'center', color: '#8e44ad' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'A. Đáp án 1',
      position: { x: 10, y: 38, width: 35, height: 12 },
      style: { fontSize: '22px', color: '#2c3e50', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'B. Đáp án 2',
      position: { x: 55, y: 38, width: 35, height: 12 },
      style: { fontSize: '22px', color: '#2c3e50', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'C. Đáp án 3',
      position: { x: 10, y: 55, width: 35, height: 12 },
      style: { fontSize: '22px', color: '#2c3e50', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'D. Đáp án 4',
      position: { x: 55, y: 55, width: 35, height: 12 },
      style: { fontSize: '22px', color: '#2c3e50', backgroundColor: '#ecf0f1', padding: '8px', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: '💡 Gợi ý: ...',
      position: { x: 10, y: 75, width: 80, height: 10 },
      style: { fontSize: '18px', fontStyle: 'italic', color: '#7f8c8d' }
    }
  ],
  backgroundColor: '#ffffff'
};

const quizFillBlank: SlideTemplate = {
  id: 'quiz-fill',
  name: 'Điền vào chỗ trống',
  category: 'quiz',
  thumbnail: '✍️ Fill',
  description: 'Bài tập điền từ',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: '練習 - Luyện tập',
      position: { x: 5, y: 3, width: 90, height: 8 },
      style: { fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }
    },
    {
      id: genId(),
      type: 'text',
      content: 'Điền từ thích hợp vào chỗ trống:',
      position: { x: 5, y: 15, width: 90, height: 8 },
      style: { fontSize: '20px', color: '#7f8c8d' }
    },
    {
      id: genId(),
      type: 'text',
      content: '1. 私は毎日 _______ を食べます。\n\n2. 田中さんは _______ へ行きます。\n\n3. これは _______ です。',
      position: { x: 5, y: 28, width: 90, height: 55 },
      style: { fontSize: '24px', lineHeight: '2.5', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 60, y: 85, width: 35, height: 12 },
      style: { backgroundColor: '#d5f5e3', borderRadius: '8px' }
    },
    {
      id: genId(),
      type: 'text',
      content: '📝 Từ gợi ý: ...',
      position: { x: 62, y: 87, width: 31, height: 8 },
      style: { fontSize: '16px', color: '#27ae60' }
    }
  ],
  backgroundColor: '#ffffff'
};

// ============ MEDIA TEMPLATES ============
const mediaImageRight: SlideTemplate = {
  id: 'media-img-right',
  name: 'Text + Hình phải',
  category: 'media',
  thumbnail: '📷 Img R',
  description: 'Nội dung bên trái, hình ảnh bên phải',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: 'Tiêu đề',
      position: { x: 3, y: 5, width: 55, height: 12 },
      style: { fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' }
    },
    {
      id: genId(),
      type: 'text',
      content: '• Nội dung điểm 1\n• Nội dung điểm 2\n• Nội dung điểm 3',
      position: { x: 3, y: 22, width: 55, height: 70 },
      style: { fontSize: '22px', lineHeight: '2', color: '#34495e' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 60, y: 5, width: 37, height: 90 },
      style: { backgroundColor: '#ecf0f1', borderRadius: '12px', border: '2px dashed #bdc3c7' }
    },
    {
      id: genId(),
      type: 'text',
      content: '🖼️\nThêm hình ảnh',
      position: { x: 65, y: 40, width: 27, height: 20 },
      style: { fontSize: '16px', textAlign: 'center', color: '#95a5a6' }
    }
  ],
  backgroundColor: '#ffffff'
};

const mediaVideoCenter: SlideTemplate = {
  id: 'media-video',
  name: 'Video trung tâm',
  category: 'media',
  thumbnail: '🎬 Video',
  description: 'Slide với video/embed ở giữa',
  elements: [
    {
      id: genId(),
      type: 'text',
      content: 'Xem video',
      position: { x: 5, y: 3, width: 90, height: 10 },
      style: { fontSize: '28px', fontWeight: 'bold', textAlign: 'center', color: '#e74c3c' }
    },
    {
      id: genId(),
      type: 'shape',
      content: '',
      position: { x: 10, y: 15, width: 80, height: 60 },
      style: { backgroundColor: '#1a1a2e', borderRadius: '12px' }
    },
    {
      id: genId(),
      type: 'text',
      content: '▶️\nNhấn để thêm video',
      position: { x: 35, y: 35, width: 30, height: 20 },
      style: { fontSize: '18px', textAlign: 'center', color: '#ffffff' }
    },
    {
      id: genId(),
      type: 'text',
      content: '📝 Ghi chú về video...',
      position: { x: 10, y: 80, width: 80, height: 15 },
      style: { fontSize: '18px', textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic' }
    }
  ],
  backgroundColor: '#ffffff'
};

// ============ EXPORT ALL TEMPLATES ============
export const SLIDE_TEMPLATES: SlideTemplate[] = [
  // Title
  titleSlideBasic,
  titleSlideJapanese,
  // Content
  contentBulletPoints,
  contentTwoColumns,
  // Grammar
  grammarPattern,
  grammarComparison,
  // Vocabulary
  vocabularyCard,
  vocabularyList,
  // Quiz
  quizMultipleChoice,
  quizFillBlank,
  // Media
  mediaImageRight,
  mediaVideoCenter,
];

// Get templates by category
export function getTemplatesByCategory(category: TemplateCategory): SlideTemplate[] {
  return SLIDE_TEMPLATES.filter(t => t.category === category);
}

// Get all categories
export function getTemplateCategories(): { id: TemplateCategory; name: string; icon: string }[] {
  return [
    { id: 'title', name: 'Tiêu đề', icon: '📌' },
    { id: 'content', name: 'Nội dung', icon: '📝' },
    { id: 'grammar', name: 'Ngữ pháp', icon: '📖' },
    { id: 'vocabulary', name: 'Từ vựng', icon: '🔤' },
    { id: 'quiz', name: 'Bài tập', icon: '❓' },
    { id: 'media', name: 'Media', icon: '🎬' },
  ];
}

// Create slide data from template
export function createSlideFromTemplate(template: SlideTemplate): SlideFormData {
  // Generate new IDs for all elements to avoid conflicts
  const newElements = template.elements.map(el => ({
    ...el,
    id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }));

  return {
    layout: 'content',
    title: template.name,
    elements: newElements,
    backgroundColor: template.backgroundColor || '#ffffff',
    animation: 'none',
    transition: 'fade',
    animationDuration: 500,
  };
}
