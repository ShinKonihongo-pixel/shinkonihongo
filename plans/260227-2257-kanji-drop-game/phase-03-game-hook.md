# Phase 3: Game Hook

**Parent**: [plan.md](./plan.md)
**Dependencies**: Phase 1 (types), Phase 2 (engine)
**Date**: 2026-02-27 | **Priority**: High | **Status**: Pending

## Overview

Implement `useKanjiDropGame` hook managing full game lifecycle. Orchestrates: setup config -> pool generation -> tile pick -> place -> reflow -> cascade clear -> win/lose check -> level progression. Also handles power-ups and reward distribution.

## Key Insights

- Follows `useWordScrambleGame` pattern: single hook returns config state, game state, and action handlers
- Game flow per pick: snapshot(undo) -> mark pool tile selected -> placeTile -> cascadeClear -> checkWin/checkLose -> update state
- Level progression stored in localStorage via `STORAGE_KEY`
- Power-up reward: at level start, randomly assign N power-ups (1 regular, 2 VIP) chosen from shuffle/restore/undo
- VIP detection via `isVipRole(currentUser?.role)` from vip-styling util

## Requirements

1. Setup state: selected JLPT levels, start level
2. Game start: generate pool from filtered kanjiCards + level config, init bottom row, assign power-ups
3. Tile pick handler: validate selectable -> snapshot -> mark selected -> place -> cascade -> check end
4. Power-up handlers: shuffle, restore, undo (each decrements count)
5. Level completion: increment level, generate new pool, preserve total score
6. Game over: set phase to 'result', expose final stats
7. Reset: return to setup phase
8. Persistence: save/load highest level reached in localStorage

## Architecture

### File: `src/components/pages/kanji-drop/use-kanji-drop-game.ts`

