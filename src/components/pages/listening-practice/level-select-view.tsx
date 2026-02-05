// Level Select View - Main level selection screen
import { Upload } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import { JLPTLevelSelector } from '../../ui/jlpt-level-selector';

interface LevelSelectViewProps {
  countByLevel: Record<JLPTLevel, number>;
  onSelectLevel: (level: JLPTLevel) => void;
  onCustomAudio: () => void;
}

export function LevelSelectView({
  countByLevel,
  onSelectLevel,
  onCustomAudio,
}: LevelSelectViewProps) {
  return (
    <div className="listening-level-select-wrapper">
      <JLPTLevelSelector
        title="Nghe Hiểu"
        subtitle="Chọn cấp độ JLPT để bắt đầu"
        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>}
        countByLevel={countByLevel}
        countLabel="từ"
        onSelectLevel={onSelectLevel}
      />
      <div className="level-select-custom-audio">
        <button className="btn btn-glass" onClick={onCustomAudio}>
          <Upload size={18} />
          Luyện nghe file audio
        </button>
      </div>
    </div>
  );
}
