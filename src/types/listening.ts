// Listening Practice Types

import type { JLPTLevel } from './flashcard';

export interface ListeningFolder {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
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