```typescript
import { useState, useCallback, useMemo } from 'react';
import type { KanjiCard } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type {
  GameState, GamePhase, SetupConfig, PoolTile, BottomSlot, PowerUp, PowerUpType,
} from './kanji-drop-types';
import {
  generatePool, initBottomRow, placeTile, cascadeClear,
  checkWin, checkLose, shufflePool, restoreBottom, createUndoSnapshot,
  mulberry32,
} from './kanji-drop-engine';
import {
  getLevelConfig, SCORE_PER_CLEAR, SCORE_CASCADE_BONUS,
  SCORE_LEVEL_COMPLETE, STORAGE_KEY,
} from './kanji-drop-constants';
import { isVipRole } from '../../../utils/vip-styling';
import { useGameSounds } from '../../../hooks/use-game-sounds';

interface UseKanjiDropGameProps {
  kanjiCards: KanjiCard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
}

export function useKanjiDropGame({ kanjiCards, currentUser }: UseKanjiDropGameProps) {
  const isVip = isVipRole(currentUser?.role);
  const { playCorrect, playWrong, playVictory } = useGameSounds();

  // --- Setup Config ---
  const [setupConfig, setSetupConfig] = useState<SetupConfig>({
    selectedLevels: ['N5'],
    startLevel: loadProgress(),
  });

  // --- Game State ---
  const initialState: GameState = {
    phase: 'setup',
    result: null,
    level: 1,
    seed: Date.now(),
    pool: [],
    bottom: [],
    powerUps: [],
    undoStack: [],
    score: 0,
    moves: 0,
    cascadeCount: 0,
    clearedCount: 0,
    isVip,
    selectedJlptLevels: ['N5'],
  };

  const [gameState, setGameState] = useState<GameState>(initialState);

  // --- Filtered Kanji ---
  const availableKanji = useMemo(() => {
    if (setupConfig.selectedLevels.length === 0) return kanjiCards;
    return kanjiCards.filter(k =>
      setupConfig.selectedLevels.includes(k.jlptLevel as JLPTLevel)
    );
  }, [kanjiCards, setupConfig.selectedLevels]);

  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    ['N5', 'N4', 'N3', 'N2', 'N1'].forEach(level => {
      counts[level] = kanjiCards.filter(k => k.jlptLevel === level).length;
    });
    return counts;
  }, [kanjiCards]);

  // --- Power-up Assignment ---
  function assignPowerUps(count: number, seed: number): PowerUp[] {
    const rng = mulberry32(seed);
    const types: PowerUpType[] = ['shuffle', 'restore', 'undo'];
    const powerUps: PowerUp[] = types.map(type => ({ type, count: 0 }));

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(rng() * types.length);
      powerUps[idx].count++;
    }

    return powerUps;
  }

  // --- Start Game ---
  const startGame = useCallback(() => {
    const level = setupConfig.startLevel || 1;
    const seed = Date.now();
    const config = getLevelConfig(level, isVip);

    if (availableKanji.length < config.kanjiVariety) {
      alert('Cần thêm kanji! Chọn thêm cấp độ JLPT.');
      return;
    }

    const pool = generatePool(availableKanji, config, seed);
    const bottom = initBottomRow(config.lockedSlots);
    const powerUps = assignPowerUps(config.powerUpReward, seed + 1);

    setGameState({
      phase: 'playing',
      result: null,
      level,
      seed,
      pool,
      bottom,
      powerUps,
      undoStack: [],
      score: 0,
      moves: 0,
      cascadeCount: 0,
      clearedCount: 0,
      isVip,
      selectedJlptLevels: setupConfig.selectedLevels,
    });
  }, [setupConfig, isVip, availableKanji]);

  // --- Pick Tile ---
  const pickTile = useCallback((tileId: string) => {
    setGameState(prev => {
      if (prev.phase !== 'playing') return prev;

      const tile = prev.pool.find(t => t.id === tileId && !t.selected);
      if (!tile) return prev;

      // Create undo snapshot before action
      const snapshot = createUndoSnapshot(prev);

      // Mark tile as selected in pool
      const newPool = prev.pool.map(t =>
        t.id === tileId ? { ...t, selected: true } : t
      );

      // Place tile in bottom row
      const newBottom = placeTile(prev.bottom, tile);
      if (!newBottom) {
        // Row is full -> lose
        playWrong();
        return { ...prev, phase: 'result' as GamePhase, result: 'lose' as const };
      }

      // Cascade clear
      const { finalBottom, totalCleared, cascadeCount } = cascadeClear(newBottom);

      // Calculate score
      const clearScore = totalCleared * SCORE_PER_CLEAR;
      const cascadeBonus = cascadeCount > 1 ? (cascadeCount - 1) * SCORE_CASCADE_BONUS : 0;
      const newScore = prev.score + clearScore + cascadeBonus;

      if (totalCleared > 0) playCorrect();

      // Check win
      const won = checkWin(newPool, finalBottom);
      if (won) {
        playVictory();
        saveProgress(prev.level + 1);
        return {
          ...prev,
          pool: newPool,
          bottom: finalBottom,
          score: newScore + SCORE_LEVEL_COMPLETE,
          moves: prev.moves + 1,
          clearedCount: prev.clearedCount + totalCleared,
          cascadeCount: prev.cascadeCount + cascadeCount,
          undoStack: [snapshot],
          phase: 'result' as GamePhase,
          result: 'win' as const,
        };
      }

      // Check lose (row full after cascade)
      const lost = checkLose(finalBottom);
      if (lost) {
        playWrong();
        // Only lose if there are still pool tiles to place
        const remainingPool = newPool.filter(t => !t.selected);
        if (remainingPool.length > 0) {
          return {
            ...prev,
            pool: newPool,
            bottom: finalBottom,
            score: newScore,
            moves: prev.moves + 1,
            clearedCount: prev.clearedCount + totalCleared,
            cascadeCount: prev.cascadeCount + cascadeCount,
            undoStack: [snapshot],
            phase: 'result' as GamePhase,
            result: 'lose' as const,
          };
        }
      }

      return {
        ...prev,
        pool: newPool,
        bottom: finalBottom,
        score: newScore,
        moves: prev.moves + 1,
        clearedCount: prev.clearedCount + totalCleared,
        cascadeCount: prev.cascadeCount + cascadeCount,
        undoStack: [snapshot],
      };
    });
  }, [playCorrect, playWrong, playVictory]);

  // --- Power-ups ---

  const usePowerUp = useCallback((type: PowerUpType) => {
    setGameState(prev => {
      if (prev.phase !== 'playing') return prev;

      const pu = prev.powerUps.find(p => p.type === type);
      if (!pu || pu.count <= 0) return prev;

      const newPowerUps = prev.powerUps.map(p =>
        p.type === type ? { ...p, count: p.count - 1 } : p
      );

      switch (type) {
        case 'shuffle': {
          const newPool = shufflePool(prev.pool, Date.now());
          return { ...prev, pool: newPool, powerUps: newPowerUps };
        }
        case 'restore': {
          const { newPool, newBottom } = restoreBottom(prev.pool, prev.bottom, Date.now());
          return { ...prev, pool: newPool, bottom: newBottom, powerUps: newPowerUps };
        }
        case 'undo': {
          const snapshot = prev.undoStack[0];
          if (!snapshot) return prev;
          return {
            ...prev,
            pool: snapshot.pool,
            bottom: snapshot.bottom,
            score: snapshot.score,
            moves: snapshot.moves,
            powerUps: newPowerUps,
            undoStack: [],
          };
        }
        default:
          return prev;
      }
    });
  }, []);

  // --- Next Level (after win) ---

  const nextLevel = useCallback(() => {
    const newLevel = gameState.level + 1;
    const seed = Date.now();
    const config = getLevelConfig(newLevel, isVip);

    const kanji = availableKanji.length >= config.kanjiVariety
      ? availableKanji
      : kanjiCards; // fallback to all kanji if not enough in selected levels

    const pool = generatePool(kanji, config, seed);
    const bottom = initBottomRow(config.lockedSlots);
    const powerUps = assignPowerUps(config.powerUpReward, seed + 1);

    setGameState(prev => ({
      ...prev,
      phase: 'playing',
      result: null,
      level: newLevel,
      seed,
      pool,
      bottom,
      powerUps,
      undoStack: [],
      moves: 0,
      cascadeCount: 0,
      clearedCount: 0,
    }));
  }, [gameState.level, isVip, availableKanji, kanjiCards]);

  // --- Reset ---

  const resetGame = useCallback(() => {
    setGameState({ ...initialState, isVip });
  }, [isVip]);

  // --- Toggle Level ---

  const toggleLevel = useCallback((level: JLPTLevel) => {
    setSetupConfig(prev => ({
      ...prev,
      selectedLevels: prev.selectedLevels.includes(level)
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level],
    }));
  }, []);

  return {
    // Setup
    setupConfig,
    setSetupConfig,
    availableKanji,
    countByLevel,
    toggleLevel,
    // Game
    gameState,
    isVip,
    // Actions
    startGame,
    pickTile,
    usePowerUp,
    nextLevel,
    resetGame,
  };
}

// --- localStorage helpers ---

function loadProgress(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.highestLevel || 1;
    }
  } catch { /* ignore */ }
  return 1;
}

function saveProgress(level: number) {
  try {
    const existing = loadProgress();
    if (level > existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ highestLevel: level }));
    }
  } catch { /* ignore */ }
}
```

