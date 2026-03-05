// Kanji Drop bottom row — 10 slots with locked indicators and clearing animation

import { Lock } from 'lucide-react';
import type { BottomSlot } from './kanji-drop-types';

interface BottomRowProps {
  slots: BottomSlot[];
  clearingIndices?: number[];
}

export function BottomRow({ slots, clearingIndices = [] }: BottomRowProps) {
  return (
    <div className="kd-bottom">
      <div className="kd-bottom-label">Hàng xếp</div>
      <div className="kd-bottom-row">
        {slots.map(slot => {
          const isClearing = clearingIndices.includes(slot.index);
          return (
            <div
              key={slot.index}
              className={`kd-bottom-slot ${slot.locked ? 'locked' : ''} ${slot.tile ? 'filled' : 'empty'} ${isClearing ? 'clearing' : ''}`}
            >
              {slot.locked && !slot.tile && (
                <Lock size={16} className="kd-lock-icon" />
              )}
              {slot.tile && (
                <span className="kd-slot-char">{slot.tile.kanjiChar}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
