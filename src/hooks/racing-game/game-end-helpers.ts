// Game ending calculation helpers
import type {
  RacingGame,
  RacingGameResults,
  RacingPlayerResult,
  RacingTeamResult,
} from '../../types/racing-game';

export function calculateGameResults(game: RacingGame): RacingGameResults {
  const rankings: RacingPlayerResult[] = Object.values(game.players)
    .sort((a, b) => {
      if (a.isFinished && !b.isFinished) return -1;
      if (!a.isFinished && b.isFinished) return 1;
      if (a.finishPosition && b.finishPosition) return a.finishPosition - b.finishPosition;
      return b.distance - a.distance;
    })
    .map((p, idx) => ({
      odinhId: p.odinhId,
      displayName: p.displayName,
      avatar: p.avatar,
      vehicle: p.vehicle,
      position: idx + 1,
      distance: p.distance,
      correctAnswers: p.correctAnswers,
      accuracy: p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0,
      averageTime: 0,
      pointsEarned: p.totalPoints,
      featuresUsed: 0,
      trapsTriggered: p.trapEffects?.length || 0,
      trapsPlaced: 0,
      teamId: p.teamId,
    }));

  let teamRankings: RacingTeamResult[] | undefined;
  if (game.settings.gameMode === 'team' && game.teams) {
    teamRankings = Object.values(game.teams)
      .map(team => {
        const teamPlayers = rankings.filter(r => r.teamId === team.id);
        const totalDistance = teamPlayers.reduce((sum, p) => sum + p.distance, 0);
        const totalPoints = teamPlayers.reduce((sum, p) => sum + p.pointsEarned, 0);
        return {
          teamId: team.id,
          teamName: team.name,
          emoji: team.emoji,
          colorKey: team.colorKey,
          totalDistance,
          totalPoints,
          memberCount: teamPlayers.length,
          position: 0,
        };
      })
      .sort((a, b) => b.totalDistance - a.totalDistance)
      .map((t, idx) => ({ ...t, position: idx + 1 }));
  }

  return {
    gameId: game.id,
    rankings,
    totalQuestions: game.questions.length,
    raceType: game.settings.raceType,
    trackLength: game.settings.trackLength,
    gameMode: game.settings.gameMode,
    teamRankings,
  };
}
