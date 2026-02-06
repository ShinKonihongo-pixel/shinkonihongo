// Listening Study View - Wrapper for listening practice within the study page
// Reuses existing listening-practice components (WordCard, PlaybackControls, InlineSettings, FilterButtons)

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, Headphones, Volume2 } from 'lucide-react';
import type { Flashcard, JLPTLevel } from '../../types/flashcard';
import type { MemorizationFilter } from '../pages/listening-practice/listening-practice-types';
import { WordCard } from '../pages/listening-practice/word-card';
import { PlaybackControls } from '../pages/listening-practice/playback-controls';
import { InlineSettings } from '../pages/listening-practice/inline-settings';
import { FilterButtons } from '../pages/listening-practice/filter-buttons';
import { LEVEL_THEMES } from '../ui/jlpt-level-selector';
import { useListeningSettings } from '../../contexts/listening-settings-context';
import { ListeningSettingsButton } from '../ui/listening-settings-modal';
import { ListeningSettingsModal } from '../ui/listening-settings-modal';
import { listeningPracticeStyles } from '../pages/listening-practice/listening-practice-styles';

interface ListeningStudyViewProps {
  flashcards: Flashcard[];
  selectedLevel: JLPTLevel;
  onBack: () => void;
  updateCard?: (id: string, data: Partial<Flashcard>) => void;
}

