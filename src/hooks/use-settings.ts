// Hook for managing app settings with localStorage persistence

import { useState, useCallback, useEffect } from 'react';
import type { JapaneseVoiceGender, JLPTLevel, ConversationStyle } from '../types/kaiwa';

export type CardBackgroundType = 'gradient' | 'solid' | 'image';

// Game content types
export type GameQuestionContent = 'kanji' | 'vocabulary' | 'meaning';
export type GameAnswerContent = 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning';

// Global theme settings (controlled by super_admin)
export interface GlobalTheme {
  primaryColor: string;
  primaryDark: string;
  bodyGradient: string;
}

export interface AppSettings {
  // Font settings
  kanjiFont: string;
  kanjiBold: boolean;
  kanjiFontSize: number;
  vocabularyFontSize: number;
  sinoVietnameseFontSize: number;
  meaningFontSize: number;
  // Mobile font sizes
  mobileKanjiFontSize: number;
  mobileVocabularyFontSize: number;
  mobileSinoVietnameseFontSize: number;
  mobileMeaningFontSize: number;

  // Field visibility
  showVocabulary: boolean;
  showSinoVietnamese: boolean;
  showMeaning: boolean;
  showExample: boolean;

  // Study behavior
  autoAdvanceOnThirdClick: boolean;
  clicksToAdvance: number;

  // Card background (front side)
  cardBackgroundType: CardBackgroundType;
  cardBackgroundGradient: string;
  cardBackgroundColor: string;
  cardBackgroundImage: string;

  // Game settings
  gameQuestionContent: GameQuestionContent;
  gameAnswerContent: GameAnswerContent;

  // Kaiwa (conversation) settings
  kaiwaVoiceGender: JapaneseVoiceGender;
  kaiwaVoiceRate: number;
  kaiwaAutoSpeak: boolean;
  kaiwaShowSuggestions: boolean;
  kaiwaShowFurigana: boolean;
  kaiwaDefaultLevel: JLPTLevel;
  kaiwaDefaultStyle: ConversationStyle;
  kaiwaShowTranslation: boolean;

  // Weekly goals
  weeklyCardsTarget: number;
  weeklyMinutesTarget: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  kanjiFont: 'Noto Serif JP',
  kanjiBold: true,
  kanjiFontSize: 250,
  vocabularyFontSize: 28,
  sinoVietnameseFontSize: 32,
  meaningFontSize: 24,
  // Mobile font sizes (smaller defaults for mobile screens)
  mobileKanjiFontSize: 120,
  mobileVocabularyFontSize: 20,
  mobileSinoVietnameseFontSize: 22,
  mobileMeaningFontSize: 18,
  showVocabulary: true,
  showSinoVietnamese: true,
  showMeaning: true,
  showExample: true,
  autoAdvanceOnThirdClick: true,
  clicksToAdvance: 3,
  // Card background defaults
  cardBackgroundType: 'gradient',
  cardBackgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBackgroundColor: '#667eea',
  cardBackgroundImage: '',
  // Game defaults: question = kanji, answer = vocabulary + meaning
  gameQuestionContent: 'kanji',
  gameAnswerContent: 'vocabulary_meaning',
  // Kaiwa defaults
  kaiwaVoiceGender: 'female',
  kaiwaVoiceRate: 1.0,
  kaiwaAutoSpeak: true,
  kaiwaShowSuggestions: true,
  kaiwaShowFurigana: true,
  kaiwaDefaultLevel: 'N5',
  kaiwaDefaultStyle: 'polite',
  kaiwaShowTranslation: true,
  // Weekly goals
  weeklyCardsTarget: 50,
  weeklyMinutesTarget: 60,
};

const STORAGE_KEY = 'flashcard-settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage when settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}

// Global theme hook (for super_admin)
const THEME_STORAGE_KEY = 'flashcard-global-theme';

const DEFAULT_THEME: GlobalTheme = {
  primaryColor: '#e74c3c',
  primaryDark: '#c0392b',
  bodyGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

// Theme presets
export const THEME_PRESETS = [
  { name: 'Đỏ (Mặc định)', primary: '#e74c3c', dark: '#c0392b', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Xanh dương', primary: '#3498db', dark: '#2980b9', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Xanh lá', primary: '#27ae60', dark: '#1e8449', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { name: 'Tím', primary: '#9b59b6', dark: '#7d3c98', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Cam', primary: '#e67e22', dark: '#d35400', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Hồng', primary: '#e91e63', dark: '#c2185b', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Xám đen', primary: '#34495e', dark: '#2c3e50', gradient: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { name: 'Vàng', primary: '#f1c40f', dark: '#d4ac0d', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
];

export function useGlobalTheme() {
  const [theme, setTheme] = useState<GlobalTheme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_THEME, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_THEME;
  });

  // Apply theme to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', theme.primaryColor);
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
    document.body.style.background = theme.bodyGradient;
  }, [theme]);

  // Save to localStorage when theme changes
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  const updateTheme = useCallback((newTheme: Partial<GlobalTheme>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  }, []);

  const applyPreset = useCallback((preset: typeof THEME_PRESETS[0]) => {
    setTheme({
      primaryColor: preset.primary,
      primaryDark: preset.dark,
      bodyGradient: preset.gradient,
    });
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, []);

  return {
    theme,
    updateTheme,
    applyPreset,
    resetTheme,
  };
}
