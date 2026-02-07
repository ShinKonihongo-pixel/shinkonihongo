import { BookOpen, Layers, Sparkles } from 'lucide-react';
import type { JLPTLevel } from './types';
import { JLPT_LEVELS } from './constants';
import { LevelCard } from './level-card';

interface LevelSelectorProps {
  type: 'vocabulary' | 'grammar' | 'kanji';
  countByLevel: Record<string, number>;
  hoveredLevel: JLPTLevel | null;
  onHover: (level: JLPTLevel | null) => void;
  onSelect: (level: JLPTLevel) => void;
  levels?: JLPTLevel[];
}

export function LevelSelector({
  type,
  countByLevel,
  hoveredLevel,
  onHover,
  onSelect,
  levels,
}: LevelSelectorProps) {
  const displayLevels = levels ?? JLPT_LEVELS;
  const is6Items = displayLevels.length === 6;
  return (
    <div className="selector-container">
      {/* Premium Header */}
      <header className="premium-header">
        <div className="header-main">
          <div className="header-icon-wrapper">
            <div className="header-icon">
              {type === 'vocabulary' ? <Layers size={32} /> : <BookOpen size={32} />}
            </div>
            <Sparkles className="sparkle-effect sparkle-1" size={16} />
            <Sparkles className="sparkle-effect sparkle-2" size={12} />
          </div>
          <h1 className="header-title">
            {type === 'vocabulary' ? 'Học Từ Vựng' : type === 'grammar' ? 'Học Ngữ Pháp' : 'Học Hán Tự'}
          </h1>
          <p className="header-subtitle">Chọn cấp độ để bắt đầu</p>
        </div>
      </header>

      {/* Level Cards Grid */}
      <div className={`levels-grid ${is6Items ? 'levels-grid-6' : ''}`}>
        {displayLevels.map((level, index) => (
          <LevelCard
            key={level}
            level={level}
            count={countByLevel[level]}
            type={type}
            index={index}
            isHovered={hoveredLevel === level}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
