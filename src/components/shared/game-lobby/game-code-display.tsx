// Game Code Display - Reusable component for showing game code with copy/share
// Extracted from common pattern across all game lobbies

import { Copy, Check, Share2 } from 'lucide-react';

interface GameCodeDisplayProps {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onShare?: () => void;
  label?: string;
  className?: string;
}

export function GameCodeDisplay({
  code,
  copied,
  onCopy,
  onShare,
  label = 'Mã Phòng',
  className = '',
}: GameCodeDisplayProps) {
  return (
    <div className={`lobby-code-section ${className}`}>
      <span className="code-label">{label}</span>
      <div className="code-display">
        <span className="code-value">{code}</span>
        <button className="copy-btn" onClick={onCopy}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      {onShare && (
        <button className="share-btn" onClick={onShare}>
          <Share2 size={16} />
          Chia sẻ link
        </button>
      )}
    </div>
  );
}
