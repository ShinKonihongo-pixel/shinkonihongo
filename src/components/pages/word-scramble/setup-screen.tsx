import React from 'react';
import { Home, Play, Clock, Target, Zap, Check, Star, TrendingUp, Lightbulb, Plus } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { GameConfig } from './word-scramble-types';
import { JLPT_LEVELS, LEVEL_COLORS } from './word-scramble-constants';

interface SetupScreenProps {
  config: GameConfig;
  availableFlashcardsCount: number;
  countByLevel: Record<string, number>;
  onClose: () => void;
  onStartSolo: () => void;
  onStartMultiplayer: () => void;
  onToggleLevel: (level: JLPTLevel) => void;
  onSetTime: (time: number) => void;
  onSetQuestions: (count: number) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  config,
  availableFlashcardsCount,
  countByLevel,
  onClose,
  onStartSolo,
  onStartMultiplayer,
  onToggleLevel,
  onSetTime,
  onSetQuestions,
}) => {
  return (
    <div className="ws-setup">
      <div className="ws-setup-card">
        <div className="ws-setup-header">
          <div className="ws-logo">
            <span className="ws-logo-icon">🔀</span>
            <h1>Sắp Xếp Từ</h1>
          </div>
          <p className="ws-subtitle">Ghép các chữ cái thành từ vựng đúng</p>
        </div>

        <div className="ws-setup-body">
          {/* Level Selection */}
          <div className="ws-section">
            <div className="ws-section-header">
              <Target size={20} />
              <h3>Chọn cấp độ</h3>
              <span className="ws-badge">{config.selectedLevels.length} đã chọn</span>
            </div>
            <div className="ws-levels">
              {JLPT_LEVELS.map(level => {
                const isSelected = config.selectedLevels.includes(level);
                const colors = LEVEL_COLORS[level];
                return (
                  <button
                    key={level}
                    className={`ws-level-chip ${isSelected ? 'selected' : ''}`}
                    style={{
                      '--level-bg': colors.bg,
                      '--level-border': colors.border,
                      '--level-text': colors.text,
                    } as React.CSSProperties}
                    onClick={() => onToggleLevel(level)}
                    disabled={countByLevel[level] === 0}
                  >
                    <span className="level-tag">{level}</span>
                    <span className="level-count">{countByLevel[level]}</span>
                    {isSelected && <Check size={16} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Setting */}
          <div className="ws-section">
            <div className="ws-section-header">
              <Clock size={20} />
              <h3>Thời gian</h3>
              <span className="ws-time-display">{config.timePerQuestion}s</span>
            </div>
            <div className="ws-time-options">
              {[15, 20, 30, 45, 60].map(time => (
                <button
                  key={time}
                  className={`ws-time-btn ${config.timePerQuestion === time ? 'active' : ''}`}
                  onClick={() => onSetTime(time)}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="ws-section">
            <div className="ws-section-header">
              <Zap size={20} />
              <h3>Số câu hỏi</h3>
            </div>
            <div className="ws-question-options">
              {[5, 10, 15, 20].map(count => (
                <button
                  key={count}
                  className={`ws-count-btn ${config.totalQuestions === count ? 'active' : ''}`}
                  onClick={() => onSetQuestions(count)}
                >
                  <span className="count-num">{count}</span>
                  <span className="count-label">câu</span>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="ws-info-box">
            <div className="ws-info-item">
              <Star size={16} />
              <span>Có {availableFlashcardsCount} từ vựng phù hợp</span>
            </div>
            <div className="ws-info-item">
              <TrendingUp size={16} />
              <span>Gợi ý xuất hiện: 45%, 60%, 75% thời gian</span>
            </div>
            <div className="ws-info-item">
              <Lightbulb size={16} />
              <span>Nút gợi ý: -20%, -40%, -60% điểm</span>
            </div>
          </div>
        </div>

        <div className="ws-setup-footer">
          <button className="ws-btn ws-btn-ghost" onClick={onClose}>
            <Home size={18} /> Thoát
          </button>
          <button
            className="ws-btn ws-btn-secondary"
            onClick={onStartSolo}
            disabled={availableFlashcardsCount < 3 || config.selectedLevels.length === 0}
          >
            <Play size={18} /> Chơi ngay
          </button>
          <button
            className="ws-btn ws-btn-primary"
            onClick={onStartMultiplayer}
            disabled={availableFlashcardsCount < 3 || config.selectedLevels.length === 0}
          >
            <Plus size={18} /> Tạo phòng
          </button>
        </div>
      </div>
    </div>
  );
};
