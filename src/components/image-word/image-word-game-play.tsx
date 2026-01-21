// Image-Word Game Play Component
// Main game UI with split layout for images and words

import React, { useMemo } from 'react';
import { ArrowLeft, Clock, Target, AlertCircle } from 'lucide-react';
import type { ImageWordGameState, ImageWordPair } from '../../types/image-word';

interface ImageWordGamePlayProps {
  gameState: ImageWordGameState;
  wrongAnimation: { imageId: string; wordId: string } | null;
  onSelectImage: (pairId: string) => void;
  onSelectWord: (pairId: string) => void;
  onBack: () => void;
}

// Helper to format time
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get visual state for a pair item
function getVisualState(
  pair: ImageWordPair,
  selectedId: string | null,
  matchedPairs: string[],
  wrongAnimation: { imageId: string; wordId: string } | null,
  type: 'image' | 'word'
): string {
  const wrongId = type === 'image' ? wrongAnimation?.imageId : wrongAnimation?.wordId;

  if (matchedPairs.includes(pair.id)) return 'matched';
  if (wrongAnimation && pair.id === wrongId) return 'wrong';
  if (selectedId === pair.id) return 'selected';
  return 'default';
}

export const ImageWordGamePlay: React.FC<ImageWordGamePlayProps> = ({
  gameState,
  wrongAnimation,
  onSelectImage,
  onSelectWord,
  onBack,
}) => {
  const {
    lesson,
    shuffledImages,
    shuffledWords,
    selectedImage,
    selectedWord,
    matchedPairs,
    wrongAttempts,
    startTime,
  } = gameState;

  // Calculate elapsed time
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Progress percentage
  const progress = useMemo(() => {
    return Math.round((matchedPairs.length / lesson.pairs.length) * 100);
  }, [matchedPairs.length, lesson.pairs.length]);

  return (
    <div className="image-word-game-play">
      {/* Header */}
      <div className="game-play-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2>{lesson.name}</h2>
        <div className="game-stats">
          <span className="stat">
            <Clock size={16} />
            {formatTime(elapsedTime)}
          </span>
          <span className="stat">
            <Target size={16} />
            {matchedPairs.length}/{lesson.pairs.length}
          </span>
          {wrongAttempts > 0 && (
            <span className="stat wrong">
              <AlertCircle size={16} />
              {wrongAttempts}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="game-progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Game area with split layout */}
      <div className="game-area">
        {/* Images column */}
        <div className="items-column images-column">
          <h3 className="column-title">Hình Ảnh</h3>
          <div className="items-grid">
            {shuffledImages.map(pair => {
              const state = getVisualState(pair, selectedImage, matchedPairs, wrongAnimation, 'image');
              return (
                <button
                  key={`img-${pair.id}`}
                  className={`item-card image-card ${state}`}
                  onClick={() => onSelectImage(pair.id)}
                  disabled={matchedPairs.includes(pair.id)}
                >
                  <img src={pair.imageUrl} alt="" />
                  {state === 'matched' && <span className="match-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Connector line visual */}
        <div className="connector-area">
          <div className="connector-line" />
        </div>

        {/* Words column */}
        <div className="items-column words-column">
          <h3 className="column-title">Từ Vựng</h3>
          <div className="items-grid">
            {shuffledWords.map(pair => {
              const state = getVisualState(pair, selectedWord, matchedPairs, wrongAnimation, 'word');
              return (
                <button
                  key={`word-${pair.id}`}
                  className={`item-card word-card ${state}`}
                  onClick={() => onSelectWord(pair.id)}
                  disabled={matchedPairs.includes(pair.id)}
                >
                  <span className="vocabulary">{pair.vocabulary}</span>
                  {pair.reading && <span className="reading">{pair.reading}</span>}
                  <span className="meaning">{pair.meaning}</span>
                  {state === 'matched' && <span className="match-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Instruction hint */}
      <div className="game-hint">
        {selectedImage && !selectedWord && (
          <span>Chọn từ tương ứng với hình ảnh</span>
        )}
        {selectedWord && !selectedImage && (
          <span>Chọn hình ảnh tương ứng với từ</span>
        )}
        {!selectedImage && !selectedWord && (
          <span>Chọn một hình ảnh hoặc từ để bắt đầu nối</span>
        )}
      </div>
    </div>
  );
};
