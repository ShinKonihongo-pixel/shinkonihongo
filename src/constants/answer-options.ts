// Answer option icons and colors for quiz/game components
// Mascot icons with letters A, B, C, D

import answerA from '../assets/answer-icons/answer-a.png';
import answerB from '../assets/answer-icons/answer-b.png';
import answerC from '../assets/answer-icons/answer-c.png';
import answerD from '../assets/answer-icons/answer-d.png';

export interface AnswerOption {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export const ANSWER_OPTIONS: AnswerOption[] = [
  {
    label: 'A',
    icon: answerA,
    color: '#e74c3c',
    bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
  },
  {
    label: 'B',
    icon: answerB,
    color: '#3498db',
    bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
  },
  {
    label: 'C',
    icon: answerC,
    color: '#f1c40f',
    bg: 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)'
  },
  {
    label: 'D',
    icon: answerD,
    color: '#2ecc71',
    bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
  },
];

// Helper to get answer option by index
export const getAnswerOption = (index: number): AnswerOption => {
  return ANSWER_OPTIONS[index] || ANSWER_OPTIONS[0];
};
