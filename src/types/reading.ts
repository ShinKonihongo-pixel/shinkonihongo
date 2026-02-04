// Reading Comprehension types

import type { JLPTLevel } from './flashcard';

export interface ReadingVocabulary {
  word: string;           // Từ vựng (kanji/hiragana)
  reading?: string;       // Cách đọc (hiragana)
  meaning: string;        // Nghĩa tiếng Việt
}

export interface ReadingAnswer {
  text: string;
  isCorrect: boolean;
}

export interface ReadingQuestion {
  id: string;
  question: string;           // Câu hỏi
  answers: ReadingAnswer[];   // 4 đáp án
  explanation?: string;       // Giải thích
}

export interface ReadingPassage {
  id: string;
  title: string;              // Tiêu đề bài đọc
  content: string;            // Nội dung đoạn văn
  questions: ReadingQuestion[]; // Danh sách câu hỏi
  vocabulary?: ReadingVocabulary[]; // Từ vựng mới
  jlptLevel: JLPTLevel;       // Level JLPT
  folderId?: string;          // Folder chứa bài đọc
  createdAt: string;
  createdBy?: string;
}

export interface ReadingFolder {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  order: number;
  createdAt: string;
  createdBy?: string;
}

export interface ReadingPassageFormData {
  title: string;
  content: string;
  questions: Omit<ReadingQuestion, 'id'>[];
  vocabulary?: ReadingVocabulary[];
  jlptLevel: JLPTLevel;
  folderId?: string;
}

export interface ReadingQuestionFormData {
  question: string;
  answers: ReadingAnswer[];
  explanation?: string;
}
