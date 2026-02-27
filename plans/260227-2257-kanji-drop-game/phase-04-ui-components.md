# Phase 4: UI Components

**Parent**: [plan.md](./plan.md)
**Dependencies**: Phase 1 (types), Phase 3 (hook)
**Date**: 2026-02-27 | **Priority**: High | **Status**: Pending

## Overview

Create all React UI components: page wrapper, setup screen, pool grid, bottom row, power-up bar, playing screen layout, result screen, and tutorial overlay. Follows word-scramble component structure.

## Key Insights

- Word-scramble pattern: page-level component (`kanji-drop-page.tsx`) in `src/components/pages/`, sub-components in `src/components/pages/kanji-drop/`
- Page component owns the hook, distributes state/actions to child components
- No multiplayer/lobby -- directly goes setup -> play -> result
- Vietnamese UI labels throughout
- Mobile-first: pool grid uses CSS grid with responsive columns

## Requirements

1. KanjiDropPage: orchestrates phases (setup/playing/result), owns hook
2. SetupScreen: JLPT level selector, start level display, VIP badge, available kanji count
3. PoolGrid: grid of selectable kanji tiles, disabled when selected
4. BottomRow: 10 slots, locked indicators, occupied tiles with kanji chars
5. PowerUpBar: 3 buttons (shuffle/restore/undo) with remaining counts, disabled when 0
6. PlayingScreen: layout combining pool + bottom + power-ups + score/level header
7. ResultScreen: win/lose state, score summary, next level / replay / exit buttons
8. TutorialOverlay: first-time instructions (stored in localStorage)

## Architecture

### File: `src/components/pages/kanji-drop-page.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import type { KanjiCard } from '../../types/kanji';
import type { GameSession } from '../../types/user';
import { useKanjiDropGame } from './kanji-drop/use-kanji-drop-game';
import { SetupScreen } from './kanji-drop/setup-screen';
import { PlayingScreen } from './kanji-drop/playing-screen';
import { ResultScreen } from './kanji-drop/result-screen';
import './kanji-drop/kanji-drop.css';

export interface KanjiDropPageProps {
  onClose: () => void;
  kanjiCards: KanjiCard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  onSaveGameSession?: (data: Omit<GameSession, 'id' | 'userId'>) => void;
}

export const KanjiDropPage: React.FC<KanjiDropPageProps> = ({
  onClose,
  kanjiCards,
  currentUser,
  onSaveGameSession,
}) => {
  const {
    setupConfig, setSetupConfig, availableKanji, countByLevel, toggleLevel,
    gameState, isVip,
    startGame, pickTile, usePowerUp, nextLevel, resetGame,
  } = useKanjiDropGame({ kanjiCards, currentUser });

  const sessionSaved = useRef(false);

  // Save game session on result
  useEffect(() => {
    if (gameState.phase === 'result' && !sessionSaved.current && onSaveGameSession) {
      sessionSaved.current = true;
      onSaveGameSession({
        date: new Date().toISOString().split('T')[0],
        gameTitle: 'Kanji Drop',
        rank: gameState.result === 'win' ? 1 : 2,
        totalPlayers: 1,
        score: gameState.score,
        correctAnswers: gameState.clearedCount,
        totalQuestions: gameState.pool.length,
      });
    }
    if (gameState.phase !== 'result') sessionSaved.current = false;
  }, [gameState, onSaveGameSession]);

  return (
    <div className="kd-page">
      {gameState.phase === 'setup' && (
        <SetupScreen
          config={setupConfig}
          availableKanjiCount={availableKanji.length}
          countByLevel={countByLevel}
          isVip={isVip}
          onClose={onClose}
          onStart={startGame}
          onToggleLevel={toggleLevel}
          onSetStartLevel={(level) => setSetupConfig(prev => ({ ...prev, startLevel: level }))}
        />
      )}

      {gameState.phase === 'playing' && (
        <PlayingScreen
          gameState={gameState}
          onPickTile={pickTile}
          onUsePowerUp={usePowerUp}
          onClose={onClose}
        />
      )}

      {gameState.phase === 'result' && (
        <ResultScreen
          gameState={gameState}
          onNextLevel={nextLevel}
          onReplay={resetGame}
          onClose={onClose}
        />
      )}
    </div>
  );
};
```

### File: `src/components/pages/kanji-drop/setup-screen.tsx`

```typescript
import React from 'react';
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

export const SetupScreen: React.FC<SetupScreenProps> = ({
  config, availableKanjiCount, countByLevel, isVip,
  onClose, onStart, onToggleLevel, onSetStartLevel,
}) => {
  const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

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
                  <span className="kd-level-count">{countByLevel[level]}</span>
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
            <p>Có {availableKanjiCount} kanji phù hợp</p>
            {isVip && <p>VIP: 10 ô mở khóa + 2 power-up/màn</p>}
            {!isVip && <p>8 ô mở khóa + 1 power-up/màn</p>}
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
};
```

### File: `src/components/pages/kanji-drop/pool-grid.tsx`

```typescript
import React from 'react';
import type { PoolTile } from './kanji-drop-types';

interface PoolGridProps {
  tiles: PoolTile[];
  onPickTile: (tileId: string) => void;
}

export const PoolGrid: React.FC<PoolGridProps> = ({ tiles, onPickTile }) => {
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
};
```

### File: `src/components/pages/kanji-drop/bottom-row.tsx`

```typescript
import React from 'react';
import { Lock } from 'lucide-react';
import type { BottomSlot } from './kanji-drop-types';

