// JLPT Test Question types

export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type QuestionCategory =
  | 'vocabulary'      // Từ vựng
  | 'grammar'         // Ngữ pháp
  | 'reading'         // Đọc hiểu
  | 'listening';      // Nghe

// Folder for organizing JLPT questions within a category
export interface JLPTFolder {
  id: string;
  name: string;
  level: JLPTLevel;
  category: QuestionCategory;
  order: number;
  createdBy?: string;
  createdAt: string;
}

export interface JLPTAnswer {
  text: string;
  isCorrect: boolean;
}

export interface JLPTQuestion {
  id: string;
  level: JLPTLevel;
  category: QuestionCategory;
  folderId?: string;          // Optional: folder containing this question
  question: string;           // Nội dung câu hỏi
  answers: JLPTAnswer[];      // 4 đáp án
  explanation?: string;       // Giải thích đáp án (optional)
  createdBy?: string;         // User ID của người tạo
  createdAt: string;
}

export interface JLPTQuestionFormData {
  level: JLPTLevel;
  category: QuestionCategory;
  folderId?: string;
  question: string;
  answers: JLPTAnswer[];
  explanation?: string;
}
