// Picture Guess Results - Final results and vocabulary review
// Shows rankings, statistics, and learned words

import { useState } from 'react';
import { Star, BookOpen, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import type { PictureGuessResults } from '../../types/picture-guess';
import { RankingsTable, ResultsActionBar, type BaseRankedPlayer } from '../shared/game-results';

interface PictureGuessResultsProps {
  results: PictureGuessResults;
  currentUserId: string;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function PictureGuessResultsView({
  results,
  currentUserId,
  onPlayAgain,
  onBackToMenu,
}: PictureGuessResultsProps) {
  const [showVocabulary, setShowVocabulary] = useState(false);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);

  const currentPlayerResult = results.rankings.find(r => r.odinhId === currentUserId);
  const winner = results.rankings[0];
  const isWinner = currentPlayerResult?.rank === 1;

  // Map to BaseRankedPlayer
  const rankedPlayers: BaseRankedPlayer[] = results.rankings.map(player => ({
    id: player.odinhId,
    displayName: player.displayName,
    avatar: player.avatar,
    rank: player.rank,
    score: player.score,
    isWinner: player.rank === 1,
  }));

  return (
    <div className="picture-guess-results">
      {/* Winner Section */}
      <div className={`pg-results-hero ${isWinner ? 'winner' : ''}`}>
        {isWinner ? (
          <>
            <div className="pg-confetti"></div>
            <Trophy className="pg-winner-trophy" size={80} />
            <h1>Chiến Thắng!</h1>
            <p>Bạn là người giỏi nhất!</p>
          </>
        ) : results.mode === 'single' ? (
          <>
            <Star className="pg-star-icon" size={64} />
            <h1>Hoàn Thành!</h1>
            <p>Bạn đã hoàn thành {results.totalPuzzles} câu hỏi</p>
          </>
        ) : (
          <>
            <div className="pg-winner-avatar">{winner.avatar}</div>
            <h1>{winner.displayName}</h1>
            <p>đã giành chiến thắng!</p>
          </>
        )}
      </div>

      {/* Current Player Stats */}
      {currentPlayerResult && (
        <div className="pg-your-stats">
          <h3>Thống kê của bạn</h3>
          <div className="pg-stats-grid">
            <div className="pg-stat-box">
              <span className="stat-value">{currentPlayerResult.score}</span>
              <span className="stat-label">Điểm</span>
            </div>
            <div className="pg-stat-box">
              <span className="stat-value">{currentPlayerResult.correctGuesses}/{results.totalPuzzles}</span>
              <span className="stat-label">Đúng</span>
            </div>
            <div className="pg-stat-box">
              <span className="stat-value">{currentPlayerResult.accuracy}%</span>
              <span className="stat-label">Chính xác</span>
            </div>
            <div className="pg-stat-box">
              <span className="stat-value">{currentPlayerResult.longestStreak}</span>
              <span className="stat-label">Streak</span>
            </div>
          </div>
        </div>
      )}

      {/* Rankings (multiplayer) */}
      {results.mode === 'multiplayer' && (
        <RankingsTable
          rankings={rankedPlayers}
          currentPlayerId={currentUserId}
          className="pg-rankings"
          title="Bảng Xếp Hạng"
          columns={[
            {
              key: 'accuracy',
              label: 'Chính xác',
              render: (player) => {
                const originalPlayer = results.rankings.find(p => p.odinhId === player.id);
                return (
                  <>
                    <span>{originalPlayer?.correctGuesses} đúng</span>
                    <span>{originalPlayer?.accuracy}% chính xác</span>
                  </>
                );
              },
            },
          ]}
        />
      )}

      {/* Vocabulary Review */}
      <div className="pg-vocabulary-review">
        <button
          className="pg-vocab-toggle"
          onClick={() => setShowVocabulary(!showVocabulary)}
        >
          <BookOpen size={20} />
          <span>Từ Vựng Đã Học ({results.wordsLearned.length} từ)</span>
          {showVocabulary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showVocabulary && (
          <div className="pg-vocab-list">
            {results.wordsLearned.map(puzzle => (
              <div
                key={puzzle.id}
                className={`pg-vocab-item ${expandedWord === puzzle.id ? 'expanded' : ''}`}
                onClick={() => setExpandedWord(expandedWord === puzzle.id ? null : puzzle.id)}
              >
                <div className="vocab-main">
                  <span className="vocab-emoji">{puzzle.imageEmojis}</span>
                  <span className="vocab-word">{puzzle.word}</span>
                  <span className="vocab-meaning">{puzzle.meaning}</span>
                </div>
                {expandedWord === puzzle.id && (
                  <div className="vocab-details">
                    {puzzle.reading && puzzle.reading !== puzzle.word && (
                      <div className="detail-row">
                        <span className="detail-label">Đọc:</span>
                        <span className="detail-value">{puzzle.reading}</span>
                      </div>
                    )}
                    {puzzle.sinoVietnamese && (
                      <div className="detail-row">
                        <span className="detail-label">Hán Việt:</span>
                        <span className="detail-value">{puzzle.sinoVietnamese}</span>
                      </div>
                    )}
                    {puzzle.examples && puzzle.examples.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">Ví dụ:</span>
                        <span className="detail-value">{puzzle.examples[0]}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Độ khó:</span>
                      <span className={`detail-value difficulty-${puzzle.difficulty}`}>
                        {puzzle.difficulty === 'easy' ? 'Dễ' : puzzle.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <ResultsActionBar
        onPlayAgain={onPlayAgain}
        onGoHome={onBackToMenu}
        playAgainLabel="Chơi Lại"
        goHomeLabel="Về Menu"
        className="pg-results-actions"
        extraButtons={
          <button className="pg-action-btn share">
            <Share2 size={20} />
            <span>Chia Sẻ</span>
          </button>
        }
      />
    </div>
  );
}
