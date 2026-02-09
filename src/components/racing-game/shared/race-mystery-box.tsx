/* eslint-disable react-hooks/purity */
// Race Mystery Box - Animated mystery box reward reveal
// Professional animations and themed styling

import { useState, useMemo } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import type { RacingQuestion, VehicleType, SpecialFeatureType } from '../../../types/racing-game';
import { SPECIAL_FEATURES } from '../../../types/racing-game';

interface RaceMysteryBoxProps {
  question: RacingQuestion;
  raceType: VehicleType;
  onOpenBox: () => void;
  onApplyFeature: (type: SpecialFeatureType) => void;
}

export function RaceMysteryBox({
  question,
  raceType,
  onOpenBox,
  onApplyFeature,
}: RaceMysteryBoxProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const reward = question.mysteryBox?.reward;
  const feature = reward ? SPECIAL_FEATURES[reward] : null;
  const difficulty = question.mysteryBox?.difficulty;

  const handleOpen = () => {
    if (isOpening || isRevealed) return;

    setIsOpening(true);

    // Opening animation
    setTimeout(() => {
      setIsRevealed(true);
      if (reward) {
        onApplyFeature(reward);
      }
    }, 1200);

    // Complete after reveal animation
    setTimeout(() => {
      onOpenBox();
    }, 3000);
  };

  const difficultyLabel = {
    easy: { text: 'Dễ', color: '#4ecdc4', stars: 1 },
    medium: { text: 'Trung bình', color: '#ffd93d', stars: 2 },
    hard: { text: 'Khó', color: '#ff6b6b', stars: 3 },
  }[difficulty || 'easy'];

  // Pre-compute particles once
  const particles = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      delay: Math.random() * 0.1,
      x: Math.random() * 100,
      y: Math.random() * 100,
    })), []);

  return (
    <div className={`pro-mystery-box ${raceType} ${isOpening ? 'opening' : ''} ${isRevealed ? 'revealed' : ''}`}>
      {/* Background particles */}
      <div className="mystery-particles">
        {particles.map((p, i) => (
          <span key={i} className="particle" style={{
            '--delay': `${p.delay}s`,
            '--x': `${p.x}%`,
            '--y': `${p.y}%`,
          } as React.CSSProperties} />
        ))}
      </div>

      <div className="mystery-content">
        {!isRevealed ? (
          <>
            {/* Mystery Box Icon */}
            <div className={`mystery-box-icon ${isOpening ? 'shake' : ''}`}>
              <Gift size={80} />
              <Sparkles className="sparkle top-left" size={24} />
              <Sparkles className="sparkle top-right" size={24} />
              <Sparkles className="sparkle bottom" size={24} />
            </div>

            <h1 className="mystery-title">Hộp Bí Ẩn!</h1>

            <div className="mystery-difficulty" style={{ color: difficultyLabel.color }}>
              {'⭐'.repeat(difficultyLabel.stars)}
              <span>{difficultyLabel.text}</span>
            </div>

            <p className="mystery-hint">
              {raceType === 'boat'
                ? 'Mở hộp để nhận vật phẩm hỗ trợ vượt sóng!'
                : 'Mở hộp để nhận vật phẩm tăng tốc phi nước đại!'}
            </p>

            <button
              className="open-box-btn"
              onClick={handleOpen}
              disabled={isOpening}
            >
              {isOpening ? (
                <>
                  <div className="btn-spinner" />
                  Đang mở...
                </>
              ) : (
                <>
                  <Gift size={24} />
                  Mở Hộp Bí Ẩn
                </>
              )}
            </button>
          </>
        ) : (
          <div className="reward-reveal">
            <div className="reward-glow" />

            <div className="reward-icon">
              <span className="reward-emoji">{feature?.emoji}</span>
            </div>

            <h2 className="reward-name">{feature?.name}</h2>
            <p className="reward-description">{feature?.description}</p>

            <div className="reward-stats">
              <span className="stat">
                <span className="label">Hiệu lực:</span>
                <span className="value">{feature?.duration} lượt</span>
              </span>
            </div>

            <div className="reward-applied">
              <Sparkles size={16} />
              Đã áp dụng!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
