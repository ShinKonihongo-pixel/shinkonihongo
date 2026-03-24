// Answer option colors for quiz/game components
// Simple color-based design — no image icons

export interface AnswerOption {
  label: string;
  color: string;
  bg: string;
}

export const ANSWER_OPTIONS: AnswerOption[] = [
  { label: 'A', color: '#e74c3c', bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
  { label: 'B', color: '#3498db', bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' },
  { label: 'C', color: '#f1c40f', bg: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)' },
  { label: 'D', color: '#2ecc71', bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' },
];

// Helper to get answer option by index
export const getAnswerOption = (index: number): AnswerOption => {
  return ANSWER_OPTIONS[index] || ANSWER_OPTIONS[0];
};