## Related Code Files

| File | Role |
|------|------|
| `src/components/pages/word-scramble/use-word-scramble-game.ts` | Reference hook pattern |
| `src/hooks/use-game-sounds.ts` | Sound effects (playCorrect, playWrong, playVictory) |
| `src/utils/vip-styling.ts` | isVipRole() for VIP detection |
| `src/components/pages/kanji-drop/kanji-drop-engine.ts` | Pure game functions |

## Implementation Steps

1. Create `use-kanji-drop-game.ts`
2. Implement setup config state + toggle handlers
3. Implement `startGame` with pool generation + bottom init + power-up assignment
4. Implement `pickTile` with full pipeline: snapshot -> select -> place -> cascade -> score -> win/lose
5. Implement `usePowerUp` for shuffle/restore/undo
6. Implement `nextLevel` for level progression
7. Implement `resetGame`
8. Implement localStorage persistence helpers
9. Wire up `useGameSounds` for audio feedback

## Todo

- [ ] Create use-kanji-drop-game.ts
- [ ] Verify pick -> place -> cascade -> check pipeline
- [ ] Verify power-up handlers
- [ ] Verify localStorage save/load
- [ ] Verify VIP power-up count (2 vs 1)

## Success Criteria

- Full game lifecycle works: setup -> playing -> result (win/lose)
- Power-ups correctly decrement and execute
- Undo restores exact previous state
- Level progression increments and generates new pool
- Score accumulates across cascades
- localStorage persists highest level

## Risk Assessment

- **State mutation bugs**: mitigated by immutable updates (spread operators)
- **Stale closure in pickTile**: mitigated by using functional setState `setGameState(prev => ...)`
- **localStorage quota**: negligible -- single small JSON object

## Security Considerations

- localStorage is client-only; no server-side validation of level progress (acceptable for casual game)
- VIP role comes from prop, not from localStorage (can't be spoofed locally to unlock extra slots)

## Next Steps

Phase 4: UI Components -- React components consuming hook outputs
