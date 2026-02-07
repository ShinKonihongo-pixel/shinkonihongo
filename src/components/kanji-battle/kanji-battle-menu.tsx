// Kanji Battle Menu - Main entry point
import React, { useState } from 'react';

interface KanjiBattleMenuProps {
  onCreateGame: () => void;
  onJoinGame: (code: string) => void;
  onShowGuide: () => void;
  onClose: () => void;
}

export const KanjiBattleMenu: React.FC<KanjiBattleMenuProps> = ({
  onCreateGame,
  onJoinGame,
  onShowGuide,
  onClose,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoin = () => {
    if (joinCode.trim().length === 6) {
      onJoinGame(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="speed-quiz-menu">
      <button className="speed-quiz-close-btn" onClick={onClose}>
        ✕
      </button>

      <div className="speed-quiz-menu-header">
        <div className="speed-quiz-menu-icon">⚔️</div>
        <h1>Đại Chiến Kanji</h1>
        <p>Đọc hoặc viết kanji nhanh nhất để chiến thắng!</p>
      </div>

      <div className="speed-quiz-menu-actions">
        <button className="speed-quiz-btn primary large" onClick={onCreateGame}>
          <span className="btn-icon">🎮</span>
          <span className="btn-text">Tạo Phòng</span>
        </button>

        {!showJoinInput ? (
          <button
            className="speed-quiz-btn secondary large"
            onClick={() => setShowJoinInput(true)}
          >
            <span className="btn-icon">🚪</span>
            <span className="btn-text">Vào Phòng</span>
          </button>
        ) : (
          <div className="speed-quiz-join-input">
            <input
              type="text"
              placeholder="Nhập mã phòng..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />
            <button
              className="speed-quiz-btn primary"
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
            >
              Vào
            </button>
            <button
              className="speed-quiz-btn secondary"
              onClick={() => {
                setShowJoinInput(false);
                setJoinCode('');
              }}
            >
              Hủy
            </button>
          </div>
        )}

        <button className="speed-quiz-btn outline large" onClick={onShowGuide}>
          <span className="btn-icon">📖</span>
          <span className="btn-text">Hướng Dẫn</span>
        </button>
      </div>

      <div className="speed-quiz-menu-features">
        <div className="feature">
          <span className="feature-icon">📖</span>
          <span>Đọc Kanji</span>
        </div>
        <div className="feature">
          <span className="feature-icon">✍️</span>
          <span>Viết Kanji</span>
        </div>
        <div className="feature">
          <span className="feature-icon">✨</span>
          <span>Kỹ năng đặc biệt</span>
        </div>
      </div>
    </div>
  );
};
