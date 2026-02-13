// Shared Results Action Bar - Play again / go home buttons

import { RotateCcw, Home } from 'lucide-react';

interface ResultsActionBarProps {
  onPlayAgain: () => void;
  onGoHome: () => void;
  playAgainLabel?: string;
  goHomeLabel?: string;
  className?: string;
  extraButtons?: React.ReactNode;
  playAgainIcon?: React.ReactNode;
  goHomeIcon?: React.ReactNode;
}

export function ResultsActionBar({
  onPlayAgain,
  onGoHome,
  playAgainLabel = 'Chơi Lại',
  goHomeLabel = 'Về Trang Chủ',
  className = '',
  extraButtons,
  playAgainIcon = <RotateCcw size={20} />,
  goHomeIcon = <Home size={20} />,
}: ResultsActionBarProps) {
  return (
    <div className={`results-actions ${className}`}>
      <button className="play-again-btn" onClick={onPlayAgain}>
        {playAgainIcon}
        {playAgainLabel}
      </button>
      <button className="go-home-btn" onClick={onGoHome}>
        {goHomeIcon}
        {goHomeLabel}
      </button>
      {extraButtons}
    </div>
  );
}
