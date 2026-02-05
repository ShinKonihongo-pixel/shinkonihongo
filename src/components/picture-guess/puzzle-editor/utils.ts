// Utility functions for puzzle editor

import type { CustomPicturePuzzle } from '../../../types/picture-guess';
import type { SlideElement, PuzzleFormData } from './types';

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Convert puzzle to slide elements
export function puzzleToSlideElements(puzzle: CustomPicturePuzzle): SlideElement[] {
  const elements: SlideElement[] = [];

  // Add images
  if (puzzle.hintImages) {
    puzzle.hintImages.forEach((img, idx) => {
      elements.push({
        id: generateId(),
        type: 'image',
        content: img,
        x: 10 + (idx * 25),
        y: 10,
        width: 40,
        height: 60,
      });
    });
  }

  // Add text hint
  if (puzzle.hintText) {
    elements.push({
      id: generateId(),
      type: 'text',
      content: puzzle.hintText,
      x: 10,
      y: puzzle.hintImages?.length ? 75 : 30,
      width: 80,
      height: 20,
      fontSize: 24,
      fontColor: '#333333',
    });
  }

  return elements;
}

// Convert slide elements to puzzle data
export function slideElementsToPuzzleData(
  elements: SlideElement[],
  formData: PuzzleFormData,
  existingPuzzle?: CustomPicturePuzzle
) {
  const now = new Date().toISOString();

  const hintImages = elements
    .filter(el => el.type === 'image')
    .map(el => el.content);

  const hintTexts = elements
    .filter(el => el.type === 'text')
    .map(el => el.content);
  const hintText = hintTexts.join('\n');

  const slideLayout = JSON.stringify(elements);

  const baseData = {
    imageEmojis: slideLayout,
    hintText: hintText || undefined,
    hintImages: hintImages.length > 0 ? hintImages : undefined,
    word: formData.word,
    reading: formData.reading || undefined,
    meaning: formData.meaning,
    sinoVietnamese: formData.sinoVietnamese || undefined,
    difficulty: formData.difficulty,
    category: formData.category || undefined,
  };

  if (existingPuzzle) {
    return {
      ...existingPuzzle,
      ...baseData,
      updatedAt: now,
    };
  } else {
    return {
      ...baseData,
      id: generateId(),
      createdAt: now,
    } as CustomPicturePuzzle;
  }
}

// Get initial form data
export function getInitialFormData(): PuzzleFormData {
  return {
    word: '',
    reading: '',
    meaning: '',
    sinoVietnamese: '',
    difficulty: 'medium',
    category: '',
  };
}

// Convert puzzle to form data
export function puzzleToFormData(puzzle: CustomPicturePuzzle): PuzzleFormData {
  return {
    word: puzzle.word,
    reading: puzzle.reading || '',
    meaning: puzzle.meaning,
    sinoVietnamese: puzzle.sinoVietnamese || '',
    difficulty: puzzle.difficulty,
    category: puzzle.category || '',
  };
}
