// Individual message item in Kaiwa conversation

import { useState } from 'react';
import type { KaiwaMessage } from '../../types/kaiwa';
import { FuriganaText } from '../common/furigana-text';
import { removeFurigana } from '../../lib/furigana-utils';

interface KaiwaMessageItemProps {
  message: KaiwaMessage;
  speakingMessageId: string | null;
  speakingMode: 'normal' | 'slow' | null;
  showFurigana: boolean;
  fontSize?: number;
  onSpeak: (messageId: string, text: string, mode: 'normal' | 'slow') => void;
  onAnalyze: (text: string) => void;
  onTranslate: (text: string) => Promise<string>;
  onSaveSentence?: (text: string) => void;
}

export function KaiwaMessageItem({
  message,
  speakingMessageId,
  speakingMode,
  showFurigana,
  fontSize = 16,
  onSpeak,
  onAnalyze,
  onTranslate,
  onSaveSentence,
}: KaiwaMessageItemProps) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAssistant = message.role === 'assistant';
  const isSpeakingNormal = speakingMessageId === message.id && speakingMode === 'normal';
  const isSpeakingSlow = speakingMessageId === message.id && speakingMode === 'slow';

  // Copy message text to clipboard
  const handleCopy = async () => {
    const textToCopy = removeFurigana(message.content);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Handle quick translate toggle
  const handleTranslateToggle = async () => {
    if (translation) {
      setShowTranslation(!showTranslation);
      return;
    }

    setIsTranslating(true);
    try {
      const result = await onTranslate(message.content);
      setTranslation(result);
      setShowTranslation(true);
    } catch {
      setTranslation('Không thể dịch');
      setShowTranslation(true);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={`kaiwa-message ${message.role}`}>
      <div className="kaiwa-message-avatar">
        {isAssistant ? '🤖' : '👤'}
      </div>
      <div className="kaiwa-message-content">
        <p className="kaiwa-message-text" style={{ fontSize: `${fontSize}px` }}>
          <FuriganaText text={message.content} showFurigana={showFurigana} />
        </p>

        {/* Inline translation */}
        {showTranslation && translation && (
          <p className="kaiwa-message-translation">{translation}</p>
        )}

        {isAssistant && (
          <div className="kaiwa-message-actions">
            <button
              className={`kaiwa-action-btn ${showTranslation ? 'active' : ''}`}
              onClick={handleTranslateToggle}
              disabled={isTranslating}
              title={showTranslation ? 'Ẩn dịch' : 'Dịch nhanh'}
            >
              {isTranslating ? '⏳' : '🇻🇳'}
            </button>
            <button
              className={`kaiwa-action-btn ${isSpeakingNormal ? 'active' : ''}`}
              onClick={() => onSpeak(message.id, removeFurigana(message.content), 'normal')}
              title="Nghe"
            >
              {isSpeakingNormal ? '⏹️' : '🔊'}
            </button>
            <button
              className={`kaiwa-action-btn ${isSpeakingSlow ? 'active' : ''}`}
              onClick={() => onSpeak(message.id, removeFurigana(message.content), 'slow')}
              title="Nghe chậm"
            >
              {isSpeakingSlow ? '⏹️' : '🐢'}
            </button>
            <button
              className="kaiwa-action-btn"
              onClick={() => onAnalyze(message.content)}
              title="Phân tích ngữ pháp"
            >
              📖
            </button>
            <button
              className={`kaiwa-action-btn ${copied ? 'active' : ''}`}
              onClick={handleCopy}
              title={copied ? 'Đã sao chép!' : 'Sao chép'}
            >
              {copied ? '✓' : '📋'}
            </button>
            {onSaveSentence && (
              <button
                className="kaiwa-action-btn"
                onClick={() => onSaveSentence(message.content)}
                title="Lưu câu này"
              >
                ⭐
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
