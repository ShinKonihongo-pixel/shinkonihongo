/**
 * GameCreateSliders — rounds, time-per-question, max-players sliders and host-mode picker.
 */

import { Clock, HelpCircle, Users, Eye } from 'lucide-react';
import type { HostMode } from '../../types/quiz-game';
import { VIP_MAX_ROUNDS, VIP_MAX_PLAYERS } from './game-create-types';

interface GameCreateSlidersProps {
  isFlashcardSource: boolean;
  isSuperAdmin: boolean;
  isVipOrAdmin: boolean;
  totalRounds: number;
  timePerQuestion: number;
  maxPlayers: number;
  hostMode: HostMode;
  maxRoundsLimit: number;
  maxPlayersLimit: number;
  upgradeHint: string | null;
  roundsPercent: number;
  timePercent: number;
  playersPercent: number;
  onRoundsChange: (val: number) => void;
  onTimeChange: (val: number) => void;
  onPlayersChange: (val: number) => void;
  onHostModeChange: (mode: HostMode) => void;
}

export function GameCreateSliders({
  isFlashcardSource,
  isSuperAdmin,
  isVipOrAdmin,
  totalRounds,
  timePerQuestion,
  maxPlayers,
  hostMode,
  maxRoundsLimit,
  maxPlayersLimit,
  upgradeHint,
  roundsPercent,
  timePercent,
  playersPercent,
  onRoundsChange,
  onTimeChange,
  onPlayersChange,
  onHostModeChange,
}: GameCreateSlidersProps) {
  return (
    <>
      {/* Rounds */}
      <div className="rm-field">
        <label className="rm-label">
          <HelpCircle size={16} />
          <span>Số câu hỏi</span>
          <span className="rm-label-hint">
            <span className="rm-label-value">{totalRounds} câu</span>
          </span>
        </label>
        <div className="rm-slider-wrap">
          <input
            type="range"
            className="rm-slider"
            min={10}
            max={VIP_MAX_ROUNDS}
            step={5}
            value={totalRounds}
            onChange={e => {
              const val = parseInt(e.target.value);
              onRoundsChange(val);
            }}
            style={{ '--progress': `${roundsPercent}%` } as React.CSSProperties}
          />
          <div className="rm-slider-labels">
            <span>10</span>
            {!isVipOrAdmin && <span style={{ color: 'var(--rm-primary, #7C3AED)' }}>{maxRoundsLimit}</span>}
            <span>{VIP_MAX_ROUNDS}</span>
          </div>
        </div>
        {upgradeHint === 'rounds' && (
          <div className="rm-upgrade-hint">🌟 Nâng cấp VIP để tạo tới {VIP_MAX_ROUNDS} câu hỏi</div>
        )}
      </div>

      {/* Time per question — flashcard source only */}
      {isFlashcardSource && (
        <div className="rm-field">
          <label className="rm-label">
            <Clock size={16} />
            <span>Thời gian mỗi câu</span>
            <span className="rm-label-hint">
              <span className="rm-label-value">{timePerQuestion}s</span>
            </span>
          </label>
          <div className="rm-slider-wrap">
            <input
              type="range"
              className="rm-slider"
              min={5}
              max={30}
              step={5}
              value={timePerQuestion}
              onChange={e => onTimeChange(parseInt(e.target.value))}
              style={{ '--progress': `${timePercent}%` } as React.CSSProperties}
            />
            <div className="rm-slider-labels">
              <span>5s</span>
              <span>15s</span>
              <span>30s</span>
            </div>
          </div>
        </div>
      )}

      {/* Max Players */}
      <div className="rm-field">
        <label className="rm-label">
          <Users size={16} />
          <span>Số người chơi tối đa</span>
          <span className="rm-label-hint">
            <span className="rm-label-value">{maxPlayers} người</span>
          </span>
        </label>
        <div className="rm-slider-wrap">
          <input
            type="range"
            className="rm-slider"
            min={2}
            max={VIP_MAX_PLAYERS}
            step={1}
            value={maxPlayers}
            onChange={e => {
              const val = parseInt(e.target.value);
              onPlayersChange(val);
            }}
            style={{ '--progress': `${playersPercent}%` } as React.CSSProperties}
          />
          <div className="rm-slider-labels">
            <span>2</span>
            {!isVipOrAdmin && <span style={{ color: 'var(--rm-primary, #7C3AED)' }}>{maxPlayersLimit}</span>}
            <span>{VIP_MAX_PLAYERS}</span>
          </div>
        </div>
        {upgradeHint === 'players' && (
          <div className="rm-upgrade-hint">🌟 Nâng cấp VIP để mời tới {VIP_MAX_PLAYERS} người chơi</div>
        )}
      </div>

      {/* Host Mode — super_admin only */}
      {isSuperAdmin && (
        <div className="rm-field">
          <label className="rm-label">
            <Eye size={16} />
            <span>Chế độ</span>
          </label>
          <div className="rm-pills">
            <button
              type="button"
              className={`rm-pill lg ${hostMode === 'play' ? 'active' : ''}`}
              onClick={() => onHostModeChange('play')}
            >
              🎮 Chơi cùng
            </button>
            <button
              type="button"
              className={`rm-pill lg ${hostMode === 'spectate' ? 'active' : ''}`}
              onClick={() => onHostModeChange('spectate')}
            >
              👁️ Theo dõi
            </button>
          </div>
          {hostMode === 'spectate' && (
            <span className="rm-filter-hint">Bạn sẽ theo dõi tiến trình chơi mà không tham gia trả lời</span>
          )}
        </div>
      )}
    </>
  );
}
