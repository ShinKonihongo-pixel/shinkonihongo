// Bot management helpers
import type { RacingGame, RacingPlayer } from '../../types/racing-game';
import { DEFAULT_VEHICLES } from '../../types/racing-game';
import { generateBots } from '../../types/game-hub';
import { generateId } from './utils';

export function addBotsToGame(
  prevGame: RacingGame | null,
  botCount: number
): RacingGame | null {
  if (!prevGame || prevGame.status !== 'waiting') return prevGame;

  const currentPlayerCount = Object.keys(prevGame.players).length;
  const maxPlayers = prevGame.settings.maxPlayers;
  const availableSlots = maxPlayers - currentPlayerCount;

  if (availableSlots <= 0) return prevGame;

  const actualBotCount = Math.min(botCount, availableSlots);
  const bots = generateBots(actualBotCount);
  const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === prevGame.settings.raceType);
  const newPlayers: Record<string, RacingPlayer> = { ...prevGame.players };
  const existingBotCount = Object.values(prevGame.players).filter(p => p.isBot).length;

  // Get team IDs for assigning bots
  const teamIds = prevGame.teams ? Object.keys(prevGame.teams) : [];
  const updatedTeams = prevGame.teams ? { ...prevGame.teams } : undefined;

  bots.forEach((bot, index) => {
    const botId = `bot-${generateId()}`;
    const botVehicle = vehiclesForType[(existingBotCount + index) % vehiclesForType.length];

    // Assign bot to team (round-robin)
    const botTeamId = teamIds.length > 0 ? teamIds[(existingBotCount + index) % teamIds.length] : undefined;

    newPlayers[botId] = {
      odinhId: botId,
      displayName: bot.name,
      avatar: bot.avatar,
      vehicle: botVehicle,
      currentSpeed: botVehicle.baseSpeed,
      distance: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
      activeFeatures: [],
      hasShield: false,
      isFrozen: false,
      isFinished: false,
      totalPoints: 0,
      isBot: true,
      trapEffects: [],
      inventory: [],
      teamId: botTeamId,
    };

    // Add bot to team
    if (updatedTeams && botTeamId) {
      updatedTeams[botTeamId] = {
        ...updatedTeams[botTeamId],
        members: [...updatedTeams[botTeamId].members, botId],
      };
    }
  });

  return { ...prevGame, players: newPlayers, teams: updatedTeams };
}
