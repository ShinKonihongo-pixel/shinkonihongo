// Game creation logic

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

export function useGameCreate(
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  refs: BingoGameRefs,
  currentUser: UseBingoGameProps['currentUser']
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

      setState(prev => ({ ...prev, game: newGame, gameResults: null }));

      // Helper to add bots
      const addBotsToGame = (botCount: number) => {
        setState(prev => {
          if (!prev.game || prev.game.status !== 'waiting') return prev;

          const currentPlayerCount = Object.keys(prev.game.players).length;
          const availableSlots = prev.game.settings.maxPlayers - currentPlayerCount;
          if (availableSlots <= 0) return prev;

          const actualBotCount = Math.min(botCount, availableSlots);
          const bots = generateBots(actualBotCount);
          const newPlayers: Record<string, BingoPlayer> = { ...prev.game.players };

          bots.forEach((bot) => {
            const botId = `bot-${generateId()}`;
            const botRows = generateBingoRows(
              prev.game!.settings.rowsPerPlayer,
              prev.game!.settings.numbersPerRow,
              prev.game!.settings.numberRange
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

          return { ...prev, game: { ...prev.game, players: newPlayers } };
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
  }, [currentUser, setState, botTimerRef, botTimer2Ref]);

  return { createGame };
}
