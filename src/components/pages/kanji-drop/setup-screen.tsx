// Kanji Drop setup screen — JLPT level selector, start level, VIP badge

import { Home, Play, Target, Star, Crown } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { SetupConfig } from './kanji-drop-types';

interface SetupScreenProps {
  config: SetupConfig;
  availableKanjiCount: number;
  countByLevel: Record<string, number>;
  isVip: boolean;
  onClose: () => void;
  onStart: () => void;
  onToggleLevel: (level: JLPTLevel) => void;
  onSetStartLevel: (level: number) => void;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function SetupScreen({
  config, availableKanjiCount, countByLevel, isVip,
  onClose, onStart, onToggleLevel, onSetStartLevel,
}: SetupScreenProps) {
  return (
    <div className="kd-setup">
      <div className="kd-setup-card">
        <div className="kd-setup-header">
          <span className="kd-logo-icon">🀄</span>
          <h1>Kanji Drop</h1>
          <p className="kd-subtitle">Xếp kanji - Gom nhóm - Tiêu diệt</p>
          {isVip && <span className="kd-vip-badge"><Crown size={14} /> VIP</span>}
        </div>

        <div className="kd-setup-body">
          {/* JLPT Level Selection */}
          <div className="kd-section">
            <div className="kd-section-header">
              <Target size={20} />
              <h3>Chọn cấp độ JLPT</h3>
            </div>
            <div className="kd-levels">
              {JLPT_LEVELS.map(level => (
                <button
                  key={level}
                  className={`kd-level-chip ${config.selectedLevels.includes(level) ? 'selected' : ''}`}
                  onClick={() => onToggleLevel(level)}
                  disabled={countByLevel[level] === 0}
                >
                  <span>{level}</span>
                  <span className="kd-level-count">{countByLevel[level] || 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Start Level */}
          <div className="kd-section">
            <div className="kd-section-header">
              <Star size={20} />
              <h3>Bắt đầu từ màn</h3>
            </div>
            <div className="kd-level-select">
              {[1, 5, 10, 15].filter(l => l <= config.startLevel || l === 1).map(level => (
                <button
                  key={level}
                  className={`kd-start-btn ${config.startLevel === level ? 'active' : ''}`}
                  onClick={() => onSetStartLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="kd-info-box">
            <p>Có <strong>{availableKanjiCount}</strong> kanji phù hợp</p>
            {isVip
              ? <p className="kd-vip-info">VIP: 10 ô mở khóa + 2 power-up/màn</p>
              : <p>8 ô mở khóa + 1 power-up/màn</p>
            }
          </div>
        </div>

        <div className="kd-setup-footer">
          <button className="kd-btn kd-btn-ghost" onClick={onClose}>
            <Home size={18} /> Thoát
          </button>
          <button
            className="kd-btn kd-btn-primary"
            onClick={onStart}
            disabled={availableKanjiCount < 4 || config.selectedLevels.length === 0}
          >
            <Play size={18} /> Bắt đầu
          </button>
        </div>
      </div>
    </div>
  );
}
