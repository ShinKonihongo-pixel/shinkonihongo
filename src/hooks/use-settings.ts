// Hook for managing app settings with localStorage persistence

import { useState, useCallback, useEffect } from 'react';
import type { JapaneseVoiceGender, JLPTLevel, ConversationStyle, KaiwaSendMode } from '../types/kaiwa';

export type CardBackgroundType = 'gradient' | 'solid' | 'image';

// Card frame type - decorative borders for flashcards
export type CardFrameId = 'none' | 'solid-gold' | 'solid-silver' | 'solid-bronze' | 'solid-rose' | 'solid-sky' | 'solid-mint' | 'solid-coral' | 'solid-purple' | 'solid-indigo' | 'solid-teal' | 'double-gold' | 'double-black' | 'double-red' | 'double-blue' | 'dashed-gold' | 'dashed-rainbow' | 'gradient-sunset' | 'gradient-ocean' | 'gradient-forest' | 'gradient-aurora' | 'gradient-fire' | 'shadow-elegant' | 'shadow-neon-blue' | 'shadow-neon-pink' | 'shadow-glow' | 'corner-fancy' | 'corner-floral' | 'corner-star' | 'ornate-vintage' | 'ornate-royal' | 'anim-pulse-gold' | 'anim-pulse-rainbow' | 'anim-glow-blue' | 'anim-glow-pink' | 'anim-shimmer' | 'custom';

// Custom frame settings
export interface CustomFrameSettings {
  borderWidth: number;
  borderStyle: 'solid' | 'double' | 'dashed' | 'dotted' | 'ridge' | 'groove';
  borderColor: string;
  borderRadius: number;
  glowEnabled: boolean;
  glowColor: string;
  glowIntensity: number;
  animationEnabled: boolean;
  animationType: 'none' | 'pulse' | 'glow' | 'shimmer';
}

// App background type
export type AppBackgroundId = 'default' | 'doraemon' | 'hello_kitty' | 'superhero' | 'dragon' | 'galaxy' | 'cyberpunk' | 'nature' | 'anime_boy' | 'fire' | 'ocean' | 'minecraft' | 'naruto' | 'custom';

// Game content types
export type GameQuestionContent = 'kanji' | 'vocabulary' | 'meaning';
export type GameAnswerContent = 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning';

// Game question source types
export type GameQuestionSource = 'all' | 'jlpt_level' | 'lesson' | 'memorization';
export type JLPTLevelOption = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type MemorizationFilter = 'all' | 'memorized' | 'not_memorized';
export type AutoAddDifficulty = 'random' | 'easy' | 'medium' | 'hard';

// JLPT Level keys
export type JLPTLevelKey = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Per-AI custom settings
export type FlashcardDifficulty = 'easy' | 'medium' | 'hard' | 'super_hard';
export interface AICustomSettings {
  accuracyModifier: number;      // -20 to +20, adjusts AI accuracy
  speedMultiplier: number;       // 0.5 to 2.0, adjusts AI speed
  minDifficulty: FlashcardDifficulty; // Minimum question difficulty
  // Per-level lesson selection: which lessons to pull questions from
  // Empty array = all lessons in that level
  selectedLessonIds: Record<JLPTLevelKey, string[]>;
}

// All 27 AI IDs
export type AIDifficultyId =
  | 'gentle' | 'friendly' | 'curious' | 'eager' | 'clever' | 'diligent' | 'quick' | 'smart' | 'sharp'
  | 'skilled' | 'excellent' | 'talented' | 'brilliant' | 'genius' | 'elite' | 'master' | 'grandmaster' | 'sage'
  | 'superior' | 'unbeatable' | 'mythical' | 'legendary' | 'immortal' | 'divine' | 'celestial' | 'supreme' | 'champion';

// Default AI custom settings (empty selectedLessonIds = all lessons)
export const DEFAULT_AI_CUSTOM_SETTINGS: AICustomSettings = {
  accuracyModifier: 0,
  speedMultiplier: 1.0,
  minDifficulty: 'easy',
  selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] },
};

// Question source types (used in question generation)
export type QuestionSource = 'vocabulary' | 'kanji' | 'grammar';

