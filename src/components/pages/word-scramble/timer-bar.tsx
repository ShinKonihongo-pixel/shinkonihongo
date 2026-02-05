import React from 'react';
import { Clock } from 'lucide-react';

interface TimerBarProps {
  timeRemaining: number;
  timePerQuestion: number;
}

export const TimerBar: React.FC<TimerBarProps> = ({ timeRemaining, timePerQuestion }) => {
  const timerPercent = (timeRemaining / timePerQuestion) * 100;
  const timerColor = timerPercent > 50 ? '#10B981' : timerPercent > 25 ? '#F59E0B' : '#EF4444';

  return (
    <div className="ws-timer-container">
      <div className="ws-timer-bar">
        <div
          className="ws-timer-fill"
          style={{ width: `${timerPercent}%`, background: timerColor }}
        />
      </div>
      <div className="ws-timer-label" style={{ color: timerColor }}>
        <Clock size={14} />
        <span>{timeRemaining}s</span>
      </div>
    </div>
  );
};
