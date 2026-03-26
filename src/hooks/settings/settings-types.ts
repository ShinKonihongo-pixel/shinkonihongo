// All type definitions and constants for app settings
// Consumers: import from 'hooks/settings' or 'hooks/use-settings'

import type { JapaneseVoiceGender, JLPTLevel, ConversationStyle, KaiwaSendMode } from '../../types/kaiwa';

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
  backFontSize: number; // Scale factor for back side (100 = 100%)
  // Color settings
  frontTextColor: string;   // Front side text color
  exampleTextColor: string; // Example sentence color
  furiganaTextColor: string; // Furigana (reading) color
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

  // Card flip animation style
  cardFlipStyle: 'horizontal' | 'vertical' | 'fade' | 'slide' | 'zoom' | 'swing' | 'flip-up' | 'airplane' | 'crumple' | 'flyaway' | 'none';

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

  // Đại Chiến Tiếng Nhật — per-level difficulty mix (each row sums to ~100%)
  // Key = game difficulty chosen by player, Value = % of cards from each card difficulty
  quizDifficultyMix: Record<'super_hard' | 'hard' | 'medium' | 'easy', { super_hard: number; hard: number; medium: number; easy: number }>;
  // Đại Chiến Tiếng Nhật — JLPT time per question category (seconds)
  quizJlptTimePerCategory: { vocabulary: number; grammar: number; reading: number; listening: number };

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
  aiChallengePerAISettings: Partial<Record<AIDifficultyId, AICustomSettings>>; // Per-AI settings
  aiChallengePerLevelConfig: Partial<Record<JLPTLevelKey, JLPTLevelQuestionConfig>>; // Per-level question sources

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

  // Card size settings (scale percentage)
  cardScale: number;                         // Vocabulary card scale (60-150%, default 100)
  grammarCardScale: number;                  // Grammar card scale (60-150%, default 100)

  // Leveled example settings
  exampleLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';  // Which level's examples to show (default N5)
  exampleTranslationLang: 'vietnamese' | 'english' | 'both'; // Translation language (default vietnamese)
}
