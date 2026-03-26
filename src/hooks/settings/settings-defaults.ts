// Default values for all app settings
// Consumers: import from 'hooks/settings' or 'hooks/use-settings'

import type { AppSettings } from './settings-types';

export const DEFAULT_SETTINGS: AppSettings = {
  kanjiFont: 'Noto Serif JP',
  kanjiBold: true,
  kanjiFontSize: 250,
  vocabularyFontSize: 28,
  sinoVietnameseFontSize: 32,
  meaningFontSize: 24,
  backFontSize: 100, // 100% default scale
  frontTextColor: '#FFFFFF',
  exampleTextColor: '#94a3b8',
  furiganaTextColor: '#fdba74',
  // Mobile font sizes (smaller defaults for mobile screens)
  mobileKanjiFontSize: 120,
  mobileVocabularyFontSize: 20,
  mobileSinoVietnameseFontSize: 22,
  mobileMeaningFontSize: 18,
  showVocabulary: true,
  showSinoVietnamese: true,
  showMeaning: true,
  showExample: true,
  cardFlipStyle: 'horizontal',
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
  // Đại Chiến Tiếng Nhật defaults
  quizDifficultyMix: {
    super_hard: { super_hard: 60, hard: 25, medium: 10, easy: 5 },
    hard:       { super_hard: 20, hard: 45, medium: 25, easy: 10 },
    medium:     { super_hard: 5,  hard: 20, medium: 50, easy: 25 },
    easy:       { super_hard: 0,  hard: 10, medium: 30, easy: 60 },
  },
  quizJlptTimePerCategory: { vocabulary: 15, grammar: 20, reading: 30, listening: 25 },
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
  // Card size defaults (100% = normal size)
  cardScale: 100,
  grammarCardScale: 100,
  // Leveled example defaults
  exampleLevel: 'N5',
  exampleTranslationLang: 'vietnamese',
};
