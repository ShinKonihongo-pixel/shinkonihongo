// Bingo Game Setup - Configure game settings before starting

import { useState } from 'react';
import { ArrowLeft, Users, Sparkles } from 'lucide-react';
import type { CreateBingoGameData } from '../../types/bingo-game';

interface BingoGameSetupProps {
  loading: boolean;
  error: string | null;
  onCreateGame: (data: CreateBingoGameData) => void;
  onCancel: () => void;
}

export function BingoGameSetup({
  loading,
  error,
  onCreateGame,
  onCancel,
}: BingoGameSetupProps) {
  const [title, setTitle] = useState('Bingo Vui Vẻ');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [skillsEnabled, setSkillsEnabled] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGame({
      title: title.trim() || 'Bingo Vui Vẻ',
      maxPlayers,
      skillsEnabled,
    });
  };

  return (
    <div className="bingo-setup">
      <div className="bingo-setup-header">
        <button className="back-btn" onClick={onCancel}>
          <ArrowLeft size={20} />
        </button>
        <h2>Tạo Phòng Bingo</h2>
      </div>

      {error && (
        <div className="bingo-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form className="bingo-setup-form" onSubmit={handleSubmit}>
        {/* Room title */}
        <div className="form-group">
          <label>Tên Phòng</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tên phòng..."
            maxLength={30}
          />
        </div>

        {/* Max players */}
        <div className="form-group">
          <label>
            <Users size={16} />
            Số Người Chơi Tối Đa
          </label>
          <div className="player-selector">
            {[4, 6, 8, 10, 15, 20].map(num => (
              <button
                key={num}
                type="button"
                className={`player-option ${maxPlayers === num ? 'selected' : ''}`}
                onClick={() => setMaxPlayers(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Skills toggle */}
        <div className="form-group toggle-group">
          <label>
            <Sparkles size={16} />
            Kỹ Năng Đặc Biệt
          </label>
          <div className="toggle-description">
            Mở khóa kỹ năng sau mỗi 5 lượt chơi
          </div>
          <button
            type="button"
            className={`toggle-btn ${skillsEnabled ? 'active' : ''}`}
            onClick={() => setSkillsEnabled(!skillsEnabled)}
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* Game rules preview */}
        <div className="rules-preview">
          <h4>Luật Chơi</h4>
          <ul>
            <li>🎯 Mỗi người chơi có 6 dãy, mỗi dãy 5 số (1-99)</li>
            <li>🎰 Bốc số ngẫu nhiên, đánh dấu số trùng</li>
            <li>🏆 Ai có đủ 5 số trong một dãy nhấn BINGO trước thắng!</li>
            {skillsEnabled && (
              <li>✨ Mỗi 5 lượt có kỹ năng đặc biệt</li>
            )}
          </ul>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className="create-game-btn"
          disabled={loading}
        >
          {loading ? 'Đang tạo...' : 'Tạo Phòng'}
        </button>
      </form>
    </div>
  );
}
