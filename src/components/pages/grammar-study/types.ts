// Type definitions for grammar study

export type ViewMode = 'select' | 'study';
export type MemorizationFilter = 'all' | 'memorized' | 'learning';

export interface GrammarStudySettings {
  frontShow: {
    title: boolean;
    formula: boolean;
    meaning: boolean;
    explanation: boolean;
    examples: boolean;
    level: boolean;
    lesson: boolean;
  };
  backShow: {
    title: boolean;
    formula: boolean;
    meaning: boolean;
    explanation: boolean;
    examples: boolean;
  };
  frontFontSize: number;
  backFontSize: number;
  cardScale: number;
  cardFlipStyle: 'horizontal' | 'vertical' | 'fade' | 'slide' | 'swing' | 'flip-up' | 'airplane' | 'crumple' | 'flyaway' | 'none';
}

export const DEFAULT_SETTINGS: GrammarStudySettings = {
  frontShow: {
    title: true,
    formula: true,
    meaning: false,
    explanation: false,
    examples: false,
    level: true,
    lesson: true,
  },
  backShow: {
    title: false,
    formula: false,
    meaning: true,
    explanation: true,
    examples: true,
  },
  frontFontSize: 16,
  backFontSize: 22,
  cardScale: 100,
  cardFlipStyle: 'horizontal',
};
