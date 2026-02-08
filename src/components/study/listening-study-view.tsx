// Listening Study View - Vocabulary listening practice within the study page
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
import { ListeningSettingsButton, ListeningSettingsModal } from '../ui/listening-settings-modal';
import { listeningPracticeStyles } from '../pages/listening-practice/listening-practice-styles';

interface ListeningStudyViewProps {
  flashcards: Flashcard[];
  selectedLevel: JLPTLevel;
  onBack: () => void;
  updateCard?: (id: string, data: Partial<Flashcard>) => void;
}

// TTS helper - speaks text and resolves when done
function speakText(
  text: string,
  lang: 'ja-JP' | 'vi-VN',
  rate: number,
  signal: { cancelled: boolean },
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.cancelled) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

// Cancellable delay
function delay(ms: number, signal: { cancelled: boolean }): Promise<void> {
  return new Promise((resolve) => {
    if (signal.cancelled) { resolve(); return; }
    const id = setTimeout(resolve, ms);
    // Check periodically so cancellation is responsive
    const check = setInterval(() => {
      if (signal.cancelled) { clearTimeout(id); clearInterval(check); resolve(); }
    }, 50);
    // Clean up interval when timeout fires naturally
    const origResolve = resolve;
    resolve = (() => { clearInterval(check); origResolve(); }) as typeof resolve;
  });
}

export function ListeningStudyView({
  flashcards,
  selectedLevel,
  onBack,
  updateCard,
}: ListeningStudyViewProps) {
  const { settings: listeningSettings } = useListeningSettings();

  // UI state
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
  // Stable seed to avoid reshuffle on every filter change
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Display settings
  const [showVocabulary, setShowVocabulary] = useState(listeningSettings.showVocabulary);
  const [showKanji, setShowKanji] = useState(listeningSettings.showKanji);
  const [showMeaning, setShowMeaning] = useState(listeningSettings.showMeaning);

  // Filter cards
  const filteredCards = useMemo(() => {
    if (memorizationFilter === 'all') return flashcards;
    if (memorizationFilter === 'learned') return flashcards.filter(c => c.memorizationStatus === 'memorized');
    return flashcards.filter(c => c.memorizationStatus !== 'memorized');
  }, [flashcards, memorizationFilter]);

  // Shuffle indices - useMemo (synchronous, no flicker from async setState)
  const shuffledIndices = useMemo(() => {
    const indices = Array.from({ length: filteredCards.length }, (_, i) => i);
    if (isShuffled && filteredCards.length > 1) {
      // Seeded Fisher-Yates for stable shuffle
      let seed = shuffleSeed || 1;
      const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }
    return indices;
  }, [isShuffled, filteredCards.length, shuffleSeed]);

  const currentCard = filteredCards[shuffledIndices[currentIndex]] || null;
  const currentCardId = currentCard?.id ?? null;

  // Refs for TTS settings (read inside async loop, don't re-trigger effect)
  const settingsRef = useRef({ playbackSpeed, repeatCount, delayBetweenWords, autoPlayNext, readMeaning, isLooping });
  settingsRef.current = { playbackSpeed, repeatCount, delayBetweenWords, autoPlayNext, readMeaning, isLooping };

  // Sync from settings modal
  useEffect(() => {
    if (showSettingsModal) return;
    setPlaybackSpeed(listeningSettings.defaultPlaybackSpeed);
    setRepeatCount(listeningSettings.defaultRepeatCount);
    setDelayBetweenWords(listeningSettings.delayBetweenWords);
    setAutoPlayNext(listeningSettings.autoPlayNext);
    setShowVocabulary(listeningSettings.showVocabulary);
    setShowMeaning(listeningSettings.showMeaning);
    setShowKanji(listeningSettings.showKanji);
  }, [showSettingsModal, listeningSettings]);

  // TTS playback - only restart when playing state, card, or index changes
  useEffect(() => {
    if (!isPlaying || !currentCard) return;

    const signal = { cancelled: false };
    setCurrentRepeat(0);

    const run = async () => {
      await delay(100, signal);

      const s = settingsRef.current;
      for (let rep = 0; rep < s.repeatCount; rep++) {
        if (signal.cancelled) return;
        setCurrentRepeat(rep);

        await speakText(currentCard.vocabulary, 'ja-JP', s.playbackSpeed, signal);
        if (signal.cancelled) return;

        if (s.readMeaning && currentCard.meaning) {
          await delay(500, signal);
          if (signal.cancelled) return;
          await speakText(currentCard.meaning, 'vi-VN', s.playbackSpeed, signal);
          if (signal.cancelled) return;
        }

        // Small pause between repeats of same word (not affected by giãn cách setting)
        if (rep < s.repeatCount - 1) {
          await delay(300, signal);
        }
      }

      if (signal.cancelled) return;
      setCurrentRepeat(0);

      // Re-read settings for latest autoPlayNext/delay
      const s2 = settingsRef.current;
      if (s2.autoPlayNext) {
        await delay(s2.delayBetweenWords * 1000, signal);
        if (signal.cancelled) return;

        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next < shuffledIndices.length) return next;
          if (s2.isLooping) return 0;
          setIsPlaying(false);
          return prev;
        });
      } else {
        setIsPlaying(false);
      }
    };

    run();
    return () => {
      signal.cancelled = true;
      window.speechSynthesis?.cancel();
    };
    // Only re-trigger on: play state, which card, which index
    // Settings are read via ref inside the loop
  }, [isPlaying, currentIndex, currentCardId]);

  // Controls
  const togglePlay = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(p => !p);
  }, []);

  const goToNext = useCallback(() => {
    window.speechSynthesis?.cancel();
    setCurrentRepeat(0);
    setCurrentIndex(i => {
      if (i < shuffledIndices.length - 1) return i + 1;
      if (settingsRef.current.isLooping) return 0;
      return i;
    });
  }, [shuffledIndices.length]);

  const goToPrevious = useCallback(() => {
    window.speechSynthesis?.cancel();
    setCurrentRepeat(0);
    setCurrentIndex(i => {
      if (i > 0) return i - 1;
      if (settingsRef.current.isLooping) return shuffledIndices.length - 1;
      return i;
    });
  }, [shuffledIndices.length]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled(s => {
      if (!s) setShuffleSeed(Date.now()); // new random seed
      return !s;
    });
    setCurrentIndex(0);
  }, []);

  const handleFilterChange = useCallback((filter: MemorizationFilter) => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setMemorizationFilter(filter);
    setCurrentIndex(0);
    setCurrentRepeat(0);
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
            getLessonName={() => ''}
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
          onToggleLoop={() => setIsLooping(l => !l)}
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
