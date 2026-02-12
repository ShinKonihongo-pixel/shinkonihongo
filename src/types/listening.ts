// Listening Practice Types

import type { JLPTLevel } from './flashcard';

export type ListeningLessonType = 'practice' | 'conversation' | 'reading' | 'other' | 'bunpou' | 'reibun';

export interface ListeningFolder {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  lessonType?: ListeningLessonType; // Type of lesson: practice, conversation, reading, or other
  lessonNumber?: number; // Bài number (e.g., 1-25 for N5, 26-50 for N4)
  createdAt: Date;
  createdBy: string;
}

export interface ListeningAudio {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // in seconds
  jlptLevel: JLPTLevel;
  folderId: string;
  textContent?: string; // Japanese text for TTS playback
  isTextToSpeech?: boolean; // true if this entry uses browser TTS instead of audio file
  createdAt: Date;
  createdBy: string;
}

export interface ListeningQuestion {
  id: string;
  audioId: string;
  question: string;
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
  timestamp?: number; // optional timestamp for when question relates to
}
