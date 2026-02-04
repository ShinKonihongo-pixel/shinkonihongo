// Custom hook for listening playback functionality
// Handles speech synthesis, playback state, and navigation

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Flashcard } from '../../../types/flashcard';

interface UseListeningPlaybackOptions {
  cards: Flashcard[];
  initialSpeed?: number;
  initialRepeatCount?: number;
  initialDelay?: number;
}

interface PlaybackState {
  isPlaying: boolean;
  currentIndex: number;
  currentRepeat: number;
  playbackSpeed: number;
  repeatCount: number;
  delayBetweenWords: number;
  isLooping: boolean;
  isShuffled: boolean;
  autoPlayNext: boolean;
  readMeaning: boolean;
}

export function useListeningPlayback({
  cards,
  initialSpeed = 1,
  initialRepeatCount = 1,
  initialDelay = 2,
}: UseListeningPlaybackOptions) {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);
  const [repeatCount, setRepeatCount] = useState(initialRepeatCount);
  const [delayBetweenWords, setDelayBetweenWords] = useState(initialDelay);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [readMeaning, setReadMeaning] = useState(false);

  // Shuffled indices
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Refs for async callbacks
  const isPlayingRef = useRef(false);
  const repeatCountRef = useRef(repeatCount);
  const delayBetweenWordsRef = useRef(delayBetweenWords);
  const autoPlayNextRef = useRef(autoPlayNext);
  const isLoopingRef = useRef(isLooping);
  const readMeaningRef = useRef(readMeaning);
  const shuffledIndicesRef = useRef(shuffledIndices);

  // Keep refs in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { repeatCountRef.current = repeatCount; }, [repeatCount]);
  useEffect(() => { delayBetweenWordsRef.current = delayBetweenWords; }, [delayBetweenWords]);
  useEffect(() => { autoPlayNextRef.current = autoPlayNext; }, [autoPlayNext]);
  useEffect(() => { isLoopingRef.current = isLooping; }, [isLooping]);
  useEffect(() => { readMeaningRef.current = readMeaning; }, [readMeaning]);
  useEffect(() => { shuffledIndicesRef.current = shuffledIndices; }, [shuffledIndices]);

  // Initialize/update shuffled indices when cards change or shuffle toggles
  useEffect(() => {
    if (isShuffled && cards.length > 0) {
      const indices = Array.from({ length: cards.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    } else {
      setShuffledIndices(Array.from({ length: cards.length }, (_, i) => i));
    }
  }, [isShuffled, cards.length]);

  // Get current card based on shuffled index
  const currentCard = cards[shuffledIndices[currentIndex]] || null;

  // Text-to-Speech helper
  const speakText = useCallback((text: string, lang: 'ja-JP' | 'vi-VN'): Promise<void> => {
    return new Promise((resolve) => {
      if (!isPlayingRef.current) {
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
  }, [playbackSpeed]);

  // Main speak function
  const speakCurrentWord = useCallback(async (card: Flashcard, repeatIndex: number = 0) => {
    if (!isPlayingRef.current || !card) return;

    // Speak vocabulary
    await speakText(card.vocabulary, 'ja-JP');
    if (!isPlayingRef.current) return;

    // Optionally read meaning
    if (readMeaningRef.current && card.meaning) {
      await new Promise(r => setTimeout(r, 500));
      if (!isPlayingRef.current) return;
      await speakText(card.meaning, 'vi-VN');
      if (!isPlayingRef.current) return;
    }

    // Check for more repeats
    const nextRepeat = repeatIndex + 1;
    if (nextRepeat < repeatCountRef.current) {
      setCurrentRepeat(nextRepeat);
      await new Promise(r => setTimeout(r, delayBetweenWordsRef.current * 1000));
      if (isPlayingRef.current) {
        speakCurrentWord(card, nextRepeat);
      }
    } else {
      // Done with repeats, handle next word
      setCurrentRepeat(0);
      if (autoPlayNextRef.current) {
        await new Promise(r => setTimeout(r, delayBetweenWordsRef.current * 1000));
        if (!isPlayingRef.current) return;

        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < shuffledIndicesRef.current.length) {
            return nextIndex;
          } else if (isLoopingRef.current) {
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
  }, [speakText]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

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

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setCurrentIndex(0);
    setCurrentRepeat(0);
  }, []);

  const reset = useCallback(() => {
    stop();
    setShuffledIndices(Array.from({ length: cards.length }, (_, i) => i));
    setIsShuffled(false);
  }, [stop, cards.length]);

  return {
    // State
    isPlaying,
    currentIndex,
    currentRepeat,
    currentCard,
    playbackSpeed,
    repeatCount,
    delayBetweenWords,
    isLooping,
    isShuffled,
    autoPlayNext,
    readMeaning,
    shuffledIndices,
    totalCards: cards.length,

    // Setters
    setPlaybackSpeed,
    setRepeatCount,
    setDelayBetweenWords,
    setAutoPlayNext,
    setReadMeaning,
    setCurrentIndex,
    setIsPlaying,

    // Actions
    togglePlay,
    goToNext,
    goToPrevious,
    toggleShuffle,
    toggleLoop,
    stop,
    reset,
    speakCurrentWord,
  };
}
