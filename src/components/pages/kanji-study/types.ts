// Kanji study types and settings

export type MemorizationFilter = 'all' | 'memorized' | 'learning';

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
};
