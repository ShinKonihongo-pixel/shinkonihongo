// Inline Settings Component - Collapsible settings panel
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface InlineSettingsProps {
  isOpen: boolean;
  playbackSpeed: number;
  repeatCount: number;
  delayBetweenWords: number;
  autoPlayNext: boolean;
  readMeaning: boolean;
  onToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onRepeatChange: (count: number) => void;
  onDelayChange: (delay: number) => void;
  onAutoPlayChange: (value: boolean) => void;
  onReadMeaningChange: (value: boolean) => void;
}

export function InlineSettings({
  isOpen,
  playbackSpeed,
  repeatCount,
  delayBetweenWords,
  autoPlayNext,
  readMeaning,
  onToggle,
  onSpeedChange,
  onRepeatChange,
  onDelayChange,
  onAutoPlayChange,
  onReadMeaningChange,
}: InlineSettingsProps) {
  return (
    <div className="inline-settings-wrapper">
      <button className="settings-toggle-btn" onClick={onToggle}>
        <Settings size={16} />
        <span>Thiết lập</span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="inline-settings">
          <div className="settings-row numeric-settings">
            <div className="setting-group">
              <label>Tốc độ</label>
              <div className="setting-control">
                <button onClick={() => onSpeedChange(Math.max(0.5, playbackSpeed - 0.25))}>
                  -
                </button>
                <span>{playbackSpeed}x</span>
                <button onClick={() => onSpeedChange(Math.min(2, playbackSpeed + 0.25))}>
                  +
                </button>
              </div>
            </div>
            <div className="setting-group">
              <label>Lặp lại</label>
              <div className="setting-control">
                <button onClick={() => onRepeatChange(Math.max(1, repeatCount - 1))}>-</button>
                <span>{repeatCount} lần</span>
                <button onClick={() => onRepeatChange(Math.min(3, repeatCount + 1))}>+</button>
              </div>
            </div>
            <div className="setting-group">
              <label>Giãn cách</label>
              <div className="setting-control">
                <button onClick={() => onDelayChange(Math.max(0.25, delayBetweenWords - 0.25))}>
                  -
                </button>
                <span>{delayBetweenWords}s</span>
                <button onClick={() => onDelayChange(Math.min(2, delayBetweenWords + 0.25))}>
                  +
                </button>
              </div>
            </div>
          </div>
          <div className="settings-row checkbox-settings">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoPlayNext}
                onChange={(e) => onAutoPlayChange(e.target.checked)}
              />
              <span>Tự động chuyển</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={readMeaning}
                onChange={(e) => onReadMeaningChange(e.target.checked)}
              />
              <span>Đọc nghĩa</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
