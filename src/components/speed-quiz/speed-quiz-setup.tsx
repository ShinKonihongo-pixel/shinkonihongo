// Speed Quiz Setup - Create game settings
import React, { useState } from 'react';
import type { CreateSpeedQuizData } from '../../types/speed-quiz';
import { DEFAULT_SPEED_QUIZ_SETTINGS } from '../../types/speed-quiz';

interface SpeedQuizSetupProps {
  onCreateGame: (data: CreateSpeedQuizData) => void;
  onBack: () => void;
}

export const SpeedQuizSetup: React.FC<SpeedQuizSetupProps> = ({
  onCreateGame,
  onBack,
}) => {
  const [title, setTitle] = useState('Speed Quiz');
  const [totalRounds, setTotalRounds] = useState(DEFAULT_SPEED_QUIZ_SETTINGS.totalRounds);
  const [timePerQuestion, setTimePerQuestion] = useState(DEFAULT_SPEED_QUIZ_SETTINGS.timePerQuestion);
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_SPEED_QUIZ_SETTINGS.maxPlayers);
  const [skillsEnabled, setSkillsEnabled] = useState(DEFAULT_SPEED_QUIZ_SETTINGS.skillsEnabled);

  const handleCreate = () => {
    onCreateGame({
      title: title.trim() || 'Speed Quiz',
      totalRounds,
      timePerQuestion,
      maxPlayers,
      skillsEnabled,
    });
  };

  return (
    <div className="speed-quiz-setup">
      <div className="speed-quiz-setup-header">
        <button className="speed-quiz-back-btn" onClick={onBack}>
          ← Quay lại
        </button>
        <h2>⚡ Tạo Phòng Mới</h2>
      </div>

      <div className="speed-quiz-setup-form">
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
            max={30}
            step={5}
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>5</span>
            <span>15</span>
            <span>30</span>
          </div>
        </div>

        <div className="form-group">
          <label>Thời gian mỗi câu: {timePerQuestion}s</label>
          <input
            type="range"
            min={5}
            max={20}
            step={5}
            value={timePerQuestion}
            onChange={(e) => setTimePerQuestion(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>5s</span>
            <span>10s</span>
            <span>20s</span>
          </div>
        </div>

        <div className="form-group">
          <label>Số người chơi tối đa: {maxPlayers}</label>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />
          <div className="range-labels">
            <span>2</span>
            <span>10</span>
            <span>20</span>
          </div>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={skillsEnabled}
              onChange={(e) => setSkillsEnabled(e.target.checked)}
            />
            <span>✨ Bật kỹ năng đặc biệt (mỗi 5 câu)</span>
          </label>
        </div>
      </div>

      <div className="speed-quiz-setup-preview">
        <h3>Thông tin phòng</h3>
        <div className="preview-items">
          <div className="preview-item">
            <span className="label">Tên:</span>
            <span className="value">{title || 'Speed Quiz'}</span>
          </div>
          <div className="preview-item">
            <span className="label">Số câu:</span>
            <span className="value">{totalRounds} câu</span>
          </div>
          <div className="preview-item">
            <span className="label">Thời gian:</span>
            <span className="value">{timePerQuestion}s/câu</span>
          </div>
          <div className="preview-item">
            <span className="label">Tối đa:</span>
            <span className="value">{maxPlayers} người</span>
          </div>
          <div className="preview-item">
            <span className="label">Kỹ năng:</span>
            <span className="value">{skillsEnabled ? 'Bật' : 'Tắt'}</span>
          </div>
        </div>
      </div>

      <div className="speed-quiz-setup-actions">
        <button className="speed-quiz-btn primary large" onClick={handleCreate}>
          🎮 Tạo Phòng
        </button>
      </div>
    </div>
  );
};
