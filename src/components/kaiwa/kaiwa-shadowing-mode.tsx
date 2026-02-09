/* eslint-disable react-hooks/preserve-manual-memoization */
// Kaiwa Shadowing Mode - Listen and repeat practice with timing
// User listens to AI speech, then records themselves repeating

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Mic,
  SkipBack,
  SkipForward,
  Volume2,
  RotateCcw,
  Check,
  X,
  Gauge,
} from 'lucide-react';
import type { KaiwaMessage, PronunciationResult } from '../../types/kaiwa';
import { FuriganaText } from '../common/furigana-text';
import { removeFurigana } from '../../lib/furigana-utils';

interface KaiwaShadowingModeProps {
  messages: KaiwaMessage[];
  showFurigana: boolean;
  voiceRate: number;
  onSpeak: (text: string, rate: number) => void;
  onStopSpeaking: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  interimTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onCompare: (expected: string, spoken: string) => PronunciationResult;
  onClose: () => void;
}

type ShadowingPhase = 'listen' | 'prepare' | 'record' | 'result';

interface ShadowingState {
  currentIndex: number;
  phase: ShadowingPhase;
  result: PronunciationResult | null;
  attempts: number;
  slowMode: boolean;
  autoAdvance: boolean;
}

export function KaiwaShadowingMode({
  messages,
  showFurigana,
  voiceRate,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  isListening,
  interimTranscript,
  onStartListening,
  onStopListening,
  onCompare,
  onClose,
}: KaiwaShadowingModeProps) {
  // Filter to only AI messages
  const aiMessages = messages.filter(m => m.role === 'assistant');

  const [state, setState] = useState<ShadowingState>({
    currentIndex: 0,
    phase: 'listen',
    result: null,
    attempts: 0,
    slowMode: false,
    autoAdvance: true,
  });

  const prepareTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Current message
  const currentMessage = aiMessages[state.currentIndex];
  const currentText = currentMessage ? removeFurigana(currentMessage.content) : '';

  // Get speech rate
  const getSpeechRate = useCallback(() => {
    return state.slowMode ? 0.6 : voiceRate;
  }, [state.slowMode, voiceRate]);

  // Start listening phase (used by handleReplay)
  const _startListenPhase = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'listen', result: null }));
    onSpeak(currentText, getSpeechRate());
  }, [currentText, getSpeechRate, onSpeak]);
  void _startListenPhase; // Suppress unused warning - may be used for future features

  // Move to prepare phase after speech ends
  useEffect(() => {
    if (state.phase === 'listen' && !isSpeaking && currentText) {
      // Wait a moment before prepare phase
      prepareTimerRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, phase: 'prepare' }));
      }, 500);
    }

    return () => {
      if (prepareTimerRef.current) {
        clearTimeout(prepareTimerRef.current);
      }
    };
  }, [state.phase, isSpeaking, currentText]);

  // Go to next
  const handleNext = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (state.currentIndex < aiMessages.length - 1) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        phase: 'listen',
        result: null,
      }));
      const nextText = removeFurigana(aiMessages[state.currentIndex + 1].content);
      setTimeout(() => {
        onSpeak(nextText, getSpeechRate());
      }, 300);
    }
  }, [state.currentIndex, aiMessages, getSpeechRate, onSpeak]);

  // Handle recording complete
  useEffect(() => {
    if (state.phase === 'record' && !isListening && interimTranscript) {
      const result = onCompare(currentText, interimTranscript);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(prev => ({
        ...prev,
        phase: 'result',
        result,
        attempts: prev.attempts + 1,
      }));

      // Auto-advance if enabled and accuracy is good
      if (state.autoAdvance && result.accuracy >= 80) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          handleNext();
        }, 2000);
      }
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, [state.phase, isListening, interimTranscript, currentText, state.autoAdvance, onCompare, handleNext]);

  // Start recording
  const handleStartRecording = () => {
    setState(prev => ({ ...prev, phase: 'record' }));
    onStartListening();
  };

  // Stop recording
  const handleStopRecording = () => {
    onStopListening();
  };

  // Replay current
  const handleReplay = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    onStopSpeaking();
    setState(prev => ({ ...prev, phase: 'listen', result: null }));
    setTimeout(() => {
      onSpeak(currentText, getSpeechRate());
    }, 100);
  };

  // Retry recording
  const handleRetry = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    setState(prev => ({ ...prev, phase: 'prepare', result: null }));
  };


  // Go to previous
  const handlePrev = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    if (state.currentIndex > 0) {
      setState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        phase: 'listen',
        result: null,
      }));
      const prevText = removeFurigana(aiMessages[state.currentIndex - 1].content);
      setTimeout(() => {
        onSpeak(prevText, getSpeechRate());
      }, 300);
    }
  };

  // Toggle slow mode
  const handleToggleSlowMode = () => {
    setState(prev => ({ ...prev, slowMode: !prev.slowMode }));
  };

  // Toggle auto-advance
  const handleToggleAutoAdvance = () => {
    setState(prev => ({ ...prev, autoAdvance: !prev.autoAdvance }));
  };

  // Skip to specific message
  const handleSkipTo = (index: number) => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
    }
    onStopSpeaking();
    setState(prev => ({
      ...prev,
      currentIndex: index,
      phase: 'listen',
      result: null,
    }));
    const targetText = removeFurigana(aiMessages[index].content);
    setTimeout(() => {
      onSpeak(targetText, getSpeechRate());
    }, 300);
  };

  if (aiMessages.length === 0) {
    return (
      <div className="kaiwa-shadowing-overlay">
        <div className="kaiwa-shadowing-modal">
          <div className="shadowing-header">
            <h3>シャドーイング練習</h3>
            <button className="shadowing-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="shadowing-empty">
            <p>Không có tin nhắn AI nào để luyện tập shadowing.</p>
            <p>Hãy bắt đầu một cuộc hội thoại trước.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kaiwa-shadowing-overlay">
      <div className="kaiwa-shadowing-modal">
        {/* Header */}
        <div className="shadowing-header">
          <h3>シャドーイング練習</h3>
          <div className="shadowing-progress">
            {state.currentIndex + 1} / {aiMessages.length}
          </div>
          <button className="shadowing-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Message Timeline */}
        <div className="shadowing-timeline">
          {aiMessages.map((msg, idx) => (
            <button
              key={msg.id}
              className={`timeline-dot ${idx === state.currentIndex ? 'active' : ''} ${idx < state.currentIndex ? 'completed' : ''}`}
              onClick={() => handleSkipTo(idx)}
              title={`Câu ${idx + 1}`}
            />
          ))}
        </div>

        {/* Current Message */}
        <div className="shadowing-content">
          <div className={`shadowing-text ${state.phase}`}>
            <FuriganaText text={currentMessage.content} showFurigana={showFurigana} />
          </div>

          {/* Phase indicator */}
          <div className="shadowing-phase">
            {state.phase === 'listen' && (
              <span className="phase-badge listening">
                <Volume2 size={16} /> Nghe...
              </span>
            )}
            {state.phase === 'prepare' && (
              <span className="phase-badge prepare">
                Chuẩn bị nói
              </span>
            )}
            {state.phase === 'record' && (
              <span className="phase-badge recording">
                <Mic size={16} /> Đang ghi âm...
              </span>
            )}
            {state.phase === 'result' && state.result && (
              <span className={`phase-badge result ${state.result.accuracy >= 80 ? 'good' : state.result.accuracy >= 50 ? 'ok' : 'poor'}`}>
                {state.result.accuracy}% chính xác
              </span>
            )}
          </div>

          {/* Interim transcript during recording */}
          {state.phase === 'record' && interimTranscript && (
            <div className="shadowing-interim">
              {interimTranscript}
            </div>
          )}

          {/* Result details */}
          {state.phase === 'result' && state.result && (
            <div className="shadowing-result">
              <div className="result-spoken">
                <span className="result-label">Bạn nói:</span>
                <span className="result-text">{state.result.spokenText}</span>
              </div>
              {state.result.differences.length > 0 && (
                <div className="result-differences">
                  <span className="result-label">Khác biệt:</span>
                  {state.result.differences.slice(0, 3).map((diff, idx) => (
                    <span key={idx} className="diff-item">
                      <span className="expected">{diff.expected}</span>
                      →
                      <span className="spoken">{diff.spoken}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="shadowing-controls">
          {/* Navigation */}
          <div className="shadowing-nav">
            <button
              className="shadowing-btn nav"
              onClick={handlePrev}
              disabled={state.currentIndex === 0}
              title="Câu trước"
            >
              <SkipBack size={20} />
            </button>

            <button
              className="shadowing-btn replay"
              onClick={handleReplay}
              title="Nghe lại"
            >
              <RotateCcw size={20} />
            </button>

            {/* Main action button */}
            {state.phase === 'listen' && (
              <button className="shadowing-btn main listening" disabled>
                <Volume2 size={24} />
              </button>
            )}
            {state.phase === 'prepare' && (
              <button
                className="shadowing-btn main record"
                onClick={handleStartRecording}
              >
                <Mic size={24} />
              </button>
            )}
            {state.phase === 'record' && (
              <button
                className="shadowing-btn main recording"
                onClick={handleStopRecording}
              >
                <Pause size={24} />
              </button>
            )}
            {state.phase === 'result' && (
              <>
                <button
                  className="shadowing-btn retry"
                  onClick={handleRetry}
                  title="Thử lại"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  className="shadowing-btn main accept"
                  onClick={handleNext}
                  disabled={state.currentIndex === aiMessages.length - 1}
                >
                  <Check size={24} />
                </button>
              </>
            )}

            <button
              className="shadowing-btn nav"
              onClick={handleNext}
              disabled={state.currentIndex === aiMessages.length - 1}
              title="Câu tiếp"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Options */}
          <div className="shadowing-options">
            <button
              className={`shadowing-option ${state.slowMode ? 'active' : ''}`}
              onClick={handleToggleSlowMode}
              title="Chế độ chậm"
            >
              <Gauge size={16} />
              {state.slowMode ? 'Chậm' : 'Thường'}
            </button>
            <button
              className={`shadowing-option ${state.autoAdvance ? 'active' : ''}`}
              onClick={handleToggleAutoAdvance}
              title="Tự động tiếp tục"
            >
              <Play size={16} />
              Auto
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="shadowing-stats">
          <span>Đã thử: {state.attempts}</span>
        </div>
      </div>
    </div>
  );
}
