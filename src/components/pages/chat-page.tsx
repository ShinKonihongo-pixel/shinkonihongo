// Chat page for user communication and exchange

import { useState, useEffect, useRef } from 'react';
import type { CurrentUser } from '../../types/user';

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

interface ChatPageProps {
  currentUser: CurrentUser;
}

// Local storage key for chat messages (demo purposes)
const CHAT_STORAGE_KEY = 'flashcard-chat-messages';

// Emoji categories
const EMOJI_CATEGORIES = [
  {
    name: 'Mặt cười',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '😎', '🤓', '🧐', '🤔', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮', '😯', '😲', '😳', '🥺', '😢', '😭', '😤', '😡']
  },
  {
    name: 'Cử chỉ',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '🦾']
  },
  {
    name: 'Trái tim',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
  },
  {
    name: 'Vật thể',
    emojis: ['⭐', '🌟', '✨', '💫', '🔥', '💥', '🎉', '🎊', '🎁', '🏆', '🥇', '🥈', '🥉', '📚', '📖', '✏️', '📝', '💻', '🎮', '🎯', '🎵', '🎶']
  },
  {
    name: 'Động vật',
    emojis: ['🐱', '🐶', '🐼', '🦊', '🦁', '🐯', '🐻', '🐨', '🐸', '🐵', '🐔', '🐧', '🦄', '🐝', '🦋']
  }
];

export function ChatPage({ currentUser }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Poll for new messages every 2 seconds (simulating real-time)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem(CHAT_STORAGE_KEY);
        if (stored) {
          setMessages(JSON.parse(stored));
        }
      } catch {
        // Ignore parse errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Save to localStorage
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages.slice(-100))); // Keep last 100 messages
    } catch {
      // Ignore storage errors
    }

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

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = '';
  for (const msg of messages) {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <h2>Thảo luận</h2>
          <p className="chat-description">Giao lưu, trao đổi với mọi người</p>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>Chưa có tin nhắn nào</p>
              <p className="chat-empty-hint">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            groupedMessages.map((group) => (
              <div key={group.date} className="chat-date-group">
                <div className="chat-date-divider">
                  <span>{group.date}</span>
                </div>
                {group.messages.map((msg) => {
                  const isOwn = msg.userId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message ${isOwn ? 'own' : ''}`}
                    >
                      <div
                        className="chat-avatar"
                        style={{
                          background: msg.profileBackground && msg.profileBackground !== 'transparent'
                            ? msg.profileBackground
                            : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                        }}
                      >
                        {msg.avatar || (msg.displayName || msg.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="chat-message-content">
                        <div className="chat-sender-row">
                          <span className={`chat-sender chat-sender-${msg.role || 'user'}`}>
                            {msg.displayName || msg.username}
                          </span>
                          <span className="chat-time">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="chat-bubble">
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-picker">
            <div className="emoji-categories">
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  className={`emoji-category-btn ${activeEmojiCategory === idx ? 'active' : ''}`}
                  onClick={() => setActiveEmojiCategory(idx)}
                >
                  {cat.emojis[0]}
                </button>
              ))}
            </div>
            <div className="emoji-list">
              {EMOJI_CATEGORIES[activeEmojiCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-btn"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-container">
          <button
            className="emoji-toggle-btn"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Chọn emoji"
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
            className="chat-input"
            maxLength={500}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
