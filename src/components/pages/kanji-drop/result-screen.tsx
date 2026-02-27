// Kanji Drop result screen — win/lose display with stats and actions

import { Home, RotateCcw, ArrowRight, Trophy } from 'lucide-react';
import type { GameState } from './kanji-drop-types';

interface ResultScreenProps {
  gameState: GameState;
  onNextLevel: () => void;
  onReplay: () => void;
  onClose: () => void;
}

export function ResultScreen({
  gameState, onNextLevel, onReplay, onClose,
}: ResultScreenProps) {
  const isWin = gameState.result === 'win';

  return (
    <div className="kd-result">
      <div className="kd-result-card">
        <div className="kd-result-header">
          <div className="kd-result-emoji">{isWin ? '🎉' : '😢'}</div>
          <h1>{isWin ? 'Hoàn thành!' : 'Thất bại!'}</h1>
          <p>Màn {gameState.level}</p>
        </div>

        <div className="kd-result-stats">
          <div className="kd-stat">
            <span className="kd-stat-icon"><Trophy size={18} /></span>
            <span className="kd-stat-value">{gameState.score}</span>
            <span className="kd-stat-label">Điểm</span>
          </div>
          <div className="kd-stat">
            <span className="kd-stat-icon">🀄</span>
            <span className="kd-stat-value">{gameState.clearedCount}</span>
            <span className="kd-stat-label">Đã xóa</span>
          </div>
          <div className="kd-stat">
            <span className="kd-stat-icon">🔥</span>
            <span className="kd-stat-value">{gameState.cascadeCount}</span>
            <span className="kd-stat-label">Cascade</span>
          </div>
          <div className="kd-stat">
            <span className="kd-stat-icon">👆</span>
            <span className="kd-stat-value">{gameState.moves}</span>
            <span className="kd-stat-label">Bước</span>
          </div>
        </div>

        <div className="kd-result-actions">
          <button className="kd-btn kd-btn-ghost" onClick={onClose}>
            <Home size={18} /> Thoát
          </button>
          <button className="kd-btn kd-btn-secondary" onClick={onReplay}>
            <RotateCcw size={18} /> Chơi lại
          </button>
          {isWin && (
            <button className="kd-btn kd-btn-primary" onClick={onNextLevel}>
              <ArrowRight size={18} /> Màn tiếp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
