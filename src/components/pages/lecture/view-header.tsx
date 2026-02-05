// View mode header component

import { AUTO_ADVANCE_INTERVALS } from './constants';

interface ViewHeaderProps {
  lectureTitle: string;
  autoAdvance: boolean;
  autoAdvanceInterval: number;
  showFloatingNotes: boolean;
  showNotes: boolean;
  isAdmin: boolean;
  onBack: () => void;
  onToggleAutoAdvance: () => void;
  onAutoIntervalChange: (interval: number) => void;
  onToggleGrid: () => void;
  onToggleFloatingNotes: () => void;
  onToggleNotes: () => void;
  onEnterPresent: () => void;
}

export function ViewHeader({
  lectureTitle,
  autoAdvance,
  autoAdvanceInterval,
  showFloatingNotes,
  showNotes,
  isAdmin,
  onBack,
  onToggleAutoAdvance,
  onAutoIntervalChange,
  onToggleGrid,
  onToggleFloatingNotes,
  onToggleNotes,
  onEnterPresent,
}: ViewHeaderProps) {
  return (
    <div className="lecture-view-header">
      <button className="btn btn-back" onClick={onBack}>
        ← Quay lại
      </button>
      <h2>{lectureTitle}</h2>
      <div className="lecture-view-actions">
        <button
          className={`btn btn-auto ${autoAdvance ? 'active' : ''}`}
          onClick={onToggleAutoAdvance}
          title={autoAdvance ? 'Tắt tự động chuyển' : 'Bật tự động chuyển'}
        >
          {autoAdvance ? '⏸️' : '▶️'} Auto
        </button>
        {autoAdvance && (
          <select
            className="auto-interval-select"
            value={autoAdvanceInterval}
            onChange={(e) => onAutoIntervalChange(Number(e.target.value))}
          >
            {AUTO_ADVANCE_INTERVALS.map(interval => (
              <option key={interval} value={interval}>{interval}s</option>
            ))}
          </select>
        )}
        <button
          className="btn btn-secondary"
          onClick={onToggleGrid}
          title="O: Xem tất cả slides"
        >
          ⊞ Grid (O)
        </button>
        <button
          className={`btn btn-secondary ${showFloatingNotes ? 'active' : ''}`}
          onClick={onToggleFloatingNotes}
          title="Ghi chú cá nhân"
        >
          ✏️ Ghi chú
        </button>
        {isAdmin && (
          <button
            className={`btn btn-secondary ${showNotes ? 'active' : ''}`}
            onClick={onToggleNotes}
            title="S: Ghi chú giáo viên"
          >
            📝 Notes
          </button>
        )}
        <button className="btn btn-present" onClick={onEnterPresent}>
          🖥️ Present (F)
        </button>
      </div>
    </div>
  );
}
