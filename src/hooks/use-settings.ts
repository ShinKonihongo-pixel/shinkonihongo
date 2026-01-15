// Hook for managing app settings with localStorage persistence

import { useState, useCallback, useEffect } from 'react';
import type { JapaneseVoiceGender, JLPTLevel, ConversationStyle } from '../types/kaiwa';

export type CardBackgroundType = 'gradient' | 'solid' | 'image';

// App background type
export type AppBackgroundId = 'default' | 'doraemon' | 'hello_kitty' | 'superhero' | 'dragon' | 'galaxy' | 'cyberpunk' | 'nature' | 'anime_boy' | 'fire' | 'ocean' | 'minecraft' | 'naruto' | 'custom';

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
  gameQuestionFontSize: number;  // Font size for game questions (rem)
  gameAnswerFontSize: number;    // Font size for game answers (rem)

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

  // App background
  appBackground: AppBackgroundId;
  appBackgroundCustomUrl: string;
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
  gameQuestionFontSize: 8,   // 8rem default
  gameAnswerFontSize: 1.1,   // 1.1rem default
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
  // App background
  appBackground: 'default',
  appBackgroundCustomUrl: '',
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

// App background presets
export interface AppBackgroundPreset {
  id: AppBackgroundId;
  name: string;
  category: 'cute' | 'cool' | 'nature' | 'default';
  css: string; // CSS background value
  preview: string; // Preview color/gradient for UI
}

export const APP_BACKGROUND_PRESETS: AppBackgroundPreset[] = [
  // Default
  { id: 'default', name: 'Mặc định', category: 'default', css: '', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },

  // Cute category (for girls)
  { id: 'hello_kitty', name: 'Hello Kitty', category: 'cute', css: 'linear-gradient(135deg, #ffb6c1 0%, #ff69b4 50%, #fff0f5 100%)', preview: '#ffb6c1' },
  { id: 'doraemon', name: 'Doraemon', category: 'cute', css: 'linear-gradient(135deg, #4da6ff 0%, #0080ff 50%, #b3d9ff 100%)', preview: '#4da6ff' },

  // Cool category (for boys)
  { id: 'superhero', name: 'Siêu Nhân', category: 'cool', css: 'linear-gradient(135deg, #ff0000 0%, #cc0000 30%, #1a1a2e 70%, #16213e 100%)', preview: '#ff0000' },
  { id: 'dragon', name: 'Rồng Lửa', category: 'cool', css: 'linear-gradient(135deg, #ff4500 0%, #ff6600 30%, #1a1a1a 70%, #2d2d2d 100%)', preview: '#ff4500' },
  { id: 'galaxy', name: 'Thiên Hà', category: 'cool', css: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', preview: '#302b63' },
  { id: 'cyberpunk', name: 'Cyberpunk', category: 'cool', css: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 50%, #1a0033 100%)', preview: '#ff00ff' },
  { id: 'fire', name: 'Lửa Bùng Cháy', category: 'cool', css: 'linear-gradient(180deg, #1a1a1a 0%, #4d0000 30%, #ff4500 60%, #ffcc00 100%)', preview: '#ff4500' },
  { id: 'naruto', name: 'Naruto', category: 'cool', css: 'linear-gradient(135deg, #ff6600 0%, #ff9900 30%, #1a1a2e 70%, #ff6600 100%)', preview: '#ff6600' },
  { id: 'minecraft', name: 'Minecraft', category: 'cool', css: 'linear-gradient(180deg, #87ceeb 0%, #87ceeb 50%, #228b22 50%, #228b22 70%, #8b4513 70%, #8b4513 100%)', preview: '#228b22' },
  { id: 'anime_boy', name: 'Anime Dark', category: 'cool', css: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #4a0080 100%)', preview: '#1a1a2e' },

  // Nature category
  { id: 'nature', name: 'Thiên Nhiên', category: 'nature', css: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)', preview: '#56ab2f' },
  { id: 'ocean', name: 'Đại Dương', category: 'nature', css: 'linear-gradient(180deg, #87ceeb 0%, #1e90ff 50%, #000080 100%)', preview: '#1e90ff' },

  // Custom
  { id: 'custom', name: 'Tùy chỉnh (URL)', category: 'default', css: '', preview: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)' },
];

// Theme presets - Professional color schemes
export const THEME_PRESETS = [
  // Classic & Professional
  { name: 'Đỏ San Hô', primary: '#e74c3c', dark: '#c0392b', gradient: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' },
  { name: 'Xanh Đại Dương', primary: '#0984e3', dark: '#0652DD', gradient: 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)' },
  { name: 'Xanh Ngọc', primary: '#00b894', dark: '#00a085', gradient: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)' },
  { name: 'Tím Lavender', primary: '#6c5ce7', dark: '#5f4fcf', gradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' },

  // Modern & Trendy
  { name: 'Cam Sunset', primary: '#e17055', dark: '#d35400', gradient: 'linear-gradient(135deg, #e17055 0%, #fdcb6e 100%)' },
  { name: 'Hồng Rose', primary: '#fd79a8', dark: '#e84393', gradient: 'linear-gradient(135deg, #fd79a8 0%, #fab1a0 100%)' },
  { name: 'Xanh Mint', primary: '#00cec9', dark: '#00b5ad', gradient: 'linear-gradient(135deg, #00cec9 0%, #81ecec 100%)' },
  { name: 'Vàng Mật Ong', primary: '#fdcb6e', dark: '#f9a826', gradient: 'linear-gradient(135deg, #f9a826 0%, #fdcb6e 100%)' },

  // Dark & Elegant
  { name: 'Xám Slate', primary: '#636e72', dark: '#2d3436', gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)' },
  { name: 'Xanh Navy', primary: '#2c3e50', dark: '#1a252f', gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)' },
  { name: 'Tím Đêm', primary: '#5f27cd', dark: '#341f97', gradient: 'linear-gradient(135deg, #341f97 0%, #5f27cd 100%)' },
  { name: 'Đen Obsidian', primary: '#1e272e', dark: '#0f1419', gradient: 'linear-gradient(135deg, #0f1419 0%, #1e272e 100%)' },

  // Nature & Soft
  { name: 'Xanh Forest', primary: '#27ae60', dark: '#1e8449', gradient: 'linear-gradient(135deg, #1e8449 0%, #27ae60 100%)' },
  { name: 'Nâu Coffee', primary: '#8e7161', dark: '#6d4c41', gradient: 'linear-gradient(135deg, #6d4c41 0%, #a1887f 100%)' },
  { name: 'Xanh Sky', primary: '#74b9ff', dark: '#0984e3', gradient: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)' },
  { name: 'Hồng Pastel', primary: '#fab1a0', dark: '#e17055', gradient: 'linear-gradient(135deg, #fab1a0 0%, #ffeaa7 100%)' },
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
