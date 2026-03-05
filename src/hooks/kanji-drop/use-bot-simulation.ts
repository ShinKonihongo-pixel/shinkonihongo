// Kanji Drop bot simulation — simulates AI players progressing through levels
// Each bot has random intelligence + speed, affecting how fast they complete levels

import { useEffect, useRef } from 'react';
import type { KanjiDropMultiplayerGame, KanjiDropMultiplayerPlayer } from '../../components/pages/kanji-drop/kanji-drop-multiplayer-types';
import type { SetGame } from '../shared/game-types';

// Intelligence → base interval (ms) to complete one level + score per level
const BOT_PROFILES = {
  weak:    { baseInterval: 25000, intervalVariance: 10000, baseScore: 60,  scoreVariance: 30,  failChance: 0.15 },
  average: { baseInterval: 18000, intervalVariance: 8000,  baseScore: 100, scoreVariance: 40,  failChance: 0.08 },
  smart:   { baseInterval: 12000, intervalVariance: 5000,  baseScore: 150, scoreVariance: 50,  failChance: 0.03 },
  genius:  { baseInterval: 8000,  intervalVariance: 3000,  baseScore: 200, scoreVariance: 60,  failChance: 0.01 },
} as const;

interface UseBotSimulationProps {
  game: KanjiDropMultiplayerGame | null;
  setGame: SetGame<KanjiDropMultiplayerGame>;
}

export function useBotSimulation({ game, setGame }: UseBotSimulationProps) {
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Only simulate when game is playing
    if (!game || game.status !== 'playing') {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      return;
    }

    const bots = Object.entries(game.players).filter(([, p]) => p.isBot);
    if (bots.length === 0) return;

    const levelStart = game.settings.levelStart;
    const levelEnd = game.settings.levelEnd;
    const totalLevels = levelEnd - levelStart + 1;

    // Schedule level completions for each bot
    for (const [botId, bot] of bots) {
      if (bot.finishedAt) continue; // already finished

      const intelligence = bot.botIntelligence || 'average';
      const profile = BOT_PROFILES[intelligence];

      // Random initial delay (2-6s) so bots don't all start at exactly the same time
      const initialDelay = 2000 + Math.random() * 4000;
      scheduleBotLevel(botId, bot, profile, levelStart, levelEnd, totalLevels, initialDelay);
    }

    function scheduleBotLevel(
      botId: string,
      _bot: KanjiDropMultiplayerPlayer,
      profile: typeof BOT_PROFILES[keyof typeof BOT_PROFILES],
      levelStart: number,
      levelEnd: number,
      totalLevels: number,
      delay: number,
    ) {
      const timer = setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'playing') return prev;
          const currentBot = prev.players[botId];
          if (!currentBot || !currentBot.isBot || currentBot.finishedAt) return prev;

          // Check if bot fails this level (resets progress slightly)
          if (Math.random() < profile.failChance) {
            // Failed — schedule retry with longer delay
            const retryDelay = profile.baseInterval + Math.random() * profile.intervalVariance;
            scheduleBotLevel(botId, currentBot, profile, levelStart, levelEnd, totalLevels, retryDelay);
            return prev;
          }

          const newLevelsCompleted = (currentBot.levelsCompleted || 0) + 1;
          const newLevel = Math.min(levelStart + newLevelsCompleted, levelEnd);
          const levelScore = profile.baseScore + Math.floor(Math.random() * profile.scoreVariance);
          const newScore = (currentBot.score || 0) + levelScore;
          const clearedPerLevel = 15 + Math.floor(Math.random() * 20);
          const newCleared = (currentBot.clearedCount || 0) + clearedPerLevel;
          const isFinished = newLevelsCompleted >= totalLevels;

          const updatedBot: KanjiDropMultiplayerPlayer = {
            ...currentBot,
            currentLevel: newLevel,
            levelsCompleted: newLevelsCompleted,
            score: newScore,
            clearedCount: newCleared,
            ...(isFinished ? { finishedAt: new Date().toISOString() } : {}),
          };

          const updatedPlayers = { ...prev.players, [botId]: updatedBot };
          const allFinished = Object.values(updatedPlayers).every(p => p.finishedAt);

          // Schedule next level if not finished
          if (!isFinished) {
            const nextDelay = profile.baseInterval + Math.random() * profile.intervalVariance;
            scheduleBotLevel(botId, updatedBot, profile, levelStart, levelEnd, totalLevels, nextDelay);
          }

          return {
            ...prev,
            players: updatedPlayers,
            ...(allFinished ? { status: 'finished' as const } : {}),
          };
        });
      }, delay);

      timersRef.current.push(timer);
    }

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, [game?.status, game?.id]); // eslint-disable-line react-hooks/exhaustive-deps
}
