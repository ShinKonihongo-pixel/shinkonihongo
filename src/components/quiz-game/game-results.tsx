// Game results component - shows final rankings

import type { QuizGame, GameResults as GameResultsType } from '../../types/quiz-game';
import { isImageAvatar } from '../../utils/avatar-icons';
import { Podium, RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

interface GameResultsProps {
  game: QuizGame;
  gameResults: GameResultsType | null;
  currentPlayerId: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameResults({
  game,
  currentPlayerId,
  onPlayAgain,
  onGoHome,
}: GameResultsProps) {
  // Use game.players if results not yet loaded
  const players = Object.values(game.players).sort((a, b) => b.score - a.score);
  const myRank = players.findIndex(p => p.id === currentPlayerId) + 1;
  const myPlayer = players.find(p => p.id === currentPlayerId);

  // Map to BaseRankedPlayer (note: quiz-game uses id/name, not odinhId/displayName)
  const rankedPlayers: BaseRankedPlayer[] = players.map((player, idx) => ({
    id: player.id,
    displayName: player.name,
    avatar: player.avatar,
    rank: idx + 1,
    score: player.score,
    isWinner: idx === 0,
  }));

  return (
    <div className="quiz-game-page">
      <div className="game-results">
        <div className="results-header">
          <h2>Kết thúc!</h2>
          <p className="game-title">{game.title}</p>
        </div>

        <div className="winner-section">
          {players[0] && (
            <div className="winner-card">
              <span className="trophy">🏆</span>
              <span className="winner-name">{players[0].name}</span>
              <span className="winner-score">{players[0].score} điểm</span>
            </div>
          )}
        </div>

        <Podium
          players={rankedPlayers}
          renderPlayerExtra={(player) => <span>{player.score}</span>}
          showCrown={false}
        />

        {myRank > 3 && myPlayer && (
          <div className="my-result">
            <p>Bạn đứng hạng {myRank} với {myPlayer.score} điểm</p>
          </div>
        )}

        <RankingsTable
          rankings={rankedPlayers}
          currentPlayerId={currentPlayerId}
          title="Bảng xếp hạng đầy đủ"
          className="full-rankings"
          columns={[
            {
              key: 'streak',
              label: 'Streak',
              render: (player) => {
                const originalPlayer = players.find(p => p.id === player.id);
                return originalPlayer && originalPlayer.streak >= 3 ? (
                  <span className="streak">🔥 {originalPlayer.streak}</span>
                ) : null;
              },
            },
          ]}
        />

        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Tổng câu hỏi</span>
            <span className="stat-value">{game.totalRounds}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Số người chơi</span>
            <span className="stat-value">{players.length}</span>
          </div>
        </div>

        <ResultsActionBar
          onPlayAgain={onPlayAgain}
          onGoHome={onGoHome}
          playAgainLabel="Chơi lại"
          goHomeLabel="Về trang chủ"
          playAgainIcon={null}
          goHomeIcon={null}
        />
      </div>
    </div>
  );
}
