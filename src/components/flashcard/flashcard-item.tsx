// Flashcard display component with flip animation

import React from 'react';
import type { Flashcard } from '../../types/flashcard';
import type { AppSettings } from '../../hooks/use-settings';
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
  cardBackgroundType: 'gradient',
  cardBackgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBackgroundColor: '#667eea',
  cardBackgroundImage: '',
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
  // Weekly goals
  weeklyCardsTarget: 50,
  weeklyMinutesTarget: 60,
  // App background
  appBackground: 'default',
  appBackgroundCustomUrl: '',
};

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

  // Get font sizes based on screen size (auto scale down 50% on mobile)
  const mobileScale = 0.5;
  const kanjiFontSize = isMobile
    ? Math.max(settings.kanjiFontSize * mobileScale, 80)
    : settings.kanjiFontSize;
  const vocabularyFontSize = isMobile
    ? Math.max(settings.vocabularyFontSize * mobileScale, 14)
    : settings.vocabularyFontSize;
  const sinoVietnameseFontSize = isMobile
    ? Math.max(settings.sinoVietnameseFontSize * mobileScale, 14)
    : settings.sinoVietnameseFontSize;
  const meaningFontSize = isMobile
    ? Math.max(settings.meaningFontSize * mobileScale, 12)
    : settings.meaningFontSize;

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
    <div className="flashcard-container">
      <div
        className={`flashcard ${isFlipped ? 'flipped' : ''}`}
        onClick={onFlip}
      >
        {/* Front side - Kanji only */}
        <div className="flashcard-face flashcard-front" style={getCardBackgroundStyle(settings)}>
          <span className="jlpt-badge">{levelBadge}</span>
          <div className="card-content">
            <div className="kanji" style={{ fontSize: `${kanjiFontSize}px`, fontFamily: `"${settings.kanjiFont}", serif`, fontWeight: settings.kanjiBold ? 900 : 400 }}>
              {kanjiText}
            </div>
          </div>
          <p className="flip-hint">Nhấn để lật thẻ</p>
        </div>

        {/* Back side - Answer */}
        <div className="flashcard-face flashcard-back">
          <span className="jlpt-badge">{levelBadge}</span>
          <div className="card-content">
            {settings.showSinoVietnamese && card.sinoVietnamese && (
              <div className="sino-vietnamese" style={{ fontSize: `${sinoVietnameseFontSize}px` }}>
                {card.sinoVietnamese}
              </div>
            )}
            {settings.showVocabulary && (
              <div className="vocabulary-with-speaker">
                <div className="vocabulary" style={{ fontSize: `${vocabularyFontSize}px` }}>
                  {card.vocabulary}
                </div>
                <button
                  className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={handleSpeak}
                  title="Nghe phát âm"
                >
                  <Volume2 size={18} />
                </button>
              </div>
            )}
            {settings.showMeaning && (
              <div className="meaning" style={{ fontSize: `${meaningFontSize}px` }}>
                {card.meaning}
              </div>
            )}
            {settings.showExample && card.examples && card.examples.length > 0 && (
              <div className="example">
                <span className="example-label">Ví dụ:</span>
                {card.examples.map((ex, idx) => (
                  <p key={idx}>{ex}</p>
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
