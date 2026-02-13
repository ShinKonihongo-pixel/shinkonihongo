// Mic mode selector dropdown component
// Extracted from kaiwa-page.tsx

import { useState } from 'react';
import { Zap, BookOpen, ChevronDown } from 'lucide-react';
import type { MicMode } from '../../kaiwa/kaiwa-input-area';

// Mic mode options for the dropdown
const MIC_MODES: { id: MicMode; label: string; labelJa: string; icon: typeof Zap }[] = [
  { id: 'immediate', label: 'Trả lời ngay', labelJa: '即答', icon: Zap },
  { id: 'reading-practice', label: 'Luyện đọc', labelJa: '読み練習', icon: BookOpen },
];

interface MicModeSelectorProps {
  micMode: MicMode;
  onMicModeChange: (mode: MicMode) => void;
}

export function MicModeSelector({ micMode, onMicModeChange }: MicModeSelectorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const currentMode = MIC_MODES.find(m => m.id === micMode) || MIC_MODES[0];

  return (
    <div className="mic-mode-selector">
      <button
        className="mic-mode-btn"
        onClick={() => setShowMenu(!showMenu)}
        title={currentMode.label}
      >
        <currentMode.icon size={14} />
        <ChevronDown size={12} className={showMenu ? 'rotated' : ''} />
      </button>

      {showMenu && (
        <div className="mic-mode-menu">
          {MIC_MODES.map(mode => (
            <button
              key={mode.id}
              className={`mic-mode-option ${micMode === mode.id ? 'active' : ''}`}
              onClick={() => {
                onMicModeChange(mode.id);
                setShowMenu(false);
              }}
            >
              <mode.icon size={16} />
              <span className="mode-label">{mode.label}</span>
              <span className="mode-label-ja">{mode.labelJa}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
