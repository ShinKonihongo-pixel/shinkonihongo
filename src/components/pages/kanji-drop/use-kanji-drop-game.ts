// Kanji Drop game hook — manages full game lifecycle
// Setup config -> pool gen -> tile pick -> place -> cascade (animated) -> win/lose -> level progression

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { KanjiCard } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type {
  GameState, GamePhase, SetupConfig, PowerUp, PowerUpType,
} from './kanji-drop-types';
import {
  generatePool, initBottomRow, placeTile, reflowAndScan, clearRuns,
  checkWin, checkLose, shufflePool, restoreBottom,
  createUndoSnapshot, mulberry32,
} from './kanji-drop-engine';
import {
  getLevelConfig, SCORE_PER_CLEAR, SCORE_CASCADE_BONUS,
  SCORE_LEVEL_COMPLETE, STORAGE_KEY, CLEAR_DELAY_MS,
} from './kanji-drop-constants';
import { isVipRole } from '../../../utils/vip-styling';
import { useGameSounds } from '../../../hooks/use-game-sounds';

export interface MultiplayerConfig {
  seed: number;
  levelStart: number;
  levelEnd: number;
  jlptLevels: JLPTLevel[];
  selectedLessons?: string[];
}

interface UseKanjiDropGameProps {
  kanjiCards: KanjiCard[];
  currentUser?: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  multiplayerConfig?: MultiplayerConfig;
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

export function useKanjiDropGame({ kanjiCards, currentUser, multiplayerConfig }: UseKanjiDropGameProps) {
  const isMulti = !!multiplayerConfig;
  const isVip = isVipRole(currentUser?.role);
  const { playCorrect, playWrong, playVictory } = useGameSounds();
  const pendingSoundRef = useRef<'correct' | 'wrong' | 'victory' | null>(null);
  const cascadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Setup Config ---
  const [setupConfig, setSetupConfig] = useState<SetupConfig>({
    selectedLevels: ['N5'],
    startLevel: loadProgress(),
    selectedLessonIds: [],
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
    clearingIndices: [],
  });

  const [gameState, setGameState] = useState<GameState>(makeInitialState);

  // --- Filtered Kanji (by JLPT + lesson) ---
  const availableKanji = useMemo(() => {
    let filtered = kanjiCards;

    // Filter by JLPT levels
    if (setupConfig.selectedLevels.length > 0) {
      filtered = filtered.filter(k => setupConfig.selectedLevels.includes(k.jlptLevel));
    }

    // Filter by selected lessons
    if (setupConfig.selectedLessonIds.length > 0) {
      filtered = filtered.filter(k => setupConfig.selectedLessonIds.includes(k.lessonId));
    }

    return filtered;
  }, [kanjiCards, setupConfig.selectedLevels, setupConfig.selectedLessonIds]);

  const countByLevel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) {
      counts[level] = kanjiCards.filter(k => k.jlptLevel === level).length;
    }
    return counts;
  }, [kanjiCards]);

  // --- Derive available lessons from kanji cards ---
  const kanjiLessons = useMemo(() => {
    const lessonMap = new Map<string, { id: string; count: number; jlptLevel: JLPTLevel }>();
    const filtered = setupConfig.selectedLevels.length > 0
      ? kanjiCards.filter(k => setupConfig.selectedLevels.includes(k.jlptLevel))
      : kanjiCards;

    for (const card of filtered) {
      const existing = lessonMap.get(card.lessonId);
      if (existing) {
        existing.count++;
      } else {
        lessonMap.set(card.lessonId, {
          id: card.lessonId,
          count: 1,
          jlptLevel: card.jlptLevel,
        });
      }
    }
    return Array.from(lessonMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [kanjiCards, setupConfig.selectedLevels]);

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

  // --- Filtered Kanji for multiplayer ---
  const mpKanji = useMemo(() => {
    if (!multiplayerConfig) return [];
    let filtered = kanjiCards.filter(k => multiplayerConfig.jlptLevels.includes(k.jlptLevel));
    // Also filter by selected lessons if specified
    if (multiplayerConfig.selectedLessons && multiplayerConfig.selectedLessons.length > 0) {
      filtered = filtered.filter(k => multiplayerConfig.selectedLessons!.includes(k.lessonId));
    }
    return filtered;
  }, [kanjiCards, multiplayerConfig]);

  // --- Cascade animation: when clearingIndices set, wait then clear ---
  useEffect(() => {
    if (gameState.clearingIndices.length === 0 || gameState.phase !== 'playing') return;

    cascadeTimerRef.current = setTimeout(() => {
      setGameState(prev => {
        if (prev.clearingIndices.length === 0) return prev;

        // Build runs from clearingIndices (group into contiguous sets)
        const runs = [prev.clearingIndices];
        const { newBottom, clearedCount } = clearRuns(prev.bottom, runs);
        const clearScore = clearedCount * SCORE_PER_CLEAR;
        const cascadeBonus = prev.cascadeCount > 0 ? SCORE_CASCADE_BONUS : 0;
        const newScore = prev.score + clearScore + cascadeBonus;
        const newClearedCount = prev.clearedCount + clearedCount;
        const newCascadeCount = prev.cascadeCount + 1;

        // Reflow and scan for more runs
        const { reflowed, runs: nextRuns } = reflowAndScan(newBottom);

        if (nextRuns.length > 0) {
          // More cascades
          return {
            ...prev,
            bottom: reflowed,
            score: newScore,
            clearedCount: newClearedCount,
            cascadeCount: newCascadeCount,
            clearingIndices: nextRuns.flat(),
          };
        }

        // No more cascades - check win/lose
        if (checkWin(prev.pool, reflowed)) {
          saveProgress(prev.level + 1);
          return {
            ...prev,
            bottom: reflowed,
            score: newScore + SCORE_LEVEL_COMPLETE,
            clearedCount: newClearedCount,
            cascadeCount: newCascadeCount,
            clearingIndices: [],
            phase: 'result' as GamePhase,
            result: 'win' as const,
          };
        }

        if (checkLose(reflowed) && prev.pool.some(t => !t.selected)) {
          return {
            ...prev,
            bottom: reflowed,
            score: newScore,
            clearedCount: newClearedCount,
            cascadeCount: newCascadeCount,
            clearingIndices: [],
            phase: 'result' as GamePhase,
            result: 'lose' as const,
          };
        }

        return {
          ...prev,
          bottom: reflowed,
          score: newScore,
          clearedCount: newClearedCount,
          cascadeCount: newCascadeCount,
          clearingIndices: [],
        };
      });
    }, CLEAR_DELAY_MS);

    return () => {
      if (cascadeTimerRef.current) clearTimeout(cascadeTimerRef.current);
    };
  }, [gameState.clearingIndices, gameState.phase]);

  // --- Start Game (single-player) ---
  const startGame = useCallback(() => {
    const level = setupConfig.startLevel || 1;
    const seed = Date.now();
    const config = getLevelConfig(level, isVip);
    const kanji = availableKanji.length >= config.kanjiVariety ? availableKanji : kanjiCards;

    if (kanji.length < config.kanjiVariety) return;

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
      clearingIndices: [],
      mode: 'single',
    });
  }, [setupConfig, isVip, availableKanji, kanjiCards]);

  // --- Start Multiplayer Game ---
  const startMultiplayerGame = useCallback(() => {
    if (!multiplayerConfig) return;
    const { seed, levelStart, jlptLevels, levelEnd } = multiplayerConfig;
    const level = levelStart;
    const levelSeed = seed + level;
    const config = getLevelConfig(level, isVip);
    const kanji = mpKanji.length >= config.kanjiVariety ? mpKanji : kanjiCards;

    if (kanji.length < config.kanjiVariety) return;

    const pool = generatePool(kanji, config, levelSeed);
    const bottom = initBottomRow(config.lockedSlots);
    const powerUps = assignPowerUps(config.powerUpReward, levelSeed + 1);

    setGameState({
      phase: 'playing',
      result: null,
      level,
      seed: levelSeed,
      pool,
      bottom,
      powerUps,
      undoStack: [],
      score: 0,
      moves: 0,
      cascadeCount: 0,
      clearedCount: 0,
      isVip,
      selectedJlptLevels: jlptLevels,
      clearingIndices: [],
      mode: 'multi',
      levelStart,
      levelEnd,
      levelsCompleted: 0,
    });
  }, [multiplayerConfig, isVip, mpKanji, kanjiCards]);

  // --- Pick Tile (animated cascade) ---
  const pickTile = useCallback((tileId: string) => {
    pendingSoundRef.current = null;

    setGameState(prev => {
      if (prev.phase !== 'playing') return prev;
      if (prev.clearingIndices.length > 0) return prev; // wait for cascade

      const tile = prev.pool.find(t => t.id === tileId && !t.selected);
      if (!tile) return prev;

      // Create undo snapshot
      const snapshot = createUndoSnapshot(prev);

      // Mark tile as selected in pool
      const newPool = prev.pool.map(t =>
        t.id === tileId ? { ...t, selected: true } : t
      );

      // Place tile in bottom row
      const newBottom = placeTile(prev.bottom, tile);
      if (!newBottom) {
        pendingSoundRef.current = 'wrong';
        return { ...prev, phase: 'result' as GamePhase, result: 'lose' as const };
      }

      // Reflow and scan for runs
      const { reflowed, runs } = reflowAndScan(newBottom);

      if (runs.length > 0) {
        // Runs found — mark clearing indices, wait for animation
        pendingSoundRef.current = 'correct';
        return {
          ...prev,
          pool: newPool,
          bottom: reflowed,
          moves: prev.moves + 1,
          undoStack: [snapshot],
          clearingIndices: runs.flat(),
        };
      }

      // No runs — check win/lose immediately
      if (checkWin(newPool, reflowed)) {
        pendingSoundRef.current = 'victory';
        saveProgress(prev.level + 1);
        return {
          ...prev,
          pool: newPool,
          bottom: reflowed,
          score: prev.score + SCORE_LEVEL_COMPLETE,
          moves: prev.moves + 1,
          undoStack: [snapshot],
          clearingIndices: [],
          phase: 'result' as GamePhase,
          result: 'win' as const,
        };
      }

      if (checkLose(reflowed) && newPool.some(t => !t.selected)) {
        pendingSoundRef.current = 'wrong';
        return {
          ...prev,
          pool: newPool,
          bottom: reflowed,
          moves: prev.moves + 1,
          undoStack: [snapshot],
          clearingIndices: [],
          phase: 'result' as GamePhase,
          result: 'lose' as const,
        };
      }

      return {
        ...prev,
        pool: newPool,
        bottom: reflowed,
        moves: prev.moves + 1,
        undoStack: [snapshot],
        clearingIndices: [],
      };
    });

    const sound = pendingSoundRef.current;
    if (sound === 'correct') playCorrect();
    else if (sound === 'wrong') playWrong();
    else if (sound === 'victory') playVictory();
  }, [playCorrect, playWrong, playVictory]);

  // --- Power-ups ---
  const usePowerUp = useCallback((type: PowerUpType) => {
    setGameState(prev => {
      if (prev.phase !== 'playing') return prev;
      if (prev.clearingIndices.length > 0) return prev;

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
            clearingIndices: [],
          };
        }
        default:
          return prev;
      }
    });
  }, []);

  // --- Next Level ---
  const nextLevel = useCallback(() => {
    if (cascadeTimerRef.current) clearTimeout(cascadeTimerRef.current);

    setGameState(prev => {
      const newLevel = prev.level + 1;
      const newLevelsCompleted = (prev.levelsCompleted || 0) + 1;

      if (prev.mode === 'multi' && prev.levelEnd && newLevel > prev.levelEnd) {
        return { ...prev, levelsCompleted: newLevelsCompleted };
      }

      const seed = prev.mode === 'multi' && multiplayerConfig
        ? multiplayerConfig.seed + newLevel
        : Date.now();
      const config = getLevelConfig(newLevel, isVip);
      const kanji = prev.mode === 'multi'
        ? (mpKanji.length >= config.kanjiVariety ? mpKanji : kanjiCards)
        : (availableKanji.length >= config.kanjiVariety ? availableKanji : kanjiCards);

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
        clearingIndices: [],
        levelsCompleted: newLevelsCompleted,
      };
    });
  }, [isVip, availableKanji, mpKanji, kanjiCards, multiplayerConfig]);

  // --- Reset ---
  const resetGame = useCallback(() => {
    if (cascadeTimerRef.current) clearTimeout(cascadeTimerRef.current);
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
      clearingIndices: [],
    });
  }, [isVip]);

  // --- Toggle Level ---
  const toggleLevel = useCallback((level: JLPTLevel) => {
    setSetupConfig(prev => ({
      ...prev,
      selectedLevels: prev.selectedLevels.includes(level)
        ? prev.selectedLevels.filter(l => l !== level)
        : [...prev.selectedLevels, level],
      selectedLessonIds: [], // reset lesson selection when JLPT changes
    }));
  }, []);

  // --- Toggle Lesson ---
  const toggleLesson = useCallback((lessonId: string) => {
    setSetupConfig(prev => ({
      ...prev,
      selectedLessonIds: prev.selectedLessonIds.includes(lessonId)
        ? prev.selectedLessonIds.filter(id => id !== lessonId)
        : [...prev.selectedLessonIds, lessonId],
    }));
  }, []);

  return {
    setupConfig, setSetupConfig, availableKanji, countByLevel, kanjiLessons,
    toggleLevel, toggleLesson,
    gameState, setGameState, isVip, isMulti,
    startGame, startMultiplayerGame, pickTile, usePowerUp, nextLevel, resetGame,
  };
}
