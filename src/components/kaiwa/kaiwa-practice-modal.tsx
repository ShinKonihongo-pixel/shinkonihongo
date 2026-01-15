// Pronunciation practice modal for Kaiwa

import type { SuggestedAnswer, PronunciationResult } from '../../types/kaiwa';
import { Mic, Volume2, X, RefreshCw, Send } from 'lucide-react';

interface KaiwaPracticeModalProps {
  suggestion: SuggestedAnswer;
  result: PronunciationResult | null;
  isListening: boolean;
  isSpeaking: boolean;
  onMicClick: () => void;
  onListen: () => void;
  onRetry: () => void;
  onAccept: () => void;
  onClose: () => void;
}

export function KaiwaPracticeModal({
  suggestion,
  result,
  isListening,
  isSpeaking,
  onMicClick,
  onListen,
  onRetry,
  onAccept,
  onClose,
}: KaiwaPracticeModalProps) {
  return (
    <div className="kaiwa-practice-overlay">
      <div className="kaiwa-practice-modal">
        <h3>Luyện phát âm</h3>
        <p className="kaiwa-practice-text">{suggestion.text}</p>

        {!result ? (
          <>
            <p className="kaiwa-practice-hint">
              Nhấn nút <Mic size={14} /> và nói theo mẫu
            </p>
            <div className="kaiwa-practice-actions">
              <button
                className={`kaiwa-practice-mic ${isListening ? 'listening' : ''}`}
                onClick={onMicClick}
              >
                <Mic size={16} /> {isListening ? 'Đang nghe...' : 'Bắt đầu nói'}
              </button>
              <button
                className="kaiwa-practice-listen"
                onClick={onListen}
                disabled={isSpeaking}
              >
                <Volume2 size={16} /> Nghe lại
              </button>
            </div>
          </>
        ) : (
          <div className="kaiwa-practice-result">
            <div className={`kaiwa-accuracy ${result.accuracy >= 80 ? 'good' : result.accuracy >= 50 ? 'ok' : 'poor'}`}>
              {result.accuracy}%
            </div>
            <p className="kaiwa-feedback">{result.feedback}</p>
            {result.spokenText && (
              <p className="kaiwa-spoken">Bạn nói: {result.spokenText}</p>
            )}
            {result.differences.length > 0 && (
              <div className="kaiwa-differences">
                <span>Khác biệt:</span>
                {result.differences.slice(0, 3).map((d, i) => (
                  <span key={i} className="kaiwa-diff-item">
                    "{d.expected}" → "{d.spoken}"
                  </span>
                ))}
              </div>
            )}
            <div className="kaiwa-practice-actions">
              <button className="btn btn-secondary" onClick={onRetry}>
                <RefreshCw size={14} /> Thử lại
              </button>
              <button className="btn btn-primary" onClick={onAccept}>
                <Send size={14} /> Gửi câu trả lời
              </button>
            </div>
          </div>
        )}

        <button className="kaiwa-practice-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
