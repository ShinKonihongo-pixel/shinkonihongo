import { useRef, useCallback, useEffect } from 'react';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';

interface BotSchedule {
  delay: number;
  count: number;
}

interface UseBotAutoJoinConfig<TPlayer> {
  /** Create a player record for a bot */
  createBotPlayer: (bot: { name: string; avatar: string }, botId: string) => TPlayer;
  /** Default schedules for bot joining */
  schedules?: BotSchedule[];
  /** Optional transform applied after players are added */
  transformAfterJoin?: <TGame extends { players: Record<string, TPlayer> }>(game: TGame) => TGame;
}

const DEFAULT_SCHEDULES: BotSchedule[] = [
  { delay: 15000, count: 1 },
  { delay: 30000, count: 2 },
];

export function useBotAutoJoin<TPlayer>(config: UseBotAutoJoinConfig<TPlayer>) {
  const { createBotPlayer, schedules = DEFAULT_SCHEDULES, transformAfterJoin } = config;
  const botTimerRefs = useRef<NodeJS.Timeout[]>([]);

  const clearBotTimers = useCallback(() => {
    botTimerRefs.current.forEach(t => clearTimeout(t));
    botTimerRefs.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      botTimerRefs.current.forEach(t => clearTimeout(t));
    };
  }, []);

  /** Schedule bots to join a game. Pass the game setter function. */
  const scheduleBotJoin = useCallback(<TGame extends { status: string; players: Record<string, TPlayer> }>(
    setGame: (updater: (prev: TGame | null) => TGame | null) => void,
    maxPlayers: number
  ) => {
    clearBotTimers();

    schedules.forEach(({ delay, count }) => {
      const timer = setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'waiting') return prev;

          const currentCount = Object.keys(prev.players).length;
          const available = maxPlayers - currentCount;
          if (available <= 0) return prev;

          const actualCount = Math.min(count, available);
          const bots = generateBots(actualCount);
          const newPlayers = { ...prev.players };

          bots.forEach(bot => {
            const botId = `bot-${generateId()}`;
            newPlayers[botId] = createBotPlayer(bot, botId);
          });

          let updatedGame = { ...prev, players: newPlayers };

          // Apply optional transformation
          if (transformAfterJoin) {
            updatedGame = transformAfterJoin(updatedGame);
          }

          return updatedGame;
        });
      }, delay);
      botTimerRefs.current.push(timer);
    });
  }, [clearBotTimers, createBotPlayer, schedules, transformAfterJoin]);

  return { scheduleBotJoin, clearBotTimers };
}
