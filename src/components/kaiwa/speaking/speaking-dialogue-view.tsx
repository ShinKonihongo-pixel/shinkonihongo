// Dialogue display and recording UI for speaking practice - Premium Full-Width UI

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  Mic,
  RotateCcw,
  Check,
  ChevronRight,
  Square,
  X,
  BookOpen,
  Play,
} from 'lucide-react';
import type { SpeakingDialogue, SpeakingEvaluation } from '../../../types/speaking-practice';
import { removeFurigana } from '../../../lib/furigana-utils';

type PracticePhase = 'idle' | 'listening' | 'preparing' | 'recording' | 'evaluating' | 'result';

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice;
}

interface SpeakingDialogueViewProps {
  dialogue: SpeakingDialogue;
  showFurigana: boolean;
  voiceRate: number;
  onSpeak: (text: string, options?: SpeakOptions) => void;
  onStopSpeaking: () => void;
  isSpeaking: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onEvaluate: (lineIndex: number, spokenText: string) => SpeakingEvaluation | null;
  onComplete: () => void;
  onClose: () => void;
}

// Parse furigana text to extract readings for display above kanji
function parseFuriganaToRuby(text: string): { base: string; ruby?: string }[] {
  const result: { base: string; ruby?: string }[] = [];
  const regex = /\[([^\]|]+)\|([^\]]+)\]|([^\[\]]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[1] && match[2]) {
      // Furigana pattern [kanji|reading]
      result.push({ base: match[1], ruby: match[2] });
    } else if (match[3]) {
      // Plain text
      result.push({ base: match[3] });
    }
  }

  return result;
}

// Compare spoken text with expected and return highlighted segments
function compareTexts(expected: string, spoken: string): { char: string; isCorrect: boolean }[] {
  const normalize = (text: string) => text
    .normalize('NFKC')
    .replace(/[。、！？「」『』（）\s・…ー]/g, '')
    .toLowerCase();

  const expectedChars = normalize(expected).split('');
  const result: { char: string; isCorrect: boolean }[] = [];

  // Use original spoken text for display
  const originalSpoken = spoken.replace(/[。、！？「」『』（）\s・…]/g, '');

  for (let i = 0; i < originalSpoken.length; i++) {
    const char = originalSpoken[i];
    const isCorrect = i < expectedChars.length && normalize(char) === expectedChars[i];
    result.push({ char, isCorrect });
  }

  return result;
}

