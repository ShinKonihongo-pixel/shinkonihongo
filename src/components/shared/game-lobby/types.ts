// Base types for game lobby components
// Provides generic interfaces that work across all game player types

export interface BaseLobbyPlayer {
  id: string;
  displayName: string;
  avatar: string;
  isHost?: boolean;
  isBot?: boolean;
  role?: string; // for VIP styling
}

// Helper to normalize different game player formats to BaseLobbyPlayer
export function normalizePlayer(player: any): BaseLobbyPlayer {
  return {
    id: player.odinhId || player.id,
    displayName: player.displayName || player.name,
    avatar: player.avatar || '',
    isHost: player.isHost,
    isBot: player.isBot,
    role: player.role,
  };
}
