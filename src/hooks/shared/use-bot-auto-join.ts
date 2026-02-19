import { useRef, useCallback, useEffect } from 'react';
import { generateBots } from '../../types/game-hub';
import { generateId } from '../../lib/game-utils';

interface BotSchedule {
  delay: number;
  count: number;
}

interface UseBotAutoJoinConfig<TPlayer> {
  /** Create a player record for a bot */
  createBotPlayer: (bot: { name: string; avatar: string; intelligence: import('../../types/game-hub').BotIntelligence }, botId: string) => TPlayer;
  /** Default schedules for bot joining */
  schedules?: BotSchedule[];
  /** Optional transform applied after players are added */
  transformAfterJoin?: <TGame extends { players: Record<string, TPlayer> }>(game: TGame) => TGame;
}

const DEFAULT_SCHEDULES: BotSchedule[] = [
  { delay: 15000, count: 1 },
  { delay: 30000, count: 2 },
];

/** Generate staggered bot schedules for Golden Bell solo mode.
 *  - 1 bot at 15s
 *  - Then 1-5 random bots over the next 30s (15s-45s window)
 *  - If more than 2 bots, each gets a random delay within the 30s window
 */
export function generateGoldenBellSoloBotSchedules(): BotSchedule[] {
  const schedules: BotSchedule[] = [
    { delay: 15000, count: 1 }, // First bot at 15s
  ];

  const extraBotCount = Math.floor(Math.random() * 5) + 1; // 1-5

  if (extraBotCount <= 2) {
    // 1-2 bots: join together at a random time in 15s-45s window
    const delay = 15000 + Math.floor(Math.random() * 30000);
    schedules.push({ delay, count: extraBotCount });
  } else {
    // 3-5 bots: stagger each bot at random times within 15s-45s
    for (let i = 0; i < extraBotCount; i++) {
      const delay = 15000 + Math.floor(Math.random() * 30000);
      schedules.push({ delay, count: 1 });
    }
  }

  return schedules;
}

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

  /** Add a single batch of bots to the game */
  const addBotsToGame = useCallback(<TGame extends { status: string; players: Record<string, TPlayer> }>(
    setGame: (updater: (prev: TGame | null) => TGame | null) => void,
    maxPlayers: number,
    count: number
  ) => {
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

      if (transformAfterJoin) {
        updatedGame = transformAfterJoin(updatedGame);
      }

      return updatedGame;
    });
  }, [createBotPlayer, transformAfterJoin]);

  /** Schedule bots to join a game. Pass the game setter function.
   *  Optionally pass custom schedules to override the default ones. */
  const scheduleBotJoin = useCallback(<TGame extends { status: string; players: Record<string, TPlayer> }>(
    setGame: (updater: (prev: TGame | null) => TGame | null) => void,
    maxPlayers: number,
    customSchedules?: BotSchedule[]
  ) => {
    clearBotTimers();

    const activeSchedules = customSchedules || schedules;

    activeSchedules.forEach(({ delay, count }) => {
      const timer = setTimeout(() => {
        addBotsToGame(setGame, maxPlayers, count);
      }, delay);
      botTimerRefs.current.push(timer);
    });
  }, [clearBotTimers, addBotsToGame, schedules]);

  return { scheduleBotJoin, clearBotTimers };
}
