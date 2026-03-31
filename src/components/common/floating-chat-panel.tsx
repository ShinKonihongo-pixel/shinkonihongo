// Floating chat panel - popup chat window

import { useState, useEffect, useRef } from 'react';
import type { CurrentUser } from '../../types/user';
import '../ui/floating-chat.css';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  displayName?: string;
  avatar?: string;
  profileBackground?: string;
  role?: string;
  message: string;
  timestamp: string;
}

interface FloatingChatPanelProps {
  currentUser: CurrentUser;
  isOpen: boolean;
  onClose: () => void;
}

const CHAT_STORAGE_KEY = 'flashcard-chat-messages';

const EMOJI_CATEGORIES = [
  { name: 'Mặt cười', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😎', '🤔', '😢', '😭', '😤', '😡'] },
  { name: 'Cử chỉ', emojis: ['👋', '👌', '✌️', '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪'] },
  { name: 'Trái tim', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '💔', '💕', '💖', '💝'] },
  { name: 'Vật thể', emojis: ['⭐', '🌟', '✨', '🔥', '🎉', '🎁', '🏆', '📚', '✏️', '💻'] },
];

export function FloatingChatPanel({ currentUser, isOpen, onClose }: FloatingChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setMessages(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [isOpen]);

  // Listen for cross-tab storage changes instead of polling
  useEffect(() => {
    if (!isOpen) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== CHAT_STORAGE_KEY || !e.newValue) return;
      try {
        setMessages(JSON.parse(e.newValue));
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isOpen]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      avatar: currentUser.avatar,
      profileBackground: currentUser.profileBackground,
      role: currentUser.role,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);

    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages.slice(-100)));
    } catch { /* ignore */ }

    setNewMessage('');
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="floating-chat-panel">
      {/* Header */}
      <div className="floating-chat-header">
        <div className="floating-chat-title">
          <span className="chat-icon">💬</span>
          <span>Thảo luận</span>
        </div>
        <button className="floating-chat-close" onClick={onClose} title="Đóng">
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="floating-chat-messages">
        {messages.length === 0 ? (
          <div className="floating-chat-empty">
            <span>💬</span>
            <p>Chưa có tin nhắn</p>
            <small>Hãy bắt đầu trò chuyện!</small>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === currentUser.id;
            return (
              <div key={msg.id} className={`floating-msg ${isOwn ? 'own' : ''}`}>
                {!isOwn && (
                  <div
                    className="floating-msg-avatar"
                    style={{
                      background: msg.profileBackground && msg.profileBackground !== 'transparent'
                        ? msg.profileBackground
                        : 'var(--primary)'
                    }}
                  >
                    {msg.avatar || (msg.displayName || msg.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="floating-msg-content">
                  {!isOwn && (
                    <span className={`floating-msg-sender ${msg.role || 'user'}`}>
                      {msg.displayName || msg.username}
                    </span>
                  )}
                  <div className="floating-msg-bubble">
                    <p>{msg.message}</p>
                    <span className="floating-msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="floating-emoji-picker">
          <div className="floating-emoji-tabs">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                className={activeEmojiCategory === idx ? 'active' : ''}
                onClick={() => setActiveEmojiCategory(idx)}
              >
                {cat.emojis[0]}
              </button>
            ))}
          </div>
          <div className="floating-emoji-list">
            {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  inputRef.current?.focus();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="floating-chat-input">
        <button
          className="floating-emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          😊
        </button>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
          maxLength={500}
        />
        <button
          className="floating-send-btn"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
