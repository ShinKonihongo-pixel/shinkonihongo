// Bingo Game Hook - Manages all game state and logic
// Handles game creation, joining, number drawing, skills, and bingo

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  BingoGame,
  BingoPlayer,
  BingoResults,
  BingoPlayerResult,
  CreateBingoGameData,
  BingoGameSettings,
  BingoSkillType,
  BingoRow,
  DrawnNumber,
} from '../types/bingo-game';
import {
  generateBingoRows,
  generateNumberPool,
  isRowComplete,
  canClaimBingo,
  DEFAULT_BINGO_SETTINGS,
} from '../types/bingo-game';
import { generateBots } from '../types/game-hub';

// Bot auto-join settings
const BOT_FIRST_JOIN_DELAY = 10000; // 10 seconds - add 1 bot
const BOT_SECOND_JOIN_DELAY = 20000; // 20 seconds - add 2 more bots

// Generate random 6-digit code
function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Hook props
interface UseBingoGameProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
}

export function useBingoGame({ currentUser }: UseBingoGameProps) {
  // Game state
  const [game, setGame] = useState<BingoGame | null>(null);
  const [gameResults, setGameResults] = useState<BingoResults | null>(null);
  const [availableRooms] = useState<BingoGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for timers
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimer2Ref = useRef<NodeJS.Timeout | null>(null);
  const botDrawTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Computed values
  const isHost = useMemo(() => game?.hostId === currentUser.id, [game, currentUser]);
  const currentPlayer = useMemo(() => game?.players[currentUser.id], [game, currentUser]);

  // Get sorted players by completed rows and marked count
  const sortedPlayers = useMemo(() => {
    if (!game) return [];
    return Object.values(game.players).sort((a, b) => {
      // By completed rows first
      if (b.completedRows !== a.completedRows) return b.completedRows - a.completedRows;
      // Then by marked count
      return b.markedCount - a.markedCount;
    });
  }, [game]);

  // Check if it's skill phase
  const isSkillPhase = useMemo(() => {
    if (!game || !game.settings.skillsEnabled) return false;
    return game.currentTurn > 0 && game.currentTurn % game.settings.skillInterval === 0;
  }, [game]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
      if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    };
  }, []);

  // Create new game
  const createGame = useCallback(async (data: CreateBingoGameData) => {
    setLoading(true);
    setError(null);

    try {
      const settings: BingoGameSettings = {
        ...DEFAULT_BINGO_SETTINGS,
        maxPlayers: data.maxPlayers,
        skillsEnabled: data.skillsEnabled,
      };

      const playerRows = generateBingoRows(
        settings.rowsPerPlayer,
        settings.numbersPerRow,
        settings.numberRange
      );

      const player: BingoPlayer = {
        odinhId: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        rows: playerRows,
        markedCount: 0,
        completedRows: 0,
        canBingo: false,
        hasBingoed: false,
        isBlocked: false,
        luckBonus: 1.0,
        luckTurnsLeft: 0,
        hasSkillAvailable: false,
        hasFiftyFifty: false,
      };

      const newGame: BingoGame = {
        id: generateId(),
        code: generateGameCode(),
        hostId: currentUser.id,
        title: data.title,
        settings,
        status: 'waiting',
        players: { [currentUser.id]: player },
        drawnNumbers: [],
        availableNumbers: generateNumberPool(settings.numberRange),
        currentTurn: 0,
        currentDrawerId: null,
        lastDrawnNumber: null,
        winnerId: null,
        createdAt: new Date().toISOString(),
      };

      setGame(newGame);
      setGameResults(null);

      // Helper to add bots
      const addBotsToGame = (botCount: number) => {
        setGame(prevGame => {
          if (!prevGame || prevGame.status !== 'waiting') return prevGame;

          const currentPlayerCount = Object.keys(prevGame.players).length;
          const availableSlots = prevGame.settings.maxPlayers - currentPlayerCount;
          if (availableSlots <= 0) return prevGame;

          const actualBotCount = Math.min(botCount, availableSlots);
          const bots = generateBots(actualBotCount);
          const newPlayers: Record<string, BingoPlayer> = { ...prevGame.players };

          bots.forEach((bot) => {
            const botId = `bot-${generateId()}`;
            const botRows = generateBingoRows(
              prevGame.settings.rowsPerPlayer,
              prevGame.settings.numbersPerRow,
              prevGame.settings.numberRange
            );

            newPlayers[botId] = {
              odinhId: botId,
              displayName: bot.name,
              avatar: bot.avatar,
              rows: botRows,
              markedCount: 0,
              completedRows: 0,
              canBingo: false,
              hasBingoed: false,
              isBlocked: false,
              luckBonus: 1.0,
              luckTurnsLeft: 0,
              hasSkillAvailable: false,
              hasFiftyFifty: false,
              isBot: true,
            };
          });

          return { ...prevGame, players: newPlayers };
        });
      };

      // Clear existing bot timers
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);

      // Bot join timers
      botTimerRef.current = setTimeout(() => addBotsToGame(1), BOT_FIRST_JOIN_DELAY);
      botTimer2Ref.current = setTimeout(() => addBotsToGame(2), BOT_SECOND_JOIN_DELAY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo trò chơi');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Join existing game
  const joinGame = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // In real app, this would fetch from server
      // For now, simulate joining (would need real multiplayer backend)
      throw new Error('Chức năng tham gia phòng đang phát triển');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia trò chơi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave game
  const leaveGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, []);

  // Start game
  const startGame = useCallback(async () => {
    if (!game || !isHost) return;

    const playerCount = Object.keys(game.players).length;
    if (playerCount < game.settings.minPlayers) {
      setError(`Cần ít nhất ${game.settings.minPlayers} người chơi`);
      return;
    }

    // Clear bot join timers
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'starting',
        startedAt: new Date().toISOString(),
      };
    });

    // After countdown, start playing
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'playing',
          currentTurn: 1,
        };
      });
    }, 3000);
  }, [game, isHost]);

  // Draw a number
  const drawNumber = useCallback(() => {
    if (!game || game.status !== 'playing') return;
    if (!currentPlayer || currentPlayer.isBlocked) return;
    if (game.availableNumbers.length === 0) return;

    setGame(prev => {
      if (!prev) return null;

      // Pick random number (considering luck bonus)
      const luckBonus = prev.players[currentUser.id]?.luckBonus || 1.0;
      let drawnNumber: number;

      // Find numbers that would benefit the current player
      const myNumbers = new Set<number>();
      prev.players[currentUser.id]?.rows.forEach(row => {
        row.cells.forEach(cell => {
          if (!cell.marked) myNumbers.add(cell.number);
        });
      });

      // Apply luck: higher chance to draw a number that matches player's cards
      if (luckBonus > 1 && Math.random() < (luckBonus - 1)) {
        const beneficialNumbers = prev.availableNumbers.filter(n => myNumbers.has(n));
        if (beneficialNumbers.length > 0) {
          drawnNumber = beneficialNumbers[Math.floor(Math.random() * beneficialNumbers.length)];
        } else {
          drawnNumber = prev.availableNumbers[Math.floor(Math.random() * prev.availableNumbers.length)];
        }
      } else {
        drawnNumber = prev.availableNumbers[Math.floor(Math.random() * prev.availableNumbers.length)];
      }

      // Remove from available
      const newAvailable = prev.availableNumbers.filter(n => n !== drawnNumber);

      // Add to drawn history
      const newDrawn: DrawnNumber = {
        number: drawnNumber,
        drawerId: currentUser.id,
        drawerName: currentUser.displayName,
        timestamp: Date.now(),
      };

      // Mark number for all players
      const newPlayers: Record<string, BingoPlayer> = {};
      Object.entries(prev.players).forEach(([id, player]) => {
        const updatedRows = player.rows.map(row => {
          const updatedCells = row.cells.map(cell => {
            if (cell.number === drawnNumber && !cell.marked) {
              return { ...cell, marked: true };
            }
            return cell;
          });
          return {
            ...row,
            cells: updatedCells,
            isComplete: updatedCells.every(c => c.marked),
          };
        });

        const markedCount = updatedRows.reduce(
          (sum, row) => sum + row.cells.filter(c => c.marked).length,
          0
        );
        const completedRows = updatedRows.filter(r => r.isComplete).length;
        const canBingo = completedRows > 0 && !player.hasBingoed;

        // Decrease luck turns
        let newLuckBonus = player.luckBonus;
        let newLuckTurns = player.luckTurnsLeft;
        if (player.luckTurnsLeft > 0) {
          newLuckTurns--;
          if (newLuckTurns === 0) newLuckBonus = 1.0;
        }

        // Clear blocked status after drawing
        newPlayers[id] = {
          ...player,
          rows: updatedRows,
          markedCount,
          completedRows,
          canBingo,
          isBlocked: false,
          luckBonus: newLuckBonus,
          luckTurnsLeft: newLuckTurns,
          hasSkillAvailable: (prev.currentTurn + 1) % prev.settings.skillInterval === 0 && prev.settings.skillsEnabled,
        };
      });

      const newTurn = prev.currentTurn + 1;
      const isSkillTime = newTurn % prev.settings.skillInterval === 0 && prev.settings.skillsEnabled;

      return {
        ...prev,
        availableNumbers: newAvailable,
        drawnNumbers: [...prev.drawnNumbers, newDrawn],
        lastDrawnNumber: drawnNumber,
        players: newPlayers,
        currentTurn: newTurn,
        currentDrawerId: currentUser.id,
        status: isSkillTime ? 'skill_phase' : 'playing',
      };
    });
  }, [game, currentPlayer, currentUser]);

  // Claim bingo
  const claimBingo = useCallback(() => {
    if (!game || !currentPlayer) return;
    if (!currentPlayer.canBingo || currentPlayer.hasBingoed) return;

    // Verify bingo is valid
    const hasCompletedRow = currentPlayer.rows.some(row => isRowComplete(row));
    if (!hasCompletedRow) {
      setError('Bạn chưa có đủ 5 số trong một dãy!');
      return;
    }

    // Set winner
    setGame(prev => {
      if (!prev) return null;

      const updatedPlayers = { ...prev.players };
      updatedPlayers[currentUser.id] = {
        ...updatedPlayers[currentUser.id],
        hasBingoed: true,
      };

      return {
        ...prev,
        players: updatedPlayers,
        status: 'finished',
        winnerId: currentUser.id,
        finishedAt: new Date().toISOString(),
      };
    });

    // Generate results
    setTimeout(() => {
      if (!game) return;

      const rankings: BingoPlayerResult[] = Object.values(game.players)
        .map(p => ({
          odinhId: p.odinhId,
          displayName: p.displayName,
          avatar: p.avatar,
          rank: 0,
          markedCount: p.markedCount,
          completedRows: p.completedRows,
          isWinner: p.odinhId === currentUser.id,
        }))
        .sort((a, b) => {
          if (a.isWinner) return -1;
          if (b.isWinner) return 1;
          if (b.completedRows !== a.completedRows) return b.completedRows - a.completedRows;
          return b.markedCount - a.markedCount;
        })
        .map((p, idx) => ({ ...p, rank: idx + 1 }));

      const results: BingoResults = {
        gameId: game.id,
        winner: rankings.find(r => r.isWinner) || null,
        rankings,
        totalTurns: game.currentTurn,
        totalPlayers: Object.keys(game.players).length,
        drawnNumbers: game.drawnNumbers.map(d => d.number),
      };

      setGameResults(results);
    }, 100);
  }, [game, currentPlayer, currentUser]);

  // Use skill
  const useSkill = useCallback((skillType: BingoSkillType, targetId?: string) => {
    if (!game || !currentPlayer) return;
    if (!currentPlayer.hasSkillAvailable) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers: Record<string, BingoPlayer> = { ...prev.players };
      const player = newPlayers[currentUser.id];

      switch (skillType) {
        case 'remove_mark':
          if (targetId && newPlayers[targetId]) {
            const target = newPlayers[targetId];
            // Find a marked cell to unmark
            for (const row of target.rows) {
              const markedCell = row.cells.find(c => c.marked);
              if (markedCell) {
                markedCell.marked = false;
                row.isComplete = row.cells.every(c => c.marked);
                target.markedCount--;
                target.completedRows = target.rows.filter(r => r.isComplete).length;
                target.canBingo = target.completedRows > 0 && !target.hasBingoed;
                break;
              }
            }
          }
          break;

        case 'auto_add':
          // Mark a random unmarked cell
          for (const row of player.rows) {
            const unmarkedCell = row.cells.find(c => !c.marked);
            if (unmarkedCell) {
              unmarkedCell.marked = true;
              row.isComplete = row.cells.every(c => c.marked);
              player.markedCount++;
              player.completedRows = player.rows.filter(r => r.isComplete).length;
              player.canBingo = player.completedRows > 0 && !player.hasBingoed;
              break;
            }
          }
          break;

        case 'increase_luck':
          player.luckBonus = 1.3;
          player.luckTurnsLeft = 3;
          break;

        case 'block_turn':
          if (targetId && newPlayers[targetId]) {
            newPlayers[targetId].isBlocked = true;
          }
          break;

        case 'fifty_fifty':
          player.hasFiftyFifty = true;
          break;
      }

      // Mark skill as used
      player.hasSkillAvailable = false;

      // Return to playing status
      return {
        ...prev,
        players: newPlayers,
        status: 'playing',
      };
    });
  }, [game, currentPlayer, currentUser]);

  // Skip skill phase
  const skipSkill = useCallback(() => {
    if (!game) return;

    setGame(prev => {
      if (!prev) return null;

      const newPlayers = { ...prev.players };
      if (newPlayers[currentUser.id]) {
        newPlayers[currentUser.id].hasSkillAvailable = false;
      }

      // Check if all players have used/skipped skills
      const allDone = Object.values(newPlayers).every(p => !p.hasSkillAvailable);

      return {
        ...prev,
        players: newPlayers,
        status: allDone ? 'playing' : 'skill_phase',
      };
    });
  }, [game, currentUser]);

  // Bot auto-play
  useEffect(() => {
    if (!game || game.status !== 'playing' || !isHost) return;

    // Bot draws after a delay
    const botPlayers = Object.values(game.players).filter(p => p.isBot && !p.isBlocked);
    if (botPlayers.length === 0) return;

    // Simulate bot drawing
    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);

    botDrawTimerRef.current = setTimeout(() => {
      // Check if any bot can claim bingo
      const botWithBingo = Object.values(game.players).find(
        p => p.isBot && p.canBingo && !p.hasBingoed
      );

      if (botWithBingo) {
        // Bot claims bingo with 80% chance
        if (Math.random() < 0.8) {
          setGame(prev => {
            if (!prev) return null;

            const updatedPlayers = { ...prev.players };
            updatedPlayers[botWithBingo.odinhId] = {
              ...updatedPlayers[botWithBingo.odinhId],
              hasBingoed: true,
            };

            return {
              ...prev,
              players: updatedPlayers,
              status: 'finished',
              winnerId: botWithBingo.odinhId,
              finishedAt: new Date().toISOString(),
            };
          });

          // Generate results for bot win
          setTimeout(() => {
            if (!game) return;

            const rankings: BingoPlayerResult[] = Object.values(game.players)
              .map(p => ({
                odinhId: p.odinhId,
                displayName: p.displayName,
                avatar: p.avatar,
                rank: 0,
                markedCount: p.markedCount,
                completedRows: p.completedRows,
                isWinner: p.odinhId === botWithBingo.odinhId,
              }))
              .sort((a, b) => {
                if (a.isWinner) return -1;
                if (b.isWinner) return 1;
                return b.completedRows - a.completedRows;
              })
              .map((p, idx) => ({ ...p, rank: idx + 1 }));

            const results: BingoResults = {
              gameId: game.id,
              winner: rankings.find(r => r.isWinner) || null,
              rankings,
              totalTurns: game.currentTurn,
              totalPlayers: Object.keys(game.players).length,
              drawnNumbers: game.drawnNumbers.map(d => d.number),
            };

            setGameResults(results);
          }, 100);
        }
      }
    }, 2000 + Math.random() * 2000);

    return () => {
      if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    };
  }, [game, isHost]);

  // Reset game
  const resetGame = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);
    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    setGame(null);
    setGameResults(null);
  }, []);

  return {
    // State
    game,
    gameResults,
    availableRooms,
    loading,
    error,

    // Computed
    isHost,
    currentPlayer,
    sortedPlayers,
    isSkillPhase,

    // Actions
    createGame,
    joinGame,
    leaveGame,
    startGame,
    drawNumber,
    claimBingo,
    useSkill,
    skipSkill,
    resetGame,
    setError,
  };
}
