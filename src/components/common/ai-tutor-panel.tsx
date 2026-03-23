// AI Tutor floating chat panel — Japanese learning assistant powered by Claude

import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, X, Bot } from 'lucide-react';
import { useAiTutor } from '../../hooks/use-ai-tutor';
import './ai-tutor-panel.css';

interface AiTutorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userJlptLevel?: string;
}

const QUICK_PROMPTS = [
  'Giải thích ngữ pháp ～てから',
  'Sự khác nhau giữa は và が',
  'Dạy tôi chào hỏi cơ bản',
  'Quiz 5 từ vựng N5',
  'Cách đếm trong tiếng Nhật',
];

export function AiTutorPanel({ isOpen, onClose, userJlptLevel }: AiTutorPanelProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  } = useAiTutor(userJlptLevel);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <div className="ai-panel-avatar">
            <Bot size={18} />
          </div>
          <div>
            <div className="ai-panel-name">Shinko AI</div>
            <div className="ai-panel-status">● Sẵn sàng</div>
          </div>
        </div>
        <div className="ai-panel-actions">
          <button className="ai-panel-btn" onClick={clearHistory} title="Xóa lịch sử">
            <Trash2 size={14} />
          </button>
          <button className="ai-panel-btn" onClick={onClose} title="Đóng">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-panel-messages">
        {messages.length === 0 && !isLoading ? (
          <div className="ai-panel-empty">
            <div className="ai-panel-empty-icon">🎌</div>
            <div className="ai-panel-empty-title">Xin chào! Tôi là Shinko AI</div>
            <div className="ai-panel-empty-hint">
              Hỏi tôi bất cứ điều gì về tiếng Nhật:<br />
              ngữ pháp, từ vựng, kanji, hội thoại...
            </div>
            <div className="ai-panel-prompts">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  className="ai-prompt-btn"
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`ai-msg ${msg.role}`}>
                {msg.content}
              </div>
            ))}

            {isLoading && (
              <div className="ai-msg-loading">
                <div className="ai-dot" />
                <div className="ai-dot" />
                <div className="ai-dot" />
              </div>
            )}

            {error && (
              <div className="ai-msg-error">{error}</div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="ai-panel-input">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi về tiếng Nhật..."
          maxLength={500}
          disabled={isLoading}
        />
        <button
          className="ai-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