// Per-JLPT-level question configuration
export interface JLPTLevelQuestionConfig {
  sources: QuestionSource[];
  difficulties: FlashcardDifficulty[];
}

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

  // Card frame (decorative border)
  cardFrame: CardFrameId;
  customFrame: CustomFrameSettings;

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
  kaiwaSendMode: KaiwaSendMode;           // auto or manual send after speech
  kaiwaAutoSendThreshold: number;         // accuracy % to trigger auto-send (default: 80)
  kaiwaAutoSendDelay: number;             // delay in seconds before auto-send (default: 1.5)

  // Weekly goals
  weeklyCardsTarget: number;
  weeklyMinutesTarget: number;

  // Daily words goal
  dailyWordsEnabled: boolean;
  dailyWordsTarget: 5 | 10 | 15 | 20;

  // App background
  appBackground: AppBackgroundId;
  appBackgroundCustomUrl: string;

  // Game Question Source Settings (all games)
  gameQuestionSources: GameQuestionSource[];
  gameSelectedJLPTLevels: JLPTLevelOption[];
  gameSelectedLessons: string[];
  gameMemorizationFilter: MemorizationFilter;

  // AI Challenge Settings
  aiChallengeQuestionCount: number;        // 5-20, default 10
  aiChallengeTimePerQuestion: number;      // 5-30 seconds, default 15
  aiChallengeAccuracyModifier: number;     // -20 to +20, default 0 (global fallback)
  aiChallengeSpeedMultiplier: number;      // 0.5-2.0, default 1.0 (global fallback)
  aiChallengeAutoAddDifficulty: AutoAddDifficulty; // Difficulty when auto-adding cards
  aiChallengeLevel: 'all' | 'N5' | 'N4' | 'N3' | 'N2' | 'N1';  // JLPT level filter for questions
  aiChallengePerAISettings: Record<AIDifficultyId, AICustomSettings>; // Per-AI settings
  aiChallengePerLevelConfig: Record<JLPTLevelKey, JLPTLevelQuestionConfig>; // Per-level question sources

  // JLPT Practice Settings
  jlptDefaultQuestionCount: number;        // Default question count per session
  jlptShowExplanation: boolean;            // Show explanation after each question
  jlptAutoNextDelay: number;               // Auto-advance delay (0 = manual, 1-5 seconds)
  jlptPreventRepetition: boolean;          // Avoid repeating recently answered questions
  jlptRepetitionCooldown: number;          // How many sessions before allowing repeat (1-10)
  jlptCoverageMode: 'random' | 'balanced' | 'weak_first';  // Question selection strategy
  jlptShowLevelAssessment: boolean;        // Show detailed assessment after practice
  jlptTrackWeakAreas: boolean;             // Track and suggest weak areas

  // Grammar Card Display Settings - Front side
  grammarFrontShowTitle: boolean;          // Show grammar title on front
  grammarFrontShowFormula: boolean;        // Show formula on front
  grammarFrontShowMeaning: boolean;        // Show meaning on front
  grammarFrontShowExplanation: boolean;    // Show explanation on front
  grammarFrontShowExamples: boolean;       // Show examples on front
  grammarFrontShowLevel: boolean;          // Show JLPT level badge on front
  grammarFrontShowLesson: boolean;         // Show lesson badge on front
  // Grammar Card Display Settings - Back side
  grammarBackShowTitle: boolean;           // Show grammar title on back
  grammarBackShowFormula: boolean;         // Show formula on back
  grammarBackShowMeaning: boolean;         // Show meaning on back
  grammarBackShowExplanation: boolean;     // Show explanation on back
  grammarBackShowExamples: boolean;        // Show examples on back
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
  // Card frame default
  cardFrame: 'none',
  customFrame: {
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: '#FFD700',
    borderRadius: 12,
    glowEnabled: true,
    glowColor: '#FFD700',
    glowIntensity: 10,
    animationEnabled: false,
    animationType: 'none',
  },
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
  kaiwaSendMode: 'manual',
  kaiwaAutoSendThreshold: 80,
  kaiwaAutoSendDelay: 1.5,
  // Weekly goals
  weeklyCardsTarget: 50,
  weeklyMinutesTarget: 60,
  // Daily words goal
  dailyWordsEnabled: true,
  dailyWordsTarget: 5,
  // App background
  appBackground: 'default',
  appBackgroundCustomUrl: '',
  // Game Question Source defaults
  gameQuestionSources: ['all'],
  gameSelectedJLPTLevels: [],
  gameSelectedLessons: [],
  gameMemorizationFilter: 'all',
  // AI Challenge defaults
  aiChallengeQuestionCount: 10,
  aiChallengeTimePerQuestion: 15,
  aiChallengeAccuracyModifier: 0,
  aiChallengeSpeedMultiplier: 1.0,
  aiChallengeAutoAddDifficulty: 'random',
  aiChallengeLevel: 'all',
  // Per-AI settings with progressive difficulty
  // Note: selectedLessonIds empty = all lessons in that level
  aiChallengePerAISettings: {
    // Session 1: Khởi Đầu (easy questions, low accuracy, slow)
    gentle:    { accuracyModifier: -15, speedMultiplier: 0.6, minDifficulty: 'easy', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    friendly:  { accuracyModifier: -12, speedMultiplier: 0.65, minDifficulty: 'easy', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    curious:   { accuracyModifier: -10, speedMultiplier: 0.7, minDifficulty: 'easy', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    eager:     { accuracyModifier: -8, speedMultiplier: 0.75, minDifficulty: 'easy', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    clever:    { accuracyModifier: -6, speedMultiplier: 0.8, minDifficulty: 'easy', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    diligent:  { accuracyModifier: -4, speedMultiplier: 0.85, minDifficulty: 'easy', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    quick:     { accuracyModifier: -2, speedMultiplier: 0.9, minDifficulty: 'medium', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    smart:     { accuracyModifier: 0, speedMultiplier: 0.95, minDifficulty: 'medium', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    sharp:     { accuracyModifier: 2, speedMultiplier: 1.0, minDifficulty: 'medium', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    // Session 2: Thử Thách (medium questions, moderate accuracy, faster)
    skilled:     { accuracyModifier: 3, speedMultiplier: 1.05, minDifficulty: 'medium', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    excellent:   { accuracyModifier: 4, speedMultiplier: 1.1, minDifficulty: 'medium', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    talented:    { accuracyModifier: 5, speedMultiplier: 1.15, minDifficulty: 'medium', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    brilliant:   { accuracyModifier: 6, speedMultiplier: 1.2, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    genius:      { accuracyModifier: 7, speedMultiplier: 1.25, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    elite:       { accuracyModifier: 8, speedMultiplier: 1.3, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    master:      { accuracyModifier: 9, speedMultiplier: 1.35, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    grandmaster: { accuracyModifier: 10, speedMultiplier: 1.4, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    sage:        { accuracyModifier: 11, speedMultiplier: 1.45, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    // Session 3: Huyền Thoại (hard questions, high accuracy, fastest)
    superior:   { accuracyModifier: 12, speedMultiplier: 1.5, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    unbeatable: { accuracyModifier: 13, speedMultiplier: 1.55, minDifficulty: 'hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    mythical:   { accuracyModifier: 14, speedMultiplier: 1.6, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    legendary:  { accuracyModifier: 15, speedMultiplier: 1.65, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    immortal:   { accuracyModifier: 16, speedMultiplier: 1.7, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    divine:     { accuracyModifier: 17, speedMultiplier: 1.75, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    celestial:  { accuracyModifier: 18, speedMultiplier: 1.8, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    supreme:    { accuracyModifier: 19, speedMultiplier: 1.9, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
    champion:   { accuracyModifier: 20, speedMultiplier: 2.0, minDifficulty: 'super_hard', selectedLessonIds: { N5: [], N4: [], N3: [], N2: [], N1: [] } },
  },
  // Per-JLPT-level question source configuration
  aiChallengePerLevelConfig: {
    N5: { sources: ['vocabulary', 'kanji', 'grammar'], difficulties: ['easy', 'medium'] },
    N4: { sources: ['vocabulary', 'kanji', 'grammar'], difficulties: ['easy', 'medium', 'hard'] },
    N3: { sources: ['vocabulary', 'kanji', 'grammar'], difficulties: ['medium', 'hard'] },
    N2: { sources: ['vocabulary', 'kanji', 'grammar'], difficulties: ['medium', 'hard', 'super_hard'] },
    N1: { sources: ['vocabulary', 'kanji', 'grammar'], difficulties: ['hard', 'super_hard'] },
  },
  // JLPT defaults
  jlptDefaultQuestionCount: 20,
  jlptShowExplanation: true,
  jlptAutoNextDelay: 0,
  jlptPreventRepetition: true,
  jlptRepetitionCooldown: 3,
  jlptCoverageMode: 'balanced',
  jlptShowLevelAssessment: true,
  jlptTrackWeakAreas: true,
  // Grammar card display defaults - Front: title + formula, Back: meaning + explanation + examples
  grammarFrontShowTitle: true,
  grammarFrontShowFormula: true,
  grammarFrontShowMeaning: false,
  grammarFrontShowExplanation: false,
  grammarFrontShowExamples: false,
  grammarFrontShowLevel: true,
  grammarFrontShowLesson: true,
  grammarBackShowTitle: false,
  grammarBackShowFormula: false,
  grammarBackShowMeaning: true,
  grammarBackShowExplanation: true,
  grammarBackShowExamples: true,
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

// Card frame presets - decorative border styles
export interface CardFramePreset {
  id: CardFrameId;
  name: string;
  category: 'basic' | 'double' | 'dashed' | 'gradient' | 'shadow' | 'corner' | 'ornate' | 'animated' | 'custom';
  css: React.CSSProperties;
  preview: string; // Preview border for UI
  animationClass?: string; // CSS animation class name
}

export const CARD_FRAME_PRESETS: CardFramePreset[] = [
  // None
  { id: 'none', name: 'Không khung', category: 'basic', css: {}, preview: 'transparent' },

  // Basic solid borders (10)
  { id: 'solid-gold', name: 'Vàng Kim', category: 'basic', css: { border: '4px solid #FFD700', boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }, preview: '#FFD700' },
  { id: 'solid-silver', name: 'Bạc', category: 'basic', css: { border: '4px solid #C0C0C0', boxShadow: '0 0 10px rgba(192, 192, 192, 0.5)' }, preview: '#C0C0C0' },
  { id: 'solid-bronze', name: 'Đồng', category: 'basic', css: { border: '4px solid #CD7F32', boxShadow: '0 0 10px rgba(205, 127, 50, 0.5)' }, preview: '#CD7F32' },
  { id: 'solid-rose', name: 'Hồng Rose', category: 'basic', css: { border: '4px solid #FF69B4', boxShadow: '0 0 10px rgba(255, 105, 180, 0.5)' }, preview: '#FF69B4' },
  { id: 'solid-sky', name: 'Xanh Da Trời', category: 'basic', css: { border: '4px solid #87CEEB', boxShadow: '0 0 10px rgba(135, 206, 235, 0.5)' }, preview: '#87CEEB' },
  { id: 'solid-mint', name: 'Xanh Mint', category: 'basic', css: { border: '4px solid #98FF98', boxShadow: '0 0 10px rgba(152, 255, 152, 0.5)' }, preview: '#98FF98' },
  { id: 'solid-coral', name: 'San Hô', category: 'basic', css: { border: '4px solid #FF7F50', boxShadow: '0 0 10px rgba(255, 127, 80, 0.5)' }, preview: '#FF7F50' },
  { id: 'solid-purple', name: 'Tím Violet', category: 'basic', css: { border: '4px solid #9370DB', boxShadow: '0 0 10px rgba(147, 112, 219, 0.5)' }, preview: '#9370DB' },
  { id: 'solid-indigo', name: 'Chàm', category: 'basic', css: { border: '4px solid #4B0082', boxShadow: '0 0 10px rgba(75, 0, 130, 0.5)' }, preview: '#4B0082' },
  { id: 'solid-teal', name: 'Xanh Ngọc', category: 'basic', css: { border: '4px solid #008080', boxShadow: '0 0 10px rgba(0, 128, 128, 0.5)' }, preview: '#008080' },

  // Double borders (4)
  { id: 'double-gold', name: 'Đôi Vàng', category: 'double', css: { border: '6px double #FFD700', boxShadow: 'inset 0 0 0 2px #FFD700' }, preview: '#FFD700' },
  { id: 'double-black', name: 'Đôi Đen', category: 'double', css: { border: '6px double #333333', boxShadow: 'inset 0 0 0 2px #333333' }, preview: '#333333' },
  { id: 'double-red', name: 'Đôi Đỏ', category: 'double', css: { border: '6px double #DC143C', boxShadow: 'inset 0 0 0 2px #DC143C' }, preview: '#DC143C' },
  { id: 'double-blue', name: 'Đôi Xanh', category: 'double', css: { border: '6px double #1E90FF', boxShadow: 'inset 0 0 0 2px #1E90FF' }, preview: '#1E90FF' },

  // Dashed borders (2)
  { id: 'dashed-gold', name: 'Nét Đứt Vàng', category: 'dashed', css: { border: '4px dashed #FFD700' }, preview: '#FFD700' },
  { id: 'dashed-rainbow', name: 'Nét Đứt Cầu Vồng', category: 'dashed', css: { border: '4px dashed transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }, preview: 'linear-gradient(90deg, red, orange, yellow, green, blue)' },

  // Gradient borders (5)
  { id: 'gradient-sunset', name: 'Hoàng Hôn', category: 'gradient', css: { border: '4px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }, preview: 'linear-gradient(135deg, #ff6b6b, #feca57)' },
  { id: 'gradient-ocean', name: 'Đại Dương', category: 'gradient', css: { border: '4px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #667eea, #764ba2)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }, preview: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'gradient-forest', name: 'Rừng Xanh', category: 'gradient', css: { border: '4px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #11998e, #38ef7d)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }, preview: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { id: 'gradient-aurora', name: 'Cực Quang', category: 'gradient', css: { border: '4px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #a8edea, #fed6e3, #d299c2)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }, preview: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { id: 'gradient-fire', name: 'Lửa', category: 'gradient', css: { border: '4px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #f12711, #f5af19)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }, preview: 'linear-gradient(135deg, #f12711, #f5af19)' },

  // Shadow/glow effects (4)
  { id: 'shadow-elegant', name: 'Bóng Sang Trọng', category: 'shadow', css: { border: '2px solid #333', boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(255,255,255,0.1)' }, preview: '#333333' },
  { id: 'shadow-neon-blue', name: 'Neon Xanh', category: 'shadow', css: { border: '2px solid #00f3ff', boxShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 30px #00f3ff, inset 0 0 10px rgba(0, 243, 255, 0.2)' }, preview: '#00f3ff' },
  { id: 'shadow-neon-pink', name: 'Neon Hồng', category: 'shadow', css: { border: '2px solid #ff00ff', boxShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff, inset 0 0 10px rgba(255, 0, 255, 0.2)' }, preview: '#ff00ff' },
  { id: 'shadow-glow', name: 'Phát Sáng', category: 'shadow', css: { border: '3px solid #fff', boxShadow: '0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.5), inset 0 0 15px rgba(255,255,255,0.3)' }, preview: '#ffffff' },

  // Corner decorations (3)
  { id: 'corner-fancy', name: 'Góc Trang Trí', category: 'corner', css: { border: '3px solid #FFD700', borderRadius: '0', clipPath: 'polygon(0 10%, 10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%)' }, preview: '#FFD700' },
  { id: 'corner-floral', name: 'Góc Hoa', category: 'corner', css: { border: '4px solid #FF69B4', borderRadius: '20px 5px 20px 5px' }, preview: '#FF69B4' },
  { id: 'corner-star', name: 'Góc Sao', category: 'corner', css: { border: '4px solid #FFD700', borderRadius: '5px 20px 5px 20px', boxShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }, preview: '#FFD700' },

  // Ornate/vintage (2)
  { id: 'ornate-vintage', name: 'Cổ Điển', category: 'ornate', css: { border: '8px ridge #8B4513', boxShadow: 'inset 0 0 10px rgba(139, 69, 19, 0.5)' }, preview: '#8B4513' },
  { id: 'ornate-royal', name: 'Hoàng Gia', category: 'ornate', css: { border: '6px groove #FFD700', boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 10px rgba(255, 215, 0, 0.2)' }, preview: '#FFD700' },

  // Animated frames (5)
  { id: 'anim-pulse-gold', name: 'Nhịp Vàng', category: 'animated', css: { border: '4px solid #FFD700' }, preview: '#FFD700', animationClass: 'frame-anim-pulse-gold' },
  { id: 'anim-pulse-rainbow', name: 'Nhịp Cầu Vồng', category: 'animated', css: { border: '4px solid transparent' }, preview: 'linear-gradient(90deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff)', animationClass: 'frame-anim-pulse-rainbow' },
  { id: 'anim-glow-blue', name: 'Sáng Xanh', category: 'animated', css: { border: '3px solid #00f3ff' }, preview: '#00f3ff', animationClass: 'frame-anim-glow-blue' },
  { id: 'anim-glow-pink', name: 'Sáng Hồng', category: 'animated', css: { border: '3px solid #ff00ff' }, preview: '#ff00ff', animationClass: 'frame-anim-glow-pink' },
  { id: 'anim-shimmer', name: 'Lấp Lánh', category: 'animated', css: { border: '4px solid #FFD700' }, preview: '#FFD700', animationClass: 'frame-anim-shimmer' },

  // Custom frame
  { id: 'custom', name: 'Tự tạo', category: 'custom', css: {}, preview: 'linear-gradient(45deg, #667eea, #764ba2)' },
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
