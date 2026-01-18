// Word Match Setup - Create game settings
import React, { useState } from 'react';
import type { CreateWordMatchData } from '../../types/word-match';
import { DEFAULT_WORD_MATCH_SETTINGS } from '../../types/word-match';

interface WordMatchSetupProps {
  onCreateGame: (data: CreateWordMatchData) => void;
  onBack: () => void;
}

export const WordMatchSetup: React.FC<WordMatchSetupProps> = ({
  onCreateGame,
  onBack,
}) => {
  const [title, setTitle] = useState('Nối Từ');
  const [totalRounds, setTotalRounds] = useState(DEFAULT_WORD_MATCH_SETTINGS.totalRounds);
  const [timePerRound, setTimePerRound] = useState(DEFAULT_WORD_MATCH_SETTINGS.timePerRound);
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_WORD_MATCH_SETTINGS.maxPlayers);

  const handleCreate = () => {
    onCreateGame({
      title: title.trim() || 'Nối Từ',
      totalRounds,
      timePerRound,
      maxPlayers,
    });
  };

  return (
    <div className="word-match-setup">
      <div className="word-match-setup-header">
        <button className="word-match-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <h2>🔗 Tạo Phòng Mới</h2>
      </div>

      <div className="word-match-setup-form">
        <div className="form-group">
          <label>Tên phòng</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tên phòng..."
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label>Số câu hỏi: {totalRounds}</label>
          <input
            type="range"
            min={5}
            max={20}
            step={5}
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>5</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        <div className="form-group">
          <label>Thời gian mỗi câu: {timePerRound}s</label>
          <input
            type="range"
            min={15}
            max={60}
            step={5}
            value={timePerRound}
            onChange={(e) => setTimePerRound(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>15s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        <div className="form-group">
          <label>Số người chơi tối đa: {maxPlayers}</label>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>2</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="word-match-setup-preview">
        <h3>Thông tin phòng</h3>
        <div className="preview-items">
          <div className="preview-item">
            <span className="label">Tên:</span>
            <span className="value">{title || 'Nối Từ'}</span>
          </div>
          <div className="preview-item">
            <span className="label">Số câu:</span>
            <span className="value">{totalRounds} câu</span>
          </div>
          <div className="preview-item">
            <span className="label">Thời gian:</span>
            <span className="value">{timePerRound}s/câu</span>
          </div>
          <div className="preview-item">
            <span className="label">Tối đa:</span>
            <span className="value">{maxPlayers} người</span>
          </div>
          <div className="preview-item">
            <span className="label">Câu đặc biệt:</span>
            <span className="value">Mỗi 5 câu</span>
          </div>
        </div>
      </div>

      <div className="word-match-setup-actions">
        <button className="word-match-btn primary large" onClick={handleCreate}>
          🎮 Tạo Phòng
        </button>
      </div>
    </div>
  );
};
