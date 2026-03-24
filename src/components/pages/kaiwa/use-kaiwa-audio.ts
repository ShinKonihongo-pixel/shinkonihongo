// Audio/recording: speech, pronunciation practice, auto-send, mic, speak handlers
import { useState, useRef, useEffect, useCallback } from 'react';
import type { PronunciationResult, SuggestedAnswer } from '../../../types/kaiwa';
import type { MicMode } from '../../kaiwa/kaiwa-input-area';
import type { AppSettings } from '../../../hooks/use-settings';
import { useSpeech, comparePronunciation } from '../../../hooks/use-speech';

export interface UseKaiwaAudioReturn {
  speech: ReturnType<typeof useSpeech>;
  selectedSuggestion: SuggestedAnswer | null;
  pronunciationResult: PronunciationResult | null;
  isPracticeMode: boolean;
  micMode: MicMode;
  showReadingPracticeModal: boolean;
  textToRead: string;
  pronunciationAttempts: number;
  totalAccuracy: number;
  autoSendCountdown: number | null;
  speakingMessageId: string | null;
  speakingMode: 'normal' | 'slow' | null;
  setSelectedSuggestion: (v: SuggestedAnswer | null) => void;
  setPronunciationResult: (v: PronunciationResult | null) => void;
  setIsPracticeMode: (v: boolean) => void;
  setMicMode: (v: MicMode) => void;
  setShowReadingPracticeModal: (v: boolean) => void;
  setTextToRead: (v: string) => void;
  setPronunciationAttempts: React.Dispatch<React.SetStateAction<number>>;
  setTotalAccuracy: React.Dispatch<React.SetStateAction<number>>;
  getSpeechRate: () => number;
  handleMicClick: () => void;
  handleSpeak: (messageId: string, text: string, mode: 'normal' | 'slow') => void;
  handleCancelPractice: () => void;
  handleRetryPractice: () => void;
  handleAcceptPronunciation: () => void;
}

interface UseKaiwaAudioParams {
  settings: AppSettings;
  slowMode: boolean;
  handleSend: (text: string) => Promise<void>;
  onVoiceTranscript?: (transcript: string) => void;
}

