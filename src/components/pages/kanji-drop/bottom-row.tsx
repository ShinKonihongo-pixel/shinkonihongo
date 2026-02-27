// Kanji Drop bottom row — 10 slots with locked indicators

import { Lock } from 'lucide-react';
import type { BottomSlot } from './kanji-drop-types';

interface BottomRowProps {
  slots: BottomSlot[];
}

export function BottomRow({ slots }: BottomRowProps) {
  return (
    <div className="kd-bottom">
      <div className="kd-bottom-label">Hàng xếp</div>
      <div className="kd-bottom-row">
        {slots.map(slot => (
          <div
            key={slot.index}
            className={`kd-bottom-slot ${slot.locked ? 'locked' : ''} ${slot.tile ? 'filled' : 'empty'}`}
          >
            {slot.locked && !slot.tile && (
              <Lock size={16} className="kd-lock-icon" />
            )}
            {slot.tile && (
              <span className="kd-slot-char">{slot.tile.kanjiChar}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