export function SpeakingDialogueView({
  dialogue,
  showFurigana,
  voiceRate,
  onSpeak,
  onStopSpeaking,
  isSpeaking,
  isListening,
  transcript,
  interimTranscript,
  onStartListening,
  onStopListening,
  onEvaluate,
  onComplete,
  onClose,
}: SpeakingDialogueViewProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>('idle');
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [completedLines, setCompletedLines] = useState<Set<number>>(new Set());
  const [showVocab, setShowVocab] = useState(false);

  const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current line
  const currentLine = dialogue.lines[currentLineIndex];
  const isUserLine = currentLine?.role === 'user';
  const totalUserLines = dialogue.lines.filter(l => l.role === 'user').length;
  const completedUserLines = Array.from(completedLines).filter(i => dialogue.lines[i]?.role === 'user').length;

  // Parse furigana for display
  const parsedText = useMemo(() => {
    return parseFuriganaToRuby(currentLine?.text || '');
  }, [currentLine?.text]);

  // Get plain text without furigana
  const plainText = useMemo(() => {
    return removeFurigana(currentLine?.text || '');
  }, [currentLine?.text]);

  // Compare spoken with expected text
  const comparisonResult = useMemo(() => {
    if (phase === 'recording' || phase === 'result') {
      const textToCompare = phase === 'recording' ? interimTranscript : transcript;
      if (textToCompare) {
        return compareTexts(plainText, textToCompare);
      }
    }
    return null;
  }, [phase, interimTranscript, transcript, plainText]);

  // Handle speech end - move to preparing phase
  useEffect(() => {
    if (phase === 'listening' && !isSpeaking && currentLine) {
      phaseTimerRef.current = setTimeout(() => {
        if (isUserLine) {
          setPhase('preparing');
        } else {
          // AI line - auto advance to next
          handleNext();
        }
      }, 500);
    }

    return () => {
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase, isSpeaking, currentLine, isUserLine]);

  // Handle recording end
  useEffect(() => {
    if (phase === 'recording' && !isListening && transcript) {
      setPhase('evaluating');
      const result = onEvaluate(currentLineIndex, transcript);
      setEvaluation(result);
      setPhase('result');
    }
  }, [phase, isListening, transcript, currentLineIndex, onEvaluate]);

  // Handle play audio (without furigana)
  const handlePlayAudio = useCallback(() => {
    if (phase !== 'listening') {
      setPhase('listening');
      onSpeak(plainText, { rate: voiceRate });
    }
  }, [phase, plainText, voiceRate, onSpeak]);

  // Handle start recording
  const handleStartRecording = useCallback(() => {
    setPhase('recording');
    onStartListening();
  }, [onStartListening]);

  // Handle stop recording
  const handleStopRecording = useCallback(() => {
    onStopListening();
  }, [onStopListening]);

  // Handle replay
  const handleReplay = useCallback(() => {
    onStopSpeaking();
    setEvaluation(null);
    setPhase('listening');
    setTimeout(() => {
      onSpeak(plainText, { rate: voiceRate });
    }, 100);
  }, [onStopSpeaking, plainText, voiceRate, onSpeak]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setEvaluation(null);
    setPhase('preparing');
  }, []);

  // Handle accept and move to next
  const handleAccept = useCallback(() => {
    setCompletedLines(prev => new Set([...prev, currentLineIndex]));
    handleNext();
  }, [currentLineIndex]);

  // Move to next line
  const handleNext = useCallback(() => {
    if (currentLineIndex < dialogue.lines.length - 1) {
      setCurrentLineIndex(prev => prev + 1);
      setPhase('idle');
      setEvaluation(null);
    } else {
      onComplete();
    }
  }, [currentLineIndex, dialogue.lines.length, onComplete]);

  // Skip to specific line
  const handleSkipTo = useCallback((index: number) => {
    onStopSpeaking();
    setCurrentLineIndex(index);
    setPhase('idle');
    setEvaluation(null);
  }, [onStopSpeaking]);

  // Get accuracy color class
  const getAccuracyClass = (accuracy: number) => {
    if (accuracy >= 80) return 'excellent';
    if (accuracy >= 60) return 'good';
    if (accuracy >= 40) return 'average';
    return 'poor';
  };

  return (
    <div className="speaking-dialogue-fullscreen">
      {/* Compact Header */}
      <div className="speaking-dialogue-topbar">
        <button className="speaking-back-btn" onClick={onClose} aria-label="Quay lại">
          <X size={20} />
        </button>
        <div className="topbar-info">
          <span className="topbar-title">{dialogue.titleVi}</span>
          <span className="topbar-progress">{completedUserLines}/{totalUserLines}</span>
        </div>
        <div className="topbar-situation">📍 {dialogue.situation}</div>
      </div>

      {/* Timeline */}
      <div className="speaking-timeline-strip">
        {dialogue.lines.map((line, idx) => (
          <button
            key={idx}
            className={`timeline-dot ${idx === currentLineIndex ? 'active' : ''} ${completedLines.has(idx) ? 'completed' : ''} ${line.role}`}
            onClick={() => handleSkipTo(idx)}
            aria-label={`Câu ${idx + 1}`}
          >
            <span>{line.role === 'ai' ? '🤖' : '👤'}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="speaking-main-content">
        {/* Role Badge */}
        <div className={`speaking-role-badge ${currentLine.role}`}>
          {currentLine.role === 'ai' ? '🤖 AI' : '👤 Bạn'}
        </div>

        {/* Japanese Text with Furigana on Top */}
        <div className="speaking-japanese-text">
          {showFurigana ? (
            <ruby className="speaking-ruby">
              {parsedText.map((segment, idx) => (
                <span key={idx}>
                  {segment.ruby ? (
                    <>
                      {segment.base}
                      <rt>{segment.ruby}</rt>
                    </>
                  ) : (
                    <>{segment.base}<rt></rt></>
                  )}
                </span>
              ))}
            </ruby>
          ) : (
            <span className="speaking-plain-text">{plainText}</span>
          )}
        </div>

        {/* Vietnamese Translation */}
        <div className="speaking-vietnamese">
          {currentLine.translation}
        </div>

        {/* Recording Display - Shows what user is saying with highlighting */}
        {(phase === 'recording' || phase === 'result') && comparisonResult && (
          <div className="speaking-transcript-display">
            <div className="transcript-label">
              {phase === 'recording' ? '🎤 Đang nghe...' : '📝 Bạn đã nói:'}
            </div>
            <div className="transcript-text">
              {comparisonResult.map((item, idx) => (
                <span
                  key={idx}
                  className={`transcript-char ${item.isCorrect ? 'correct' : 'incorrect'}`}
                >
                  {item.char}
                </span>
              ))}
              {phase === 'recording' && <span className="transcript-cursor">|</span>}
            </div>
          </div>
        )}

        {/* Evaluation Result */}
        {phase === 'result' && evaluation && (
          <div className={`speaking-result-card ${getAccuracyClass(evaluation.accuracy)}`}>
            <div className="result-score">
              <span className="score-number">{evaluation.accuracy}</span>
              <span className="score-percent">%</span>
            </div>
            <div className="result-details">
              <span className="result-label">
                {evaluation.accuracy >= 80 ? 'Xuất sắc!' :
                 evaluation.accuracy >= 60 ? 'Tốt lắm!' :
                 evaluation.accuracy >= 40 ? 'Cố gắng thêm!' : 'Thử lại nhé!'}
              </span>
              <span className="result-speed">
                Tốc độ: {evaluation.speakingSpeed.rating === 'slow' ? 'Chậm' :
                        evaluation.speakingSpeed.rating === 'fast' ? 'Nhanh' : 'Vừa phải'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="speaking-bottom-controls">
        {/* Left: Replay */}
        <button className="ctrl-btn secondary" onClick={handleReplay} aria-label="Nghe lại">
          <RotateCcw size={22} />
        </button>

        {/* Center: Main Action */}
        <div className="ctrl-main-area">
          {phase === 'idle' && (
            <button className="ctrl-btn primary large" onClick={handlePlayAudio} aria-label="Nghe mẫu">
              <Play size={28} />
              <span>Nghe</span>
            </button>
          )}
          {phase === 'listening' && (
            <div className="ctrl-status listening">
              <Volume2 size={28} className="pulse-icon" />
              <span>Đang phát...</span>
            </div>
          )}
          {phase === 'preparing' && isUserLine && (
            <button className="ctrl-btn record large" onClick={handleStartRecording} aria-label="Ghi âm">
              <Mic size={28} />
              <span>Ghi âm</span>
            </button>
          )}
          {phase === 'recording' && (
            <button className="ctrl-btn recording large" onClick={handleStopRecording} aria-label="Dừng">
              <Square size={24} />
              <span>Dừng</span>
            </button>
          )}
          {phase === 'result' && (
            <div className="ctrl-result-actions">
              <button className="ctrl-btn secondary" onClick={handleRetry} aria-label="Thử lại">
                <RotateCcw size={20} />
              </button>
              <button className="ctrl-btn success large" onClick={handleAccept} aria-label="Tiếp tục">
                <Check size={28} />
                <span>OK</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Next */}
        <button
          className="ctrl-btn secondary"
          onClick={handleNext}
          disabled={currentLineIndex >= dialogue.lines.length - 1 && phase !== 'result'}
          aria-label="Tiếp"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Vocabulary (collapsible) */}
      {dialogue.vocabulary.length > 0 && (
        <div className={`speaking-vocab-drawer ${showVocab ? 'open' : ''}`}>
          <button className="vocab-drawer-toggle" onClick={() => setShowVocab(!showVocab)}>
            <BookOpen size={16} />
            <span>Từ vựng ({dialogue.vocabulary.length})</span>
          </button>
          {showVocab && (
            <div className="vocab-drawer-content">
              {dialogue.vocabulary.map((v, i) => (
                <div key={i} className="vocab-chip">
                  <span className="vocab-jp">{v.word}</span>
                  <span className="vocab-vi">{v.meaning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
