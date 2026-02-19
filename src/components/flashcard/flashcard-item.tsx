// Flashcard display component with flip animation

import React, { useState } from 'react';
import type { Flashcard, StructuredExample } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
import { CARD_FRAME_PRESETS } from '../../hooks/use-settings';
import { useTextToSpeech } from '../../hooks/use-text-to-speech';
import { Volume2 } from 'lucide-react';

interface FlashcardItemProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  settings?: AppSettings;
  lessonName?: string;
}

// Default settings for when not provided (e.g., in card management)
const defaultSettings: AppSettings = {
  kanjiFont: 'Noto Serif JP',
  kanjiBold: true,
  kanjiFontSize: 250,
  vocabularyFontSize: 28,
  sinoVietnameseFontSize: 32,
  meaningFontSize: 24,
  backFontSize: 100,
  frontTextColor: '#FFFFFF',
  exampleTextColor: '#94a3b8',
  furiganaTextColor: '#fdba74',
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
  cardBackgroundType: 'gradient',
  cardBackgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBackgroundColor: '#667eea',
  cardBackgroundImage: '',
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
  gameQuestionContent: 'kanji',
  gameAnswerContent: 'vocabulary_meaning',
  gameQuestionFontSize: 8,
  gameAnswerFontSize: 1.1,
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
  aiChallengePerAISettings: {},
  aiChallengePerLevelConfig: {},
  // JLPT defaults
  jlptDefaultQuestionCount: 20,
  jlptShowExplanation: true,
  jlptAutoNextDelay: 0,
  jlptPreventRepetition: true,
  jlptRepetitionCooldown: 3,
  jlptCoverageMode: 'balanced',
  jlptShowLevelAssessment: true,
  jlptTrackWeakAreas: true,
  // Daily words
  dailyWordsEnabled: true,
  dailyWordsTarget: 5,
  // Grammar card display defaults
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
  // Card size defaults
  cardScale: 100,
  grammarCardScale: 100,
  // Leveled example defaults
  exampleLevel: 'N5',
  exampleTranslationLang: 'vietnamese',
  // Quiz game defaults
  quizDifficultyMix: {
    super_hard: { super_hard: 60, hard: 25, medium: 10, easy: 5 },
    hard:       { super_hard: 20, hard: 45, medium: 25, easy: 10 },
    medium:     { super_hard: 5,  hard: 20, medium: 50, easy: 25 },
    easy:       { super_hard: 0,  hard: 10, medium: 30, easy: 60 },
  },
  quizJlptTimePerCategory: { vocabulary: 15, grammar: 20, reading: 30, listening: 25 },
};

// Get card frame styles based on settings
function getCardFrameStyle(settings: AppSettings): React.CSSProperties {
  if (settings.cardFrame === 'custom') {
    const cf = settings.customFrame;
    const style: React.CSSProperties = {
      border: `${cf.borderWidth}px ${cf.borderStyle} ${cf.borderColor}`,
      borderRadius: `${cf.borderRadius}px`,
    };
    if (cf.glowEnabled) {
      style.boxShadow = `0 0 ${cf.glowIntensity}px ${cf.glowColor}, 0 0 ${cf.glowIntensity * 2}px ${cf.glowColor}`;
    }
    return style;
  }
  const framePreset = CARD_FRAME_PRESETS.find(f => f.id === settings.cardFrame);
  return framePreset?.css || {};
}

// Get animation class for frame
function getFrameAnimationClass(settings: AppSettings): string {
  if (settings.cardFrame === 'custom') {
    if (settings.customFrame.animationEnabled) {
      switch (settings.customFrame.animationType) {
        case 'pulse': return 'frame-anim-pulse-gold';
        case 'glow': return 'frame-anim-glow-blue';
        case 'shimmer': return 'frame-anim-shimmer';
        default: return '';
      }
    }
    return '';
  }
  const framePreset = CARD_FRAME_PRESETS.find(f => f.id === settings.cardFrame);
  return framePreset?.animationClass || '';
}