export function useKaiwaAudio({
  settings,
  slowMode,
  handleSend,
  onVoiceTranscript,
}: UseKaiwaAudioParams): UseKaiwaAudioReturn {
  const speech = useSpeech({
    voiceGender: settings.kaiwaVoiceGender,
    voiceRate: settings.kaiwaVoiceRate,
  });

  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedAnswer | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [micMode, setMicMode] = useState<MicMode>('immediate');
  const [showReadingPracticeModal, setShowReadingPracticeModal] = useState(false);
  const [textToRead, setTextToRead] = useState<string>('');
  const [pronunciationAttempts, setPronunciationAttempts] = useState(0);
  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speakingMode, setSpeakingMode] = useState<'normal' | 'slow' | null>(null);

  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Keep latest handleSend in a ref so the interval closure always calls the fresh version
  const handleSendRef = useRef(handleSend);
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  const selectedSuggestionRef = useRef(selectedSuggestion);
  useEffect(() => { selectedSuggestionRef.current = selectedSuggestion; }, [selectedSuggestion]);

  const pronunciationResultRef = useRef(pronunciationResult);
  useEffect(() => { pronunciationResultRef.current = pronunciationResult; }, [pronunciationResult]);

  const getSpeechRate = useCallback(
    () => slowMode ? 0.6 : settings.kaiwaVoiceRate,
    [slowMode, settings.kaiwaVoiceRate]
  );

  const handleMicClick = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      speech.startListening();
    }
  }, [speech]);

  const handleSpeak = useCallback((messageId: string, text: string, mode: 'normal' | 'slow') => {
    if (speakingMessageId === messageId && speakingMode === mode && speech.isSpeaking) {
      speech.stopSpeaking();
      setSpeakingMessageId(null);
      setSpeakingMode(null);
    } else {
      if (speech.isSpeaking) speech.stopSpeaking();
      speech.speak(text, { rate: mode === 'slow' ? 0.6 : getSpeechRate() });
      setSpeakingMessageId(messageId);
      setSpeakingMode(mode);
    }
  }, [speakingMessageId, speakingMode, speech, getSpeechRate]);

  const clearAutoSend = useCallback(() => {
    if (autoSendTimerRef.current) {
      clearInterval(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    setAutoSendCountdown(null);
  }, []);

  const handleCancelPractice = useCallback(() => {
    clearAutoSend();
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  }, [clearAutoSend]);

  const handleRetryPractice = useCallback(() => {
    clearAutoSend();
    setPronunciationResult(null);
    speech.resetTranscript();
  }, [clearAutoSend, speech]);

  const handleAcceptPronunciation = useCallback(() => {
    clearAutoSend();
    const result = pronunciationResultRef.current;
    const suggestion = selectedSuggestionRef.current;

    if (result) {
      setPronunciationAttempts(prev => prev + 1);
      setTotalAccuracy(prev => prev + result.accuracy);
    }
    if (suggestion) handleSendRef.current(suggestion.text);
    setIsPracticeMode(false);
    setSelectedSuggestion(null);
    setPronunciationResult(null);
  }, [clearAutoSend]);

  // Update voice when settings change
  useEffect(() => {
    speech.setVoiceByGender(settings.kaiwaVoiceGender);
  }, [settings.kaiwaVoiceGender, speech]);

  // Reset speaking state when speech ends
  useEffect(() => {
    if (!speech.isSpeaking && speakingMessageId) {
      setSpeakingMessageId(null);
      setSpeakingMode(null);
    }
  }, [speech.isSpeaking, speakingMessageId]);

  // Handle voice input complete
  useEffect(() => {
    if (speech.transcript && !speech.isListening) {
      if (isPracticeMode && selectedSuggestion) {
        const result = comparePronunciation(speech.transcript, selectedSuggestion.text);
        setPronunciationResult(result);
      } else if (onVoiceTranscript) {
        onVoiceTranscript(speech.transcript);
      }
      speech.resetTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech, isPracticeMode, selectedSuggestion]);

  // Auto-send on high accuracy pronunciation
  useEffect(() => {
    if (
      settings.kaiwaSendMode === 'auto' &&
      pronunciationResult &&
      pronunciationResult.accuracy >= settings.kaiwaAutoSendThreshold &&
      !autoSendTimerRef.current
    ) {
      const totalMs = settings.kaiwaAutoSendDelay * 1000;
      let remaining = totalMs;
      setAutoSendCountdown(settings.kaiwaAutoSendDelay);

      autoSendTimerRef.current = setInterval(() => {
        remaining -= 100;
        if (remaining <= 0) {
          clearInterval(autoSendTimerRef.current!);
          autoSendTimerRef.current = null;
          setAutoSendCountdown(null);
          handleAcceptPronunciation();
        } else {
          setAutoSendCountdown(Math.ceil(remaining / 1000));
        }
      }, 100);
    }

    return () => {
      if (autoSendTimerRef.current) {
        clearInterval(autoSendTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronunciationResult, settings.kaiwaSendMode, settings.kaiwaAutoSendThreshold, settings.kaiwaAutoSendDelay]);

  return {
    speech,
    selectedSuggestion, pronunciationResult, isPracticeMode,
    micMode, showReadingPracticeModal, textToRead,
    pronunciationAttempts, totalAccuracy, autoSendCountdown,
    speakingMessageId, speakingMode,
    setSelectedSuggestion, setPronunciationResult, setIsPracticeMode,
    setMicMode, setShowReadingPracticeModal, setTextToRead,
    setPronunciationAttempts, setTotalAccuracy,
    getSpeechRate, handleMicClick, handleSpeak,
    handleCancelPractice, handleRetryPractice, handleAcceptPronunciation,
  };
}
