// Generic type constraints for shared game hooks
// All multiplayer games must satisfy these base shapes

export interface BaseGame {
  id: string;
  code: string;
  hostId: string;
  title: string;
  status: string;
  players: Record<string, BasePlayer>;
  settings: BaseSettings;
  createdAt: string;
}

export interface BasePlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: string;
  score?: number;
  isBot?: boolean;
}

export interface BaseSettings {
  maxPlayers: number;
  minPlayers?: number;
}

export interface GameUser {
  id: string;
  displayName: string;
  avatar: string;
  role?: string;
}

/** State updater type — matches React's useState setter pattern */
export type SetGame<TGame> = (
  updater: ((prev: TGame | null) => TGame | null) | TGame | null
) => void;
