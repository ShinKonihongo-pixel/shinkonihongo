// Kaiwa Reading Practice Modal - Practice pronunciation with visual feedback
// Shows text to read, highlights correct (green) and incorrect (red) words

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Mic, MicOff, RotateCcw, Check, Volume2 } from 'lucide-react';
import { useSpeech } from '../../hooks/use-speech';
import { removeFurigana } from '../../lib/furigana-utils';
import './kaiwa-reading-practice-modal.css';

interface WordResult {
  word: string;
  furigana?: string;
  status: 'pending' | 'correct' | 'incorrect' | 'current';
}

interface ReadingPracticeResult {
  accuracy: number;
  correctWords: number;
  totalWords: number;
  feedback: string;
  feedbackJa: string;
}

interface KaiwaReadingPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  textToRead: string;
  onComplete?: (result: ReadingPracticeResult) => void;
  level?: string;
}

// Tokenize Japanese text into words (simplified - splits on particles and punctuation)
function tokenizeJapanese(text: string): { word: string; furigana?: string }[] {
  // First, extract furigana pairs
  const furiganaPattern = /\[([^\]|]+)\|([^\]]+)\]/g;
  const tokens: { word: string; furigana?: string }[] = [];

  let lastIndex = 0;
  let match;

  while ((match = furiganaPattern.exec(text)) !== null) {
    // Add any text before this match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      // Split non-furigana text by common boundaries
      const parts = beforeText.split(/([。、！？\s]+)/).filter(Boolean);
      parts.forEach(part => {
        if (part.trim() && !/^[。、！？\s]+$/.test(part)) {
          tokens.push({ word: part });
        }
      });
    }

    // Add the furigana word
    tokens.push({ word: match[1], furigana: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    const parts = remainingText.split(/([。、！？\s]+)/).filter(Boolean);
    parts.forEach(part => {
      if (part.trim() && !/^[。、！？\s]+$/.test(part)) {
        tokens.push({ word: part });
      }
    });
  }

  return tokens;
}

// Normalize text for comparison
function normalizeForComparison(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[。、！？「」『』（）\s・…ー]/g, '')
    .toLowerCase();
}

// Compare spoken text with expected and return word-level results
function compareWordByWord(
  spoken: string,
  expectedTokens: { word: string; furigana?: string }[]
): WordResult[] {
  const normalizedSpoken = normalizeForComparison(spoken);
  const results: WordResult[] = [];

  let spokenIndex = 0;

  for (const token of expectedTokens) {
    const normalizedWord = normalizeForComparison(token.word);
    const normalizedFurigana = token.furigana ? normalizeForComparison(token.furigana) : null;

    // Check if the word appears at or near the current position
    const wordLen = normalizedWord.length;
    const searchWindow = Math.max(wordLen + 3, 5);
    const searchArea = normalizedSpoken.slice(spokenIndex, spokenIndex + searchWindow);

    // Try to find the word or its furigana in the spoken text
    const wordIndex = searchArea.indexOf(normalizedWord);
    const furiganaIndex = normalizedFurigana ? searchArea.indexOf(normalizedFurigana) : -1;

    if (wordIndex !== -1 || furiganaIndex !== -1) {
      results.push({
        word: token.word,
        furigana: token.furigana,
        status: 'correct',
      });
      // Advance the spoken index
      const foundIndex = wordIndex !== -1 ? wordIndex : furiganaIndex;
      const foundLen = wordIndex !== -1 ? wordLen : (normalizedFurigana?.length || 0);
      spokenIndex += foundIndex + foundLen;
    } else {
      results.push({
        word: token.word,
        furigana: token.furigana,
        status: 'incorrect',
      });
    }
  }

  return results;
}

