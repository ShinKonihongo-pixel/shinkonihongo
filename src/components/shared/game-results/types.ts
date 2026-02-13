// Shared types for game results components

export interface BaseRankedPlayer {
  id: string;           // odinhId in most games, id in quiz-game
  displayName: string;
  avatar: string;
  rank: number;
  score: number;
  isWinner?: boolean;
}