interface BottomRowProps {
  slots: BottomSlot[];
}

export const BottomRow: React.FC<BottomRowProps> = ({ slots }) => {
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
};
```

### File: `src/components/pages/kanji-drop/power-up-bar.tsx`

```typescript
import React from 'react';
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

export const PowerUpBar: React.FC<PowerUpBarProps> = ({ powerUps, onUsePowerUp }) => {
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
};
```

### File: `src/components/pages/kanji-drop/playing-screen.tsx`

```typescript
import React from 'react';
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

export const PlayingScreen: React.FC<PlayingScreenProps> = ({
  gameState, onPickTile, onUsePowerUp, onClose,
}) => {
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

      {/* Pool Grid */}
      <PoolGrid tiles={gameState.pool} onPickTile={onPickTile} />

      {/* Bottom Row */}
      <BottomRow slots={gameState.bottom} />

      {/* Power-ups */}
      <PowerUpBar powerUps={gameState.powerUps} onUsePowerUp={onUsePowerUp} />
    </div>
  );
};
```

### File: `src/components/pages/kanji-drop/result-screen.tsx`

```typescript
import React from 'react';
import { Home, RotateCcw, ArrowRight, Trophy } from 'lucide-react';
import type { GameState } from './kanji-drop-types';

interface ResultScreenProps {
  gameState: GameState;
  onNextLevel: () => void;
  onReplay: () => void;
  onClose: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  gameState, onNextLevel, onReplay, onClose,
}) => {
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
};
```

### File: `src/components/pages/kanji-drop/tutorial-overlay.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TUTORIAL_KEY = 'kanji-drop-tutorial-seen';

export const TutorialOverlay: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) setShow(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShow(false);
    onDismiss();
  };

  if (!show) return null;

  return (
    <div className="kd-tutorial-overlay" onClick={handleDismiss}>
      <div className="kd-tutorial-card" onClick={e => e.stopPropagation()}>
        <button className="kd-tutorial-close" onClick={handleDismiss}>
          <X size={20} />
        </button>
        <h2>Cách chơi Kanji Drop</h2>
        <div className="kd-tutorial-steps">
          <div className="kd-tutorial-step">
            <span className="step-num">1</span>
            <p>Chọn kanji từ bảng trên</p>
          </div>
          <div className="kd-tutorial-step">
            <span className="step-num">2</span>
            <p>Kanji rơi vào hàng dưới, tự gom nhóm</p>
          </div>
          <div className="kd-tutorial-step">
            <span className="step-num">3</span>
            <p>3+ kanji giống nhau liền kề sẽ bị xóa</p>
          </div>
          <div className="kd-tutorial-step">
            <span className="step-num">4</span>
            <p>Xóa hết tất cả để chiến thắng!</p>
          </div>
        </div>
        <button className="kd-btn kd-btn-primary" onClick={handleDismiss}>
          Đã hiểu!
        </button>
      </div>
    </div>
  );
};
```

### File: `src/components/pages/kanji-drop/index.ts` (updated)

```typescript
export * from './kanji-drop-types';
export * from './kanji-drop-constants';
export * from './kanji-drop-engine';
```

## Related Code Files

| File | Role |
|------|------|
| `src/components/pages/word-scramble-page.tsx` | Reference: page-level orchestration pattern |
| `src/components/pages/word-scramble/setup-screen.tsx` | Reference: setup UI |
| `src/components/pages/word-scramble/playing-screen.tsx` | Reference: playing layout |
| `src/components/pages/word-scramble/result-screen.tsx` | Reference: result display |
| lucide-react | Icon library (already in project) |

## Implementation Steps

1. Create `src/components/pages/kanji-drop/setup-screen.tsx`
2. Create `pool-grid.tsx`
3. Create `bottom-row.tsx`
4. Create `power-up-bar.tsx`
5. Create `playing-screen.tsx` (composes pool + bottom + power-ups)
6. Create `result-screen.tsx`
7. Create `tutorial-overlay.tsx`
8. Create `src/components/pages/kanji-drop-page.tsx` (top-level page)
9. Update `index.ts` with engine export

## Todo

- [ ] setup-screen.tsx
- [ ] pool-grid.tsx
- [ ] bottom-row.tsx
- [ ] power-up-bar.tsx
- [ ] playing-screen.tsx
- [ ] result-screen.tsx
- [ ] tutorial-overlay.tsx
- [ ] kanji-drop-page.tsx (top-level)
- [ ] Update index.ts

## Success Criteria

- All components render without errors
- Setup -> Playing -> Result flow works end-to-end
- Pool tiles are clickable and show disabled state when selected
- Bottom row shows tiles, locked indicators, and empty slots
- Power-up buttons show count and disable at 0
- Result screen differentiates win/lose
- Tutorial shows once on first visit

## Risk Assessment

- **Pool grid overflow on mobile**: mitigated by CSS grid auto-fit with min 48px tiles
- **Bottom row 10 slots on small screens**: mitigated by horizontal scroll or 5+5 stacked layout
- **Tutorial blocking game start**: mitigated by dismissible overlay, stored in localStorage

## Security Considerations

- No user input beyond clicks; no XSS vectors
- localStorage for tutorial flag is non-sensitive

## Next Steps

Phase 5: Styling & Animations -- CSS for all components