export function KaiwaReadingPracticeModal({
  isOpen,
  onClose,
  textToRead,
  onComplete,
}: KaiwaReadingPracticeModalProps) {
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [result, setResult] = useState<ReadingPracticeResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const speech = useSpeech({ voiceGender: 'female', voiceRate: 0.9 });
  const tokens = useRef<{ word: string; furigana?: string }[]>([]);

  // Initialize tokens when text changes
  useEffect(() => {
    if (isOpen && textToRead) {
      tokens.current = tokenizeJapanese(textToRead);
      setWordResults(
        tokens.current.map(t => ({
          word: t.word,
          furigana: t.furigana,
          status: 'pending' as const,
        }))
      );
      setHasRecorded(false);
      setResult(null);
      setShowResult(false);
    }
  }, [isOpen, textToRead]);

  // Handle speech recognition result
  useEffect(() => {
    if (speech.transcript && !speech.isListening && hasRecorded) {
      // Compare spoken text with expected
      const results = compareWordByWord(speech.transcript, tokens.current);
      setWordResults(results);

      // Calculate accuracy
      const correctWords = results.filter(r => r.status === 'correct').length;
      const totalWords = results.length;
      const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;

      // Generate feedback
      let feedback: string;
      let feedbackJa: string;

      if (accuracy >= 90) {
        feedback = 'Xuất sắc! Phát âm rất chuẩn!';
        feedbackJa = '素晴らしい！発音がとても上手です！';
      } else if (accuracy >= 70) {
        feedback = 'Tốt lắm! Hãy chú ý các từ màu đỏ.';
        feedbackJa = 'いいですね！赤い言葉を練習しましょう。';
      } else if (accuracy >= 50) {
        feedback = 'Khá tốt! Cần luyện tập thêm các từ khó.';
        feedbackJa = 'もう少し練習しましょう。';
      } else {
        feedback = 'Hãy nghe lại và thử lần nữa nhé!';
        feedbackJa = 'もう一度聞いて、やってみましょう！';
      }

      const practiceResult: ReadingPracticeResult = {
        accuracy,
        correctWords,
        totalWords,
        feedback,
        feedbackJa,
      };

      setResult(practiceResult);
      setShowResult(true);

      if (onComplete) {
        onComplete(practiceResult);
      }
    }
  }, [speech.transcript, speech.isListening, hasRecorded, onComplete]);

  // Start/stop recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      speech.stopListening();
      setIsRecording(false);
    } else {
      speech.resetTranscript();
      setHasRecorded(true);
      setShowResult(false);
      // Reset word results to pending
      setWordResults(prev => prev.map(w => ({ ...w, status: 'pending' as const })));
      speech.startListening();
      setIsRecording(true);
    }
  }, [isRecording, speech]);

  // Listen for recording state changes
  useEffect(() => {
    if (!speech.isListening && isRecording) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRecording(false);
    }
  }, [speech.isListening, isRecording]);

  // Play the text
  const playText = useCallback(() => {
    const plainText = removeFurigana(textToRead);
    speech.speak(plainText, { rate: 0.85 });
  }, [textToRead, speech]);

  // Reset practice
  const resetPractice = useCallback(() => {
    speech.resetTranscript();
    setWordResults(
      tokens.current.map(t => ({
        word: t.word,
        furigana: t.furigana,
        status: 'pending' as const,
      }))
    );
    setHasRecorded(false);
    setResult(null);
    setShowResult(false);
  }, [speech]);

  if (!isOpen) return null;

  return (
    <div className="reading-practice-overlay">
      <div className="reading-practice-modal">
        {/* Header */}
        <div className="reading-practice-header">
          <h2>Luyện đọc</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Instructions */}
        <div className="reading-practice-instructions">
          <p>Nghe và đọc theo câu bên dưới. Từ đúng sẽ hiển thị màu <span className="text-correct">xanh</span>, từ sai màu <span className="text-incorrect">đỏ</span>.</p>
        </div>

        {/* Text to read with highlighting */}
        <div className="reading-practice-text">
          {wordResults.map((word, idx) => (
            <span
              key={idx}
              className={`reading-word ${word.status}`}
            >
              {word.furigana ? (
                <ruby>
                  {word.word}
                  <rt>{word.furigana}</rt>
                </ruby>
              ) : (
                word.word
              )}
            </span>
          ))}
        </div>

        {/* Result feedback */}
        {showResult && result && (
          <div className={`reading-practice-result ${result.accuracy >= 70 ? 'success' : 'needs-practice'}`}>
            <div className="result-score">
              <span className="score-number">{result.accuracy}%</span>
              <span className="score-label">({result.correctWords}/{result.totalWords} từ)</span>
            </div>
            <div className="result-feedback">
              <p className="feedback-ja">{result.feedbackJa}</p>
              <p className="feedback-vi">{result.feedback}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="reading-practice-controls">
          <button
            className="control-btn play-btn"
            onClick={playText}
            disabled={speech.isSpeaking}
          >
            <Volume2 size={20} />
            <span>Nghe</span>
          </button>

          <button
            className={`control-btn record-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            disabled={speech.isSpeaking}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            <span>{isRecording ? 'Dừng' : 'Đọc'}</span>
          </button>

          {hasRecorded && (
            <button className="control-btn retry-btn" onClick={resetPractice}>
              <RotateCcw size={20} />
              <span>Thử lại</span>
            </button>
          )}

          {showResult && result && result.accuracy >= 70 && (
            <button className="control-btn done-btn" onClick={onClose}>
              <Check size={20} />
              <span>Hoàn thành</span>
            </button>
          )}
        </div>

        {/* Listening indicator */}
        {isRecording && (
          <div className="recording-indicator">
            <div className="recording-pulse" />
            <span>Đang nghe... Hãy đọc to và rõ ràng</span>
          </div>
        )}
      </div>
    </div>
  );
}
