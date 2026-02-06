// Listening Practice Page - Refactored with modular components
import { useState, useEffect, useMemo } from 'react';
import type { JLPTLevel } from '../../types/flashcard';
import type { ListeningPracticePagePropsExtended, ExtendedViewMode } from './listening-practice/listening-practice-types';
import { useListeningSettings } from '../../contexts/listening-settings-context';
import { ListeningSettingsModal } from '../ui/listening-settings-modal';
import { LevelSelectView } from './listening-practice/level-select-view';
import { LessonListView } from './listening-practice/lesson-list-view';
import { VocabularyView } from './listening-practice/vocabulary-view';
import { CustomAudioView } from './listening-practice/custom-audio-view';
import { useVocabularyState } from './listening-practice/use-vocabulary-state';
import { useCustomAudio } from './listening-practice/use-custom-audio';
import { listeningPracticeStyles } from './listening-practice/listening-practice-styles';

export function ListeningPracticePage({
  cards,
  lessons,
  getLessonsByLevel,
  getChildLessons,
  onUpdateCard,
}: ListeningPracticePagePropsExtended) {
  const { settings: listeningSettings } = useListeningSettings();

  // View state
  const [viewMode, setViewMode] = useState<ExtendedViewMode>('level-select');
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  // Settings
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showKanji, setShowKanji] = useState(listeningSettings.showKanji);
  const [showVocabulary, setShowVocabulary] = useState(listeningSettings.showVocabulary);
  const [showMeaning, setShowMeaning] = useState(listeningSettings.showMeaning);
  const [showInlineSettings, setShowInlineSettings] = useState(false);

  // Playback state - initialize from context
  const [playbackSpeed, setPlaybackSpeed] = useState(listeningSettings.defaultPlaybackSpeed);
  const [repeatCount, setRepeatCount] = useState(listeningSettings.defaultRepeatCount);
  const [delayBetweenWords, setDelayBetweenWords] = useState(listeningSettings.delayBetweenWords);
  const [autoPlayNext, setAutoPlayNext] = useState(listeningSettings.autoPlayNext);
  const [readMeaning, setReadMeaning] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Selected lesson with children
  const selectedLessonWithChildren = useMemo(() => {
    if (!selectedLessonId) return [];
    const parent = lessons.find((l) => l.id === selectedLessonId);
    if (!parent) return [];
    const children = getChildLessons(selectedLessonId);
    return [parent, ...children];
  }, [selectedLessonId, lessons, getChildLessons]);

  const selectedLessonIds = useMemo(
    () => selectedLessonWithChildren.map((l) => l.id),
    [selectedLessonWithChildren]
  );

  // Vocabulary state hook
  const { memorizationFilter, setMemorizationFilter, filteredCards, resetFilter } =
    useVocabularyState({
      cards,
      selectedLevel,
      selectedLessonIds,
    });

  // Custom audio hook
  const customAudio = useCustomAudio();

  // Get lessons for selected level
  const levelParentLessons = useMemo(() => {
    if (!selectedLevel) return [];
    return getLessonsByLevel(selectedLevel);
  }, [selectedLevel, getLessonsByLevel]);

  // Count by level
  const countByLevel = useMemo(() => {
    const counts: Record<JLPTLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    cards.forEach((c) => {
      counts[c.jlptLevel]++;
    });
    return counts;
  }, [cards]);

  // Card counts for lessons
  const getCardCountForLesson = (lessonId: string) => {
    const childIds = getChildLessons(lessonId).map((c) => c.id);
    const allIds = [lessonId, ...childIds];
    return cards.filter((c) => allIds.includes(c.lessonId)).length;
  };

  const getLearnedCountForLesson = (lessonId: string) => {
    const childIds = getChildLessons(lessonId).map((c) => c.id);
    const allIds = [lessonId, ...childIds];
    return cards.filter((c) => allIds.includes(c.lessonId) && c.memorizationStatus === 'memorized')
      .length;
  };

  const getLessonName = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    return lesson?.name || '';
  };

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

  // TTS playback effect
  useEffect(() => {
    let isMounted = true;

    const speakText = (text: string, lang: 'ja-JP' | 'vi-VN'): Promise<void> => {
      return new Promise((resolve) => {
        if (!isMounted || !isPlaying) {
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
      if (!isMounted || !isPlaying || !currentCard || viewMode !== 'vocabulary') return;

      await speakText(currentCard.vocabulary, 'ja-JP');
      if (!isMounted || !isPlaying) return;

      if (readMeaning && currentCard.meaning) {
        await new Promise((r) => setTimeout(r, 500));
        if (!isMounted || !isPlaying) return;
        await speakText(currentCard.meaning, 'vi-VN');
        if (!isMounted || !isPlaying) return;
      }

      const nextRepeat = repeatIndex + 1;
      if (nextRepeat < repeatCount) {
        setCurrentRepeat(nextRepeat);
        await new Promise((r) => setTimeout(r, delayBetweenWords * 1000));
        if (isMounted && isPlaying) {
          speakWord(nextRepeat);
        }
      } else {
        setCurrentRepeat(0);
        if (autoPlayNext) {
          await new Promise((r) => setTimeout(r, delayBetweenWords * 1000));
          if (!isMounted || !isPlaying) return;

          setCurrentIndex((prevIndex) => {
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

    if (viewMode === 'vocabulary' && isPlaying && currentCard) {
      setCurrentRepeat(0);
      const timer = setTimeout(() => {
        if (isMounted && isPlaying && currentCard) {
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
  }, [
    viewMode,
    isPlaying,
    currentIndex,
    currentCard,
    playbackSpeed,
    repeatCount,
    delayBetweenWords,
    autoPlayNext,
    readMeaning,
    isLooping,
    shuffledIndices.length,
  ]);

  // Navigation handlers
  const selectLevel = (level: JLPTLevel) => {
    setSelectedLevel(level);
    setViewMode('lesson-list');
  };

  const selectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setCurrentIndex(0);
    resetFilter();
    setViewMode('vocabulary');
    setIsPlaying(false);
  };

  const goBack = () => {
    if (viewMode === 'vocabulary') {
      setViewMode('lesson-list');
      setSelectedLessonId(null);
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
    } else if (viewMode === 'lesson-list') {
      setViewMode('level-select');
      setSelectedLevel(null);
    } else if (viewMode === 'custom-audio') {
      setViewMode('level-select');
    }
  };

  const togglePlay = () => {
    if (viewMode === 'vocabulary') {
      if (isPlaying) {
        window.speechSynthesis?.cancel();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    } else if (viewMode === 'custom-audio') {
      customAudio.togglePlay();
    }
  };

  const goToNext = () => {
    window.speechSynthesis?.cancel();
    if (currentIndex < shuffledIndices.length - 1) {
      setCurrentIndex((i) => i + 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(0);
      setCurrentRepeat(0);
    }
  };

  const goToPrevious = () => {
    window.speechSynthesis?.cancel();
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setCurrentRepeat(0);
    } else if (isLooping) {
      setCurrentIndex(shuffledIndices.length - 1);
      setCurrentRepeat(0);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled((s) => !s);
    setCurrentIndex(0);
  };

  // Handle filter change - reset index to avoid out of bounds
  const handleFilterChange = (filter: typeof memorizationFilter) => {
    setMemorizationFilter(filter);
    setCurrentIndex(0);
    setCurrentRepeat(0);
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="listening-practice-page">
      {viewMode === 'level-select' && (
        <LevelSelectView
          countByLevel={countByLevel}
          onSelectLevel={selectLevel}
          onCustomAudio={() => setViewMode('custom-audio')}
        />
      )}

      {viewMode === 'lesson-list' && selectedLevel && (
        <LessonListView
          selectedLevel={selectedLevel}
          lessons={levelParentLessons}
          totalCards={countByLevel[selectedLevel]}
          onBack={goBack}
          onSelectLesson={selectLesson}
          getCardCountForLesson={getCardCountForLesson}
          getLearnedCountForLesson={getLearnedCountForLesson}
        />
      )}

      {viewMode === 'vocabulary' && selectedLevel && selectedLessonId && (
        <VocabularyView
          selectedLevel={selectedLevel}
          selectedLessonId={selectedLessonId}
          filteredCards={filteredCards}
          currentCard={currentCard}
          currentIndex={currentIndex}
          currentRepeat={currentRepeat}
          isPlaying={isPlaying}
          isLooping={isLooping}
          isShuffled={isShuffled}
          memorizationFilter={memorizationFilter}
          playbackSpeed={playbackSpeed}
          repeatCount={repeatCount}
          delayBetweenWords={delayBetweenWords}
          autoPlayNext={autoPlayNext}
          readMeaning={readMeaning}
          showVocabulary={showVocabulary}
          showKanji={showKanji}
          showMeaning={showMeaning}
          showInlineSettings={showInlineSettings}
          onBack={goBack}
          onOpenSettings={() => setShowSettingsModal(true)}
          onFilterChange={handleFilterChange}
          onTogglePlay={togglePlay}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onToggleLoop={() => setIsLooping((l) => !l)}
          onToggleShuffle={toggleShuffle}
          onSpeedChange={setPlaybackSpeed}
          onRepeatChange={setRepeatCount}
          onDelayChange={setDelayBetweenWords}
          onAutoPlayChange={setAutoPlayNext}
          onReadMeaningChange={setReadMeaning}
          onToggleInlineSettings={() => setShowInlineSettings((s) => !s)}
          onUpdateCard={onUpdateCard}
          getLessonName={getLessonName}
        />
      )}

      {viewMode === 'custom-audio' && (
        <CustomAudioView
          audioUrl={customAudio.customAudioUrl}
          audioName={customAudio.customAudioName}
          isPlaying={customAudio.isPlaying}
          isLooping={customAudio.isLooping}
          playbackSpeed={customAudio.playbackSpeed}
          currentTime={customAudio.audioCurrentTime}
          duration={customAudio.audioDuration}
          abRepeatStart={customAudio.abRepeatStart}
          abRepeatEnd={customAudio.abRepeatEnd}
          audioRef={customAudio.audioRef}
          onBack={goBack}
          onFileUpload={customAudio.handleFileUpload}
          onTogglePlay={customAudio.togglePlay}
          onToggleLoop={() => customAudio.setIsLooping((l) => !l)}
          onSeek={customAudio.seekTo}
          onSpeedChange={customAudio.handleSpeedChange}
          onSetAbStart={customAudio.setAbStart}
          onSetAbEnd={customAudio.setAbEnd}
          onClearAb={customAudio.clearAb}
          onTimeUpdate={customAudio.handleTimeUpdate}
          onLoadedMetadata={customAudio.handleLoadedMetadata}
          onEnded={customAudio.handleEnded}
        />
      )}

      <ListeningSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      <style>{listeningPracticeStyles}</style>
    </div>
  );
}
