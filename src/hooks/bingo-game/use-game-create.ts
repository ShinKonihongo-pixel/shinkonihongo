// Game creation logic
// Handles game initialization - writes to Firestore for cross-device multiplayer

import { useCallback } from 'react';
import type {
  BingoGame,
  BingoPlayer,
  BingoGameSettings,
  CreateBingoGameData,
} from '../../types/bingo-game';
import {
  generateBingoRows,
  generateNumberPool,
  DEFAULT_BINGO_SETTINGS,
} from '../../types/bingo-game';
import { generateBots } from '../../types/game-hub';
import { generateGameCode, generateId, BOT_FIRST_JOIN_DELAY, BOT_SECOND_JOIN_DELAY } from './utils';
import type { UseBingoGameProps, BingoGameState, BingoGameRefs } from './types';
import { createGameRoom } from '../../services/game-rooms';

export function useGameCreate(
  setGame: (updater: ((prev: BingoGame | null) => BingoGame | null) | BingoGame | null) => void,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  refs: BingoGameRefs,
  currentUser: UseBingoGameProps['currentUser'],
  setRoomId: (id: string | null) => void
) {
  const { botTimerRef, botTimer2Ref } = refs;

  // Create new game
  const createGame = useCallback(async (data: CreateBingoGameData) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

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
        role: currentUser.role,
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

      const gameData: Omit<BingoGame, 'id'> = {
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

      // Write to Firestore
      const firestoreId = await createGameRoom('bingo', gameData as unknown as Record<string, unknown>);

      // Set room ID first (enables Firestore subscription)
      setRoomId(firestoreId);

      // Set local game state
      const newGame: BingoGame = { id: firestoreId, ...gameData };
      setGame(newGame);
      setState(prev => ({ ...prev, gameResults: null }));

      // Helper to add bots
      const addBotsToGame = (botCount: number) => {
        setGame(prev => {
          if (!prev || prev.status !== 'waiting') return prev;

          const currentPlayerCount = Object.keys(prev.players).length;
          const availableSlots = prev.settings.maxPlayers - currentPlayerCount;
          if (availableSlots <= 0) return prev;

          const actualBotCount = Math.min(botCount, availableSlots);
          const bots = generateBots(actualBotCount);
          const newPlayers: Record<string, BingoPlayer> = { ...prev.players };

          bots.forEach((bot) => {
            const botId = `bot-${generateId()}`;
            const botRows = generateBingoRows(
              prev.settings.rowsPerPlayer,
              prev.settings.numbersPerRow,
              prev.settings.numberRange
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

          return { ...prev, players: newPlayers };
        });
      };

      // Clear existing bot timers
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (botTimer2Ref.current) clearTimeout(botTimer2Ref.current);

      // Bot join timers
      botTimerRef.current = setTimeout(() => addBotsToGame(1), BOT_FIRST_JOIN_DELAY);
      botTimer2Ref.current = setTimeout(() => addBotsToGame(2), BOT_SECOND_JOIN_DELAY);
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Không thể tạo trò chơi'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [currentUser, setGame, setState, setRoomId, botTimerRef, botTimer2Ref]);

  return { createGame };
}