export function ListeningStudyView({
  flashcards,
  selectedLevel,
  onBack,
  updateCard,
}: ListeningStudyViewProps) {
  const { settings: listeningSettings } = useListeningSettings();

  // Local state
  const [memorizationFilter, setMemorizationFilter] = useState<MemorizationFilter>('all');
  const [showInlineSettings, setShowInlineSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(listeningSettings.defaultPlaybackSpeed);
  const [repeatCount, setRepeatCount] = useState(listeningSettings.defaultRepeatCount);
  const [delayBetweenWords, setDelayBetweenWords] = useState(listeningSettings.delayBetweenWords);
  const [autoPlayNext, setAutoPlayNext] = useState(listeningSettings.autoPlayNext);
  const [readMeaning, setReadMeaning] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Display settings from context
  const [showVocabulary, setShowVocabulary] = useState(listeningSettings.showVocabulary);
  const [showKanji, setShowKanji] = useState(listeningSettings.showKanji);
  const [showMeaning, setShowMeaning] = useState(listeningSettings.showMeaning);

  // Filter cards by memorization status
  const filteredCards = useMemo(() => {
    if (memorizationFilter === 'all') return flashcards;
    if (memorizationFilter === 'learned') {
      return flashcards.filter(c => c.memorizationStatus === 'memorized');
    }
    return flashcards.filter(c => c.memorizationStatus !== 'memorized');
  }, [flashcards, memorizationFilter]);

  // Shuffle logic
  useEffect(() => {
    if (isShuffled && filteredCards.length > 0) {
      const indices = Array.from({ length: filteredCards.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    } else {
      setShuffledIndices(Array.from({ length: filteredCards.length }, (_, i) => i));
    }
  }, [isShuffled, filteredCards.length]);

  const currentCard = filteredCards[shuffledIndices[currentIndex]] || null;

  // Sync settings when modal closes
  useEffect(() => {
    if (!showSettingsModal) {
      setPlaybackSpeed(listeningSettings.defaultPlaybackSpeed);
      setRepeatCount(listeningSettings.defaultRepeatCount);
      setDelayBetweenWords(listeningSettings.delayBetweenWords);
      setAutoPlayNext(listeningSettings.autoPlayNext);
      setShowVocabulary(listeningSettings.showVocabulary);
      setShowMeaning(listeningSettings.showMeaning);
      setShowKanji(listeningSettings.showKanji);
    }
  }, [showSettingsModal, listeningSettings]);

  // TTS playback effect (same pattern as listening-practice-page)
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    let isMounted = true;

    const speakText = (text: string, lang: 'ja-JP' | 'vi-VN'): Promise<void> => {
      return new Promise((resolve) => {
        if (!isMounted || !isPlayingRef.current) {
          resolve();
          return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = playbackSpeed;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    };

    const speakWord = async (repeatIndex: number = 0) => {
      if (!isMounted || !isPlayingRef.current || !currentCard) return;

      await speakText(currentCard.vocabulary, 'ja-JP');
      if (!isMounted || !isPlayingRef.current) return;

      if (readMeaning && currentCard.meaning) {
        await new Promise(r => setTimeout(r, 500));
        if (!isMounted || !isPlayingRef.current) return;
        await speakText(currentCard.meaning, 'vi-VN');
        if (!isMounted || !isPlayingRef.current) return;
      }

      const nextRepeat = repeatIndex + 1;
      if (nextRepeat < repeatCount) {
        setCurrentRepeat(nextRepeat);
        await new Promise(r => setTimeout(r, delayBetweenWords * 1000));
        if (isMounted && isPlayingRef.current) {
          speakWord(nextRepeat);
        }
      } else {
        setCurrentRepeat(0);
        if (autoPlayNext) {
          await new Promise(r => setTimeout(r, delayBetweenWords * 1000));
          if (!isMounted || !isPlayingRef.current) return;

          setCurrentIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex < shuffledIndices.length) {
              return nextIndex;
            } else if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return prevIndex;
            }
          });
        } else {
          setIsPlaying(false);
        }
      }
    };

    if (isPlaying && currentCard) {
      setCurrentRepeat(0);
      const timer = setTimeout(() => {
        if (isMounted && isPlayingRef.current && currentCard) {
          speakWord(0);
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        isMounted = false;
        window.speechSynthesis?.cancel();
      };
    }

    return () => {
      isMounted = false;
      window.speechSynthesis?.cancel();
    };
  }, [isPlaying, currentIndex, currentCard, playbackSpeed, repeatCount, delayBetweenWords, autoPlayNext, readMeaning, isLooping, shuffledIndices.length]);

  // Controls
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const goToNext = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (currentIndex < shuffledIndices.length - 1) {
      setCurrentIndex(i => i + 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(0);
      setCurrentRepeat(0);
    }
  }, [currentIndex, shuffledIndices.length, isLooping]);

  const goToPrevious = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(shuffledIndices.length - 1);
      setCurrentRepeat(0);
    }
  }, [currentIndex, shuffledIndices.length, isLooping]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(s => !s);
    setCurrentIndex(0);
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping(l => !l);
  }, []);

  const handleFilterChange = useCallback((filter: MemorizationFilter) => {
    setMemorizationFilter(filter);
    setCurrentIndex(0);
    setCurrentRepeat(0);
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  const getLessonName = useCallback((_lessonId: string) => {
    return '';
  }, []);

  return (
    <div className="listening-practice-page">
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
            <span className="mobile-lesson-name">Luyện nghe</span>
          </span>
          <h2 className="lesson-title">Luyện nghe</h2>
          <ListeningSettingsButton onClick={() => setShowSettingsModal(true)} />
        </div>

        <FilterButtons selected={memorizationFilter} onChange={handleFilterChange} />

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
            onUpdateCard={updateCard}
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
          onTogglePlay={togglePlay}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onToggleLoop={toggleLoop}
          onToggleShuffle={toggleShuffle}
        />

        <InlineSettings
          isOpen={showInlineSettings}
          playbackSpeed={playbackSpeed}
          repeatCount={repeatCount}
          delayBetweenWords={delayBetweenWords}
          autoPlayNext={autoPlayNext}
          readMeaning={readMeaning}
          onToggle={() => setShowInlineSettings(s => !s)}
          onSpeedChange={setPlaybackSpeed}
          onRepeatChange={setRepeatCount}
          onDelayChange={setDelayBetweenWords}
          onAutoPlayChange={setAutoPlayNext}
          onReadMeaningChange={setReadMeaning}
        />
      </div>

      <ListeningSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      <style>{listeningPracticeStyles}</style>
    </div>
  );
}
