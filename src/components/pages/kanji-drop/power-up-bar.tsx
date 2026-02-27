// Kanji Drop power-up bar — shuffle, restore, undo buttons with counts

import { Shuffle, RotateCcw, Undo2 } from 'lucide-react';
import type { PowerUp, PowerUpType } from './kanji-drop-types';

interface PowerUpBarProps {
  powerUps: PowerUp[];
  onUsePowerUp: (type: PowerUpType) => void;
}

const POWER_UP_META: Record<PowerUpType, { icon: typeof Shuffle; label: string; color: string }> = {
  shuffle: { icon: Shuffle, label: 'Xáo trộn', color: '#f59e0b' },
  restore: { icon: RotateCcw, label: 'Khôi phục', color: '#10b981' },
  undo: { icon: Undo2, label: 'Hoàn tác', color: '#6366f1' },
};

export function PowerUpBar({ powerUps, onUsePowerUp }: PowerUpBarProps) {
  return (
    <div className="kd-powerups">
      {powerUps.map(pu => {
        const meta = POWER_UP_META[pu.type];
        const Icon = meta.icon;
        return (
          <button
            key={pu.type}
            className={`kd-powerup-btn ${pu.count <= 0 ? 'disabled' : ''}`}
            onClick={() => pu.count > 0 && onUsePowerUp(pu.type)}
            disabled={pu.count <= 0}
            style={{ '--pu-color': meta.color } as React.CSSProperties}
          >
            <Icon size={18} />
            <span className="kd-pu-label">{meta.label}</span>
            <span className="kd-pu-count">{pu.count}</span>
          </button>
        );
      })}
    </div>
  );
}
