// Type definitions for puzzle editor

export interface SlideElement {
  id: string;
  type: 'image' | 'text';
  content: string; // base64 for image, text content for text
  x: number; // percentage position
  y: number;
  width: number; // percentage width
  height: number;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
}

export interface PuzzleFormData {
  word: string;
  reading: string;
  meaning: string;
  sinoVietnamese: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}
