// Flashcard data types for Japanese learning app

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Bài học - thuộc về 1 Level hoặc 1 bài học cha
export interface Lesson {
  id: string;
  name: string;           // Tên bài học (vd: "Bài 1", "Chương 2")
  jlptLevel: JLPTLevel;   // Thuộc JLPT level nào
  parentId: string | null; // ID bài học cha (null nếu là bài học gốc)
  order: number;          // Thứ tự sắp xếp
  isLocked: boolean;      // Khoá bài học (chỉ VIP/admin mới xem được)
  isHidden: boolean;      // Ẩn bài học (chỉ creator/super_admin thấy)
  createdBy?: string;     // User ID của người tạo
}

// Flashcard - thuộc về 1 Bài học
export interface Flashcard {
  id: string;
  vocabulary: string;      // Từ vựng chính (Kanji hoặc Hiragana)
  kanji: string;           // Kanji (có thể trống nếu từ không có Kanji)
  sinoVietnamese: string;  // Âm Hán Việt
  meaning: string;         // Nghĩa tiếng Việt
  examples: string[];      // Danh sách câu ví dụ
  jlptLevel: JLPTLevel;    // Level (để filter nhanh)
  lessonId: string;        // ID của bài học
  // Spaced Repetition (SM-2) fields
  easeFactor: number;      // Hệ số dễ, default 2.5
  interval: number;        // Số ngày đến lần review tiếp
  repetitions: number;     // Số lần ôn đúng liên tiếp
  nextReviewDate: string;  // ISO date string
  createdAt: string;       // ISO date string
  createdBy?: string;      // User ID của người tạo
  // Memorization tracking
  memorizationStatus: MemorizationStatus;
  difficultyLevel: DifficultyLevel;
}

// Quality rating cho SM-2 algorithm
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// Simplified rating buttons cho UI (legacy)
export type SimpleRating = 'again' | 'hard' | 'good' | 'easy';

// Memorization and difficulty system
export type MemorizationStatus = 'memorized' | 'not_memorized' | 'unset';
export type DifficultyLevel = 'hard' | 'medium' | 'easy' | 'unset';

export interface StudyStats {
  totalCards: number;
  cardsStudied: number;
  correctCount: number;
  againCount: number;
}

export interface FlashcardFormData {
  vocabulary: string;
  kanji: string;
  sinoVietnamese: string;
  meaning: string;
  examples: string[];
  jlptLevel: JLPTLevel;
  lessonId: string;
}

// Keep Category as alias for backward compatibility during migration
export type Category = Lesson;
