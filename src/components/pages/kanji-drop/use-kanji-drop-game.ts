// Kanji Drop game hook — manages full game lifecycle
// Setup config -> pool gen -> tile pick -> place -> cascade -> win/lose -> level progression

import { useState, useCallback, useMemo, useRef } from 'react';
import type { KanjiCard } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type {
  GameState, GamePhase, SetupConfig, PowerUp, PowerUpType,
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

export function useKanjiDropGame({ kanjiCards, currentUser }: UseKanjiDropGameProps) {
  const isVip = isVipRole(currentUser?.role);
  const { playCorrect, playWrong, playVictory } = useGameSounds();
  const pendingSoundRef = useRef<'correct' | 'wrong' | 'victory' | null>(null);

  // --- Setup Config ---
  const [setupConfig, setSetupConfig] = useState<SetupConfig>({
    selectedLevels: ['N5'],
    startLevel: loadProgress(),
  });

  // --- Game State ---
  const makeInitialState = (): GameState => ({
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
  });

  const [gameState, setGameState] = useState<GameState>(makeInitialState);

  // --- Filtered Kanji ---
  const availableKanji = useMemo(() => {
    if (setupConfig.selectedLevels.length === 0) return kanjiCards;
    return kanjiCards.filter(k => setupConfig.selectedLevels.includes(k.jlptLevel));
  }, [kanjiCards, setupConfig.selectedLevels]);

  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
      counts[level] = kanjiCards.filter(k => k.jlptLevel === level).length;
    }
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
    const kanji = availableKanji.length >= config.kanjiVariety ? availableKanji : kanjiCards;

    if (kanji.length < config.kanjiVariety) return; // not enough kanji

    const pool = generatePool(kanji, config, seed);
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
  }, [setupConfig, isVip, availableKanji, kanjiCards]);

  // --- Pick Tile ---
  const pickTile = useCallback((tileId: string) => {
    pendingSoundRef.current = null;

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
        pendingSoundRef.current = 'wrong';
        return { ...prev, phase: 'result' as GamePhase, result: 'lose' as const };
      }

      // Cascade clear
      const { finalBottom, totalCleared, cascadeCount } = cascadeClear(newBottom);

      // Calculate score
      const clearScore = totalCleared * SCORE_PER_CLEAR;
      const cascadeBonus = cascadeCount > 1 ? (cascadeCount - 1) * SCORE_CASCADE_BONUS : 0;
      const newScore = prev.score + clearScore + cascadeBonus;

      if (totalCleared > 0) pendingSoundRef.current = 'correct';

      // Check win
      if (checkWin(newPool, finalBottom)) {
        pendingSoundRef.current = 'victory';
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

      // Check lose (row full after cascade, still have pool tiles)
      if (checkLose(finalBottom) && newPool.some(t => !t.selected)) {
        pendingSoundRef.current = 'wrong';
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

    // Play sound after state update (outside updater for StrictMode safety)
    const sound = pendingSoundRef.current;
    if (sound === 'correct') playCorrect();
    else if (sound === 'wrong') playWrong();
    else if (sound === 'victory') playVictory();
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
    setGameState(prev => {
      const newLevel = prev.level + 1;
      const seed = Date.now();
      const config = getLevelConfig(newLevel, isVip);
      const kanji = availableKanji.length >= config.kanjiVariety ? availableKanji : kanjiCards;

      const pool = generatePool(kanji, config, seed);
      const bottom = initBottomRow(config.lockedSlots);
      const powerUps = assignPowerUps(config.powerUpReward, seed + 1);

      return {
        ...prev,
        phase: 'playing' as GamePhase,
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
      };
    });
  }, [isVip, availableKanji, kanjiCards]);

  // --- Reset ---
  const resetGame = useCallback(() => {
    setGameState({
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
    });
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
    setupConfig, setSetupConfig, availableKanji, countByLevel, toggleLevel,
    gameState, isVip,
    startGame, pickTile, usePowerUp, nextLevel, resetGame,
  };
}
