import './level-badge.css';

interface LevelBadgeProps {
  level: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function LevelBadge({ level, size = 'sm', className }: LevelBadgeProps) {
  return (
    <span className={`lb-badge lb-badge--${size} lb-level--${level.toLowerCase()}${className ? ` ${className}` : ''}`}>
      {level}
    </span>
  );
}
