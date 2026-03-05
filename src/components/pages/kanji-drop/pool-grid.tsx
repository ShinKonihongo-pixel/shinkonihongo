// Kanji Drop pool — Mahjong-style stacked overlapping cards
// Free (unblocked) cards glow and are selectable; blocked cards are dimmed

import { useMemo } from 'react';
import type { PoolTile } from './kanji-drop-types';
import { STACK_CARD_W, STACK_CARD_H } from './kanji-drop-constants';

interface PoolGridProps {
  tiles: PoolTile[];
  onPickTile: (tileId: string) => void;
  disabled?: boolean;
}

export function PoolGrid({ tiles, onPickTile, disabled }: PoolGridProps) {
  // Compute which tiles are free (no unselected blocker above them)
  const freeTileIds = useMemo(() => {
    const free = new Set<string>();
    for (const tile of tiles) {
      if (tile.selected) continue;
      const isFree = tile.blockedBy.every(blockerId => {
        const blocker = tiles.find(t => t.id === blockerId);
        return !blocker || blocker.selected;
      });
      if (isFree) free.add(tile.id);
    }
    return free;
  }, [tiles]);

  // Container dimensions based on tile positions
  const { containerW, containerH } = useMemo(() => {
    let maxX = 0, maxY = 0;
    for (const tile of tiles) {
      if (!tile.selected) {
        maxX = Math.max(maxX, tile.x + STACK_CARD_W);
        maxY = Math.max(maxY, tile.y + STACK_CARD_H);
      }
    }
    return { containerW: maxX + 8, containerH: maxY + 8 };
  }, [tiles]);

  const unselectedCount = tiles.filter(t => !t.selected).length;

  return (
    <div className="kd-pool">
      <div className="kd-pool-header">
        <span>Chọn Kanji</span>
        <span className="kd-pool-count">Còn {unselectedCount}/{tiles.length}</span>
      </div>
      <div className="kd-stack-wrapper">
        <div
          className="kd-stack-container"
          style={{ width: `${containerW}px`, height: `${containerH}px` }}
        >
          {tiles.map(tile => {
            if (tile.selected) return null;
            const isFree = freeTileIds.has(tile.id);
            return (
              <button
                key={tile.id}
                className={`kd-stack-card ${isFree ? 'free' : 'blocked'}`}
                style={{
                  left: `${tile.x}px`,
                  top: `${tile.y}px`,
                  zIndex: tile.zIndex * 10,
                }}
                onClick={() => isFree && !disabled && onPickTile(tile.id)}
                disabled={!isFree || disabled}
                title={`${tile.kanjiChar} — ${tile.meaning}`}
              >
                <span className="kd-card-char">{tile.kanjiChar}</span>
                <span className="kd-card-meaning">{tile.meaning}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
