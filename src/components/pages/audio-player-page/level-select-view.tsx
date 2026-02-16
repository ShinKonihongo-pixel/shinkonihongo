// Level Select View - JLPT level selection for audio practice

import { Headphones } from 'lucide-react';
import { JLPTLevelSelector } from '../../ui/jlpt-level-selector';
import type { JLPTLevel } from '../../../types/flashcard';

interface LevelSelectViewProps {
  countByLevel: Record<JLPTLevel, number>;
  onSelectLevel: (level: JLPTLevel) => void;
}

export function LevelSelectView({ countByLevel, onSelectLevel }: LevelSelectViewProps) {
  return (
    <JLPTLevelSelector
      title="Nghe Hiểu"
      subtitle="Chọn cấp độ JLPT để luyện nghe"
      icon={<Headphones size={32} />}
      countByLevel={countByLevel}
      countLabel="file"
      onSelectLevel={onSelectLevel}
    />
  );
}
