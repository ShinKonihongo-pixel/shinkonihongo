// Root view showing JLPT level grid
import { Headphones, Sparkles } from 'lucide-react';
import { LevelGrid } from '../level-grid';
import type { JLPTLevel } from '../../../types/flashcard';

interface ListeningRootViewProps {
  onSelectLevel: (level: JLPTLevel) => void;
  getCountByLevel: (level: JLPTLevel) => number;
  audioRef: React.RefObject<HTMLAudioElement>;
  onAudioEnded: () => void;
  sharedStyles: string;
}

export function ListeningRootView({
  onSelectLevel,
  getCountByLevel,
  audioRef,
  onAudioEnded,
  sharedStyles,
}: ListeningRootViewProps) {
  return (
    <div className="listening-tab">
      <div className="premium-header">
        <div className="header-content">
          <div className="header-icon">
            <Headphones size={24} />
            <Sparkles className="sparkle sparkle-1" size={10} />
            <Sparkles className="sparkle sparkle-2" size={8} />
          </div>
          <div className="header-text">
            <h3>Quản lí Nghe Hiểu</h3>
            <p>Chọn cấp độ để quản lí nội dung luyện nghe</p>
          </div>
        </div>
      </div>

      <LevelGrid
        onSelectLevel={onSelectLevel}
        getCount={getCountByLevel}
        countLabel="file"
      />

      <audio ref={audioRef} onEnded={onAudioEnded} />
      <style>{sharedStyles}</style>
    </div>
  );
}
