// Kanji Drop playing screen — game layout with stacked pool, bottom row, power-ups

import { Home, Trophy, Layers } from 'lucide-react';
import type { GameState, PowerUpType } from './kanji-drop-types';
import { PoolGrid } from './pool-grid';
import { BottomRow } from './bottom-row';
import { PowerUpBar } from './power-up-bar';

interface PlayingScreenProps {
  gameState: GameState;
  onPickTile: (tileId: string) => void;
  onUsePowerUp: (type: PowerUpType) => void;
  onClose: () => void;
}

export function PlayingScreen({
  gameState, onPickTile, onUsePowerUp, onClose,
}: PlayingScreenProps) {
  const isCascading = gameState.clearingIndices.length > 0;

  return (
    <div className="kd-playing">
      {/* Header */}
      <div className="kd-game-header">
        <button className="kd-btn kd-btn-icon" onClick={onClose}>
          <Home size={18} />
        </button>
        <div className="kd-game-info">
          <span className="kd-level-badge">
            <Layers size={14} /> Màn {gameState.level}
          </span>
          <span className="kd-score-display">
            <Trophy size={14} /> {gameState.score}
          </span>
        </div>
        <div className="kd-moves-display">
          Bước: {gameState.moves}
        </div>
      </div>

      {/* Pool Grid (stacked cards) */}
      <PoolGrid
        tiles={gameState.pool}
        onPickTile={onPickTile}
        disabled={isCascading}
      />

      {/* Bottom Row */}
      <BottomRow
        slots={gameState.bottom}
        clearingIndices={gameState.clearingIndices}
      />

      {/* Power-ups */}
      <PowerUpBar powerUps={gameState.powerUps} onUsePowerUp={onUsePowerUp} />
    </div>
  );
}
