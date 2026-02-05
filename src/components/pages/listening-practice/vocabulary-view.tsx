// Vocabulary Practice View - Main practice interface
import { ChevronLeft, Headphones, Volume2 } from 'lucide-react';
import type { Flashcard, JLPTLevel } from '../../../types/flashcard';
import type { MemorizationFilter } from './listening-practice-types';
import { LEVEL_THEMES } from '../../ui/jlpt-level-selector';
import { ListeningSettingsButton } from '../../ui/listening-settings-modal';
import { FilterButtons } from './filter-buttons';
import { WordCard } from './word-card';
import { PlaybackControls } from './playback-controls';
import { InlineSettings } from './inline-settings';

interface VocabularyViewProps {
  selectedLevel: JLPTLevel;
  selectedLessonId: string;
  filteredCards: Flashcard[];
  currentCard: Flashcard | null;
  currentIndex: number;
  currentRepeat: number;
  isPlaying: boolean;
  isLooping: boolean;
  isShuffled: boolean;
  memorizationFilter: MemorizationFilter;
  playbackSpeed: number;
  repeatCount: number;
  delayBetweenWords: number;
  autoPlayNext: boolean;
  readMeaning: boolean;
  showVocabulary: boolean;
  showKanji: boolean;
  showMeaning: boolean;
  showInlineSettings: boolean;
  onBack: () => void;
  onOpenSettings: () => void;
  onFilterChange: (filter: MemorizationFilter) => void;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onSpeedChange: (speed: number) => void;
  onRepeatChange: (count: number) => void;
  onDelayChange: (delay: number) => void;
  onAutoPlayChange: (value: boolean) => void;
  onReadMeaningChange: (value: boolean) => void;
  onToggleInlineSettings: () => void;
  onUpdateCard?: (id: string, data: Partial<Flashcard>) => void;
  getLessonName: (lessonId: string) => string;
}

export function VocabularyView({
  selectedLevel,
  selectedLessonId,
  filteredCards,
  currentCard,
  currentIndex,
  currentRepeat,
  isPlaying,
  isLooping,
  isShuffled,
  memorizationFilter,
  playbackSpeed,
  repeatCount,
  delayBetweenWords,
  autoPlayNext,
  readMeaning,
  showVocabulary,
  showKanji,
  showMeaning,
  showInlineSettings,
  onBack,
  onOpenSettings,
  onFilterChange,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleLoop,
  onToggleShuffle,
  onSpeedChange,
  onRepeatChange,
  onDelayChange,
  onAutoPlayChange,
  onReadMeaningChange,
  onToggleInlineSettings,
  onUpdateCard,
  getLessonName,
}: VocabularyViewProps) {
  return (
    <div className="vocabulary-mode">
      <div className="vocab-header">
        <button className="btn-back" onClick={onBack}>
          <ChevronLeft size={20} />
        </button>
        <span
          className="current-level desktop-level"
          style={{ background: LEVEL_THEMES[selectedLevel].gradient }}
        >
          {selectedLevel}
        </span>
        <span className="mobile-lesson-info">
          <Headphones size={18} />
          <span className="mobile-lesson-name">{getLessonName(selectedLessonId)}</span>
        </span>
        <h2 className="lesson-title">{getLessonName(selectedLessonId)}</h2>
        <ListeningSettingsButton onClick={onOpenSettings} />
      </div>

      <FilterButtons selected={memorizationFilter} onChange={onFilterChange} />

      <div className="vocab-stats">{filteredCards.length} từ vựng</div>

      {currentCard && (
        <WordCard
          card={currentCard}
          currentIndex={currentIndex}
          totalCards={filteredCards.length}
          currentRepeat={currentRepeat}
          repeatCount={repeatCount}
          showVocabulary={showVocabulary}
          showKanji={showKanji}
          showMeaning={showMeaning}
          levelGlow={LEVEL_THEMES[selectedLevel].glow}
          getLessonName={getLessonName}
          onUpdateCard={onUpdateCard}
        />
      )}

      {filteredCards.length === 0 && (
        <div className="empty-state">
          <Volume2 size={48} />
          <p>Không có từ vựng nào.</p>
          <p className="hint">Thử thay đổi bộ lọc để xem thêm từ.</p>
        </div>
      )}

      <PlaybackControls
        isPlaying={isPlaying}
        isLooping={isLooping}
        isShuffled={isShuffled}
        disabled={!currentCard}
        onTogglePlay={onTogglePlay}
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleLoop={onToggleLoop}
        onToggleShuffle={onToggleShuffle}
      />

      <InlineSettings
        isOpen={showInlineSettings}
        playbackSpeed={playbackSpeed}
        repeatCount={repeatCount}
        delayBetweenWords={delayBetweenWords}
        autoPlayNext={autoPlayNext}
        readMeaning={readMeaning}
        onToggle={onToggleInlineSettings}
        onSpeedChange={onSpeedChange}
        onRepeatChange={onRepeatChange}
        onDelayChange={onDelayChange}
        onAutoPlayChange={onAutoPlayChange}
        onReadMeaningChange={onReadMeaningChange}
      />
    </div>
  );
}
