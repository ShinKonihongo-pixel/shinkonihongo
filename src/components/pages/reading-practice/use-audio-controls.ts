import { useState, useCallback, useRef, useEffect } from 'react';
import type { AudioState } from './types';

export function useAudioControls() {
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const startSpeaking = useCallback((text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.85;
    utterance.onend = () => setAudioState('idle');
    utterance.onerror = () => setAudioState('idle');
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setAudioState('playing');
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.pause();
      setAudioState('paused');
    }
  }, []);

  const resumeSpeaking = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setAudioState('playing');
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setAudioState('idle');
  }, []);

  const handleAudioToggle = useCallback((text: string) => {
    if (audioState === 'idle') {
      startSpeaking(text);
    } else {
      stopSpeaking();
    }
  }, [audioState, startSpeaking, stopSpeaking]);

  return {
    audioState,
    startSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    handleAudioToggle,
  };
}
