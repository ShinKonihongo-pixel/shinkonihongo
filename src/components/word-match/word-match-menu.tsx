// Word Match Menu - Main entry point
import React, { useState } from 'react';

interface WordMatchMenuProps {
  onCreateGame: () => void;
  onJoinGame: (code: string) => void;
  onShowGuide: () => void;
  onClose: () => void;
}

export const WordMatchMenu: React.FC<WordMatchMenuProps> = ({
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
    <div className="word-match-menu">
      <button className="word-match-close-btn" onClick={onClose}>
        ✕
      </button>

      <div className="word-match-menu-header">
        <div className="word-match-menu-icon">🔗</div>
        <h1>Nối Từ Thách Đấu</h1>
        <p>Nối cặp từ nhanh và chính xác nhất!</p>
      </div>

      <div className="word-match-menu-actions">
        <button className="word-match-btn primary large" onClick={onCreateGame}>
          <span className="btn-icon">🎮</span>
          <span className="btn-text">Tạo Phòng</span>
        </button>

        {!showJoinInput ? (
          <button
            className="word-match-btn secondary large"
            onClick={() => setShowJoinInput(true)}
          >
            <span className="btn-icon">🚪</span>
            <span className="btn-text">Vào Phòng</span>
          </button>
        ) : (
          <div className="word-match-join-input">
            <input
              type="text"
              placeholder="Nhập mã phòng..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />
            <button
              className="word-match-btn primary"
              onClick={handleJoin}
              disabled={joinCode.length !== 6}
            >
              Vào
            </button>
            <button
              className="word-match-btn secondary"
              onClick={() => {
                setShowJoinInput(false);
                setJoinCode('');
              }}
            >
              Hủy
            </button>
          </div>
        )}

        <button className="word-match-btn outline large" onClick={onShowGuide}>
          <span className="btn-icon">📖</span>
          <span className="btn-text">Hướng Dẫn</span>
        </button>
      </div>

      <div className="word-match-menu-features">
        <div className="feature">
          <span className="feature-icon">🔗</span>
          <span>5 cặp/câu</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🎡</span>
          <span>Vòng quay</span>
        </div>
        <div className="feature">
          <span className="feature-icon">⚔️</span>
          <span>Thách đấu</span>
        </div>
      </div>
    </div>
  );
};
