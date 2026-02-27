// Kanji Drop pool grid — selectable kanji tiles

import type { PoolTile } from './kanji-drop-types';

interface PoolGridProps {
  tiles: PoolTile[];
  onPickTile: (tileId: string) => void;
}

export function PoolGrid({ tiles, onPickTile }: PoolGridProps) {
  const unselectedCount = tiles.filter(t => !t.selected).length;

  return (
    <div className="kd-pool">
      <div className="kd-pool-header">
        <span>Chọn Kanji</span>
        <span className="kd-pool-count">Còn {unselectedCount}/{tiles.length}</span>
      </div>
      <div className="kd-pool-grid">
        {tiles.map(tile => (
          <button
            key={tile.id}
            className={`kd-pool-tile ${tile.selected ? 'selected' : ''}`}
            onClick={() => !tile.selected && onPickTile(tile.id)}
            disabled={tile.selected}
            title={tile.meaning}
          >
            <span className="kd-tile-char">{tile.kanjiChar}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
