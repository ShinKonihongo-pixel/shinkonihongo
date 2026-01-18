// Race Countdown - Professional countdown animation before race starts
// Supports themed backgrounds for different race types

import { useState, useEffect } from 'react';
import type { VehicleType } from '../../../types/racing-game';

interface RaceCountdownProps {
  raceType: VehicleType;
  onComplete: () => void;
  duration?: number;
}

const RACE_THEMES = {
  boat: {
    icon: '🚣',
    title: 'Cuộc Đua Thuyền',
    subtitle: 'Vượt sóng chinh phục kiến thức!',
    gradient: 'linear-gradient(180deg, #1a4a6e 0%, #2d7d9a 50%, #4ecdc4 100%)',
    countdownColors: ['#ff6b6b', '#ffd93d', '#4ecdc4'],
    waveEmojis: ['🌊', '💧', '🐟', '🐬', '🦈'],
  },
  horse: {
    icon: '🏇',
    title: 'Cuộc Chạy Đua',
    subtitle: 'Phi nước đại cùng kiến thức!',
    gradient: 'linear-gradient(180deg, #2d5016 0%, #4a7c23 50%, #7cb342 100%)',
    countdownColors: ['#ff6b6b', '#ffd93d', '#7cb342'],
    waveEmojis: ['🌾', '🍃', '🌻', '🦋', '🐎'],
  },
};

export function RaceCountdown({ raceType, onComplete, duration = 3 }: RaceCountdownProps) {
  const [count, setCount] = useState(duration);
  const [phase, setPhase] = useState<'counting' | 'go'>('counting');
  const theme = RACE_THEMES[raceType];

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0 && phase === 'counting') {
      setPhase('go');
      setTimeout(onComplete, 800);
    }
  }, [count, phase, onComplete]);

  return (
    <div className="race-countdown" style={{ background: theme.gradient }}>
      {/* Animated background elements */}
      <div className="countdown-bg-elements">
        {theme.waveEmojis.map((emoji, i) => (
          <span
            key={i}
            className="bg-element"
            style={{
              left: `${10 + i * 20}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="countdown-content">
        <div className="countdown-icon-large">{theme.icon}</div>
        <h1 className="countdown-title">{theme.title}</h1>
        <p className="countdown-subtitle">{theme.subtitle}</p>

        <div className="countdown-circle">
          {phase === 'counting' ? (
            <>
              <div
                className="countdown-number"
                style={{ color: theme.countdownColors[3 - count] || '#fff' }}
              >
                {count}
              </div>
              <svg className="countdown-ring" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={theme.countdownColors[3 - count] || '#fff'}
                  strokeWidth="6"
                  strokeDasharray="283"
                  strokeDashoffset={283 * (1 - (duration - count + 1) / (duration + 1))}
                  strokeLinecap="round"
                  className="countdown-progress"
                />
              </svg>
            </>
          ) : (
            <div className="countdown-go">GO!</div>
          )}
        </div>

        <p className="countdown-tip">
          {raceType === 'boat'
            ? '💡 Trả lời nhanh và chính xác để tăng tốc thuyền!'
            : '💡 Trả lời đúng để ngựa phi nước đại!'}
        </p>
      </div>
    </div>
  );
}