// Parse furigana and separate Vietnamese translation
function parseFurigana(text: string, furiganaColor?: string): React.ReactNode {
  // Split by newline to separate Japanese and Vietnamese
  const lines = text.split('\n');
  const japaneseLine = lines[0] || '';
  const vietnameseLine = lines.slice(1).join('\n').trim();

  // Parse furigana in Japanese line: 漢字(かんじ) → <ruby>漢字<rt>かんじ</rt></ruby>
  const furiganaRegex = /([一-龯々]+)\(([ぁ-んァ-ン]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = furiganaRegex.exec(japaneseLine)) !== null) {
    if (match.index > lastIndex) {
      parts.push(japaneseLine.slice(lastIndex, match.index));
    }
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rt style={furiganaColor ? { color: furiganaColor } : undefined}>{match[2]}</rt>
      </ruby>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < japaneseLine.length) {
    parts.push(japaneseLine.slice(lastIndex));
  }

  // Return with Vietnamese translation on new line
  return (
    <>
      <span className="example-japanese">{parts.length > 0 ? parts : japaneseLine}</span>
      {vietnameseLine && (
        <span className="example-translation">{vietnameseLine}</span>
      )}
    </>
  );
}

// Parse furigana for a single Japanese line (no Vietnamese splitting)
function parseFuriganaJapanese(text: string, furiganaColor?: string): React.ReactNode {
  const furiganaRegex = /([一-龯々]+)\(([ぁ-んァ-ン]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = furiganaRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rt style={furiganaColor ? { color: furiganaColor } : undefined}>{match[2]}</rt>
      </ruby>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Render a structured example with translation based on settings
function renderStructuredExample(
  ex: StructuredExample,
  index: number,
  furiganaColor?: string,
  translationLang: 'vietnamese' | 'english' | 'both' = 'vietnamese'
): React.ReactNode {
  return (
    <div key={index} className="structured-example">
      <span className="example-japanese">{parseFuriganaJapanese(ex.japanese, furiganaColor)}</span>
      {translationLang === 'vietnamese' && ex.vietnamese && (
        <span className="example-translation">({ex.vietnamese})</span>
      )}
      {translationLang === 'english' && ex.english && (
        <span className="example-translation">({ex.english})</span>
      )}
      {translationLang === 'both' && (
        <>
          {ex.vietnamese && <span className="example-translation">({ex.vietnamese})</span>}
          {ex.english && <span className="example-translation example-translation-en">({ex.english})</span>}
        </>
      )}
    </div>
  );
}

const EXAMPLE_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

// Check if current screen is mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

// Get background style based on settings
function getCardBackgroundStyle(settings: AppSettings): React.CSSProperties {
  switch (settings.cardBackgroundType) {
    case 'solid':
      return { background: settings.cardBackgroundColor };
    case 'image':
      return settings.cardBackgroundImage
        ? {
            backgroundImage: `url(${settings.cardBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { background: settings.cardBackgroundGradient };
    case 'gradient':
    default:
      return { background: settings.cardBackgroundGradient };
  }
}


export function FlashcardItem({
  card,
  isFlipped,
  onFlip,
  showActions = false,
  onEdit,
  onDelete,
  settings = defaultSettings,
  lessonName,
}: FlashcardItemProps) {
  const { speak, isSpeaking } = useTextToSpeech();
  const isMobile = useIsMobile();
  const kanjiText = card.kanji || card.vocabulary;
  const [selectedExampleLevel, setSelectedExampleLevel] = useState<typeof EXAMPLE_LEVELS[number]>(
    (settings.exampleLevel as typeof EXAMPLE_LEVELS[number]) || 'N5'
  );
  const hasLeveledExamples = card.leveledExamples && EXAMPLE_LEVELS.some(l => (card.leveledExamples?.[l]?.length || 0) > 0);
  const lang = settings.exampleTranslationLang || 'vietnamese';

  // Get font sizes based on screen size (auto scale down 50% on mobile)
  // Apply backFontSize scale (100 = 100%) for back side elements
  const mobileScale = 0.5;
  const backScale = (settings.backFontSize || 100) / 100;
  const kanjiFontSize = isMobile
    ? Math.max(settings.kanjiFontSize * mobileScale, 80)
    : settings.kanjiFontSize;
  const vocabularyFontSize = isMobile
    ? Math.max(settings.vocabularyFontSize * mobileScale * backScale, 14)
    : settings.vocabularyFontSize * backScale;
  const sinoVietnameseFontSize = isMobile
    ? Math.max(settings.sinoVietnameseFontSize * mobileScale * backScale, 14)
    : settings.sinoVietnameseFontSize * backScale;
  const meaningFontSize = isMobile
    ? Math.max(settings.meaningFontSize * mobileScale * backScale, 12)
    : settings.meaningFontSize * backScale;

  // Resolve "auto" colors — front: white on gradient, back: contextual defaults
  const AUTO = 'auto';
  const resolvedFrontColor = settings.frontTextColor === AUTO ? '#FFFFFF' : (settings.frontTextColor || '#FFFFFF');
  const resolvedExampleColor = settings.exampleTextColor === AUTO ? '#4a4a4a' : (settings.exampleTextColor || '#4a4a4a');
  const resolvedFuriganaColor = settings.furiganaTextColor === AUTO ? '#c53d43' : (settings.furiganaTextColor || '#c53d43');

  // Speak the vocabulary (use vocabulary for correct pronunciation)
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip
    speak(card.vocabulary);
  };

  // Format level badge (e.g., "N5", "N5 > Bài 1")
  let levelBadge = card.jlptLevel;
  if (lessonName) {
    levelBadge += ` > ${lessonName}`;
  }

  return (
    <div className={`flashcard-container flip-${settings.cardFlipStyle || 'horizontal'}`}>
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={onFlip}
      >
        {/* Front side - Kanji only */}
        <div className={`flashcard-face flashcard-front ${getFrameAnimationClass(settings)}`} style={{ ...getCardBackgroundStyle(settings), ...getCardFrameStyle(settings) }}>
          <span className="jlpt-badge">{levelBadge}</span>
          <div className="card-content">
            <div className="kanji" style={{ fontSize: `${kanjiFontSize}px`, fontFamily: `"${settings.kanjiFont}", serif`, fontWeight: settings.kanjiBold ? 900 : 400, color: resolvedFrontColor }}>
              {kanjiText}
            </div>
          </div>
          <p className="flip-hint">Nhấn để lật thẻ</p>
        </div>

        {/* Back side - Answer (pro redesign) */}
        <div className={`flashcard-face flashcard-back ${getFrameAnimationClass(settings)}`} style={{ ...getCardFrameStyle(settings), '--back-scale': backScale } as React.CSSProperties}>
          <div className="card-back-header">
            <span className="jlpt-badge jlpt-badge-left">{levelBadge}</span>
            <button
              className={`speak-btn-header ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleSpeak}
              title="Nghe phát âm"
            >
              <Volume2 size={isMobile ? 16 : 18} />
            </button>
          </div>
          <div className={`card-content card-back-content ${!isMobile ? 'desktop-split' : ''}`}>
            {/* Left column: reading + meaning */}
            <div className="card-main-info">
              {settings.showSinoVietnamese && card.sinoVietnamese && (
                <div className="back-sino-vietnamese" style={{ fontSize: `${sinoVietnameseFontSize}px` }}>
                  {card.sinoVietnamese}
                </div>
              )}
              {settings.showVocabulary && (
                <div className="back-vocabulary" style={{ fontSize: `${vocabularyFontSize}px` }}>
                  {card.vocabulary}
                </div>
              )}
              {settings.showMeaning && (
                <div className="back-meaning-block">
                  {(lang === 'vietnamese' || lang === 'both') && (
                    <div className="back-meaning back-meaning-vi" style={{ fontSize: `${meaningFontSize}px` }}>
                      {card.meaning}
                    </div>
                  )}
                  {(lang === 'english' || lang === 'both') && card.english && (
                    <div className="back-meaning back-meaning-en" style={{ fontSize: `${meaningFontSize * 0.9}px` }}>
                      {card.english}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column: examples */}
            {settings.showExample && hasLeveledExamples && (
              <div className="card-example-section" style={{ color: resolvedExampleColor }}>
                <div className="example-level-pills" onClick={(e) => e.stopPropagation()}>
                  {EXAMPLE_LEVELS.map(level => {
                    const count = card.leveledExamples?.[level]?.length || 0;
                    return (
                      <button
                        key={level}
                        className={`example-level-pill ${selectedExampleLevel === level ? 'active' : ''} ${count === 0 ? 'empty' : ''}`}
                        onClick={() => count > 0 && setSelectedExampleLevel(level)}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <div className="example-list">
                  {(card.leveledExamples?.[selectedExampleLevel] || []).map((ex, idx) =>
                    renderStructuredExample(ex, idx, resolvedFuriganaColor, lang)
                  )}
                </div>
              </div>
            )}
            {settings.showExample && !hasLeveledExamples && card.examples && card.examples.length > 0 && (
              <div className="card-example-section" style={{ color: resolvedExampleColor }}>
                <span className="example-label">Ví dụ:</span>
                {card.examples.map((ex, idx) => (
                  <p key={idx}>{parseFurigana(ex, resolvedFuriganaColor)}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="card-actions">
          <button className="btn btn-edit" onClick={onEdit}>
            Sửa
          </button>
          <button className="btn btn-delete" onClick={onDelete}>
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}
