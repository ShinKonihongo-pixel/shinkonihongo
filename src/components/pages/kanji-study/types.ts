// Kanji study types and settings

export type MemorizationFilter = 'all' | 'memorized' | 'learning';

export interface FontSettings {
  fontSize: number; // px
  fontColor: string; // hex color
}

export type CardFlipStyle = 'horizontal' | 'vertical' | 'fade' | 'slide' | 'swing' | 'flip-up' | 'airplane' | 'crumple' | 'flyaway' | 'none';

export interface KanjiStudySettings {
  frontShow: {
    character: boolean;
    strokeOrder: boolean;
    onYomi: boolean;
    kunYomi: boolean;
    sinoVietnamese: boolean;
    meaning: boolean;
    level: boolean;
    lesson: boolean;
  };
  backShow: {
    character: boolean;
    onYomi: boolean;
    kunYomi: boolean;
    sinoVietnamese: boolean;
    meaning: boolean;
    mnemonic: boolean;
    radicals: boolean;
    sampleWords: boolean;
  };
  autoPlayStroke: boolean;
  frontFont: FontSettings;
  backFont: FontSettings;
  backTextSize: number; // unified px for all back content text
  cardFlipStyle: CardFlipStyle;
  cardScale: number; // percentage 60-150
}

export const DEFAULT_KANJI_SETTINGS: KanjiStudySettings = {
  frontShow: {
    character: true,
    strokeOrder: true,
    onYomi: false,
    kunYomi: false,
    sinoVietnamese: true,
    meaning: false,
    level: true,
    lesson: true,
  },
  backShow: {
    character: true,
    onYomi: true,
    kunYomi: true,
    sinoVietnamese: true,
    meaning: true,
    mnemonic: true,
    radicals: true,
    sampleWords: true,
  },
  autoPlayStroke: true,
  frontFont: { fontSize: 120, fontColor: '#e9d5ff' },
  backFont: { fontSize: 72, fontColor: '#e9d5ff' },
  backTextSize: 24,
  cardFlipStyle: 'horizontal',
  cardScale: 100,
};
