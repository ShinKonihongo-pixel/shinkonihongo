// Achievement showcase modal — displays all achievements with progress

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import type { UserAchievementProgress, AchievementCategory } from '../../types/achievements';
import { ACHIEVEMENT_DEFINITIONS, TIER_LABELS } from '../../data/achievement-definitions';
import './achievement-showcase.css';

interface AchievementShowcaseProps {
  achievements: Record<string, UserAchievementProgress>;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Array<{ key: AchievementCategory | 'all'; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'learning', label: 'Học tập' },
  { key: 'streak', label: 'Streak' },
  { key: 'games', label: 'Game' },
  { key: 'social', label: 'Xã hội' },
  { key: 'mastery', label: 'JLPT' },
  { key: 'special', label: 'Đặc biệt' },
];

export function AchievementShowcase({ achievements, isOpen, onClose }: AchievementShowcaseProps) {
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return ACHIEVEMENT_DEFINITIONS;
    return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === filter);
  }, [filter]);

  if (!isOpen) return null;

  return (
    <div className="ach-showcase-overlay" onClick={onClose}>
      <div className="ach-showcase-modal" onClick={e => e.stopPropagation()}>
        <div className="ach-showcase-header">
          <h2 className="ach-showcase-title">Thành Tựu</h2>
          <button className="ach-showcase-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ach-showcase-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              className={`ach-filter-btn ${filter === cat.key ? 'active' : ''}`}
              onClick={() => setFilter(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="ach-showcase-grid">
          {filtered.map(def => {
            const progress = achievements[def.id];
            const currentValue = progress?.currentValue ?? 0;
            const unlockedTiers = progress?.unlockedTiers ?? [];
            const highestTier = unlockedTiers.includes('gold') ? 'gold'
              : unlockedTiers.includes('silver') ? 'silver'
              : unlockedTiers.includes('bronze') ? 'bronze'
              : 'locked';

            // Next tier to work toward
            const nextTier = def.tiers.find(t => !unlockedTiers.includes(t.tier));
            const nextThreshold = nextTier?.threshold ?? def.tiers[def.tiers.length - 1].threshold;
            const progressPercent = Math.min((currentValue / nextThreshold) * 100, 100);

            const Icon = def.icon;
            const isGold = highestTier === 'gold';

            return (
              <div
                key={def.id}
                className={`ach-card ${highestTier === 'locked' ? 'locked' : 'unlocked'} ${isGold ? 'gold-unlocked' : ''}`}
              >
                <div className={`ach-card-icon ${highestTier}`}>
                  <Icon size={20} />
                </div>
                <div className="ach-card-name">{def.nameVi}</div>
                <div className="ach-card-jp">{def.nameJp}</div>
                <div className="ach-card-progress">
                  <div className="ach-card-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="ach-card-value">
                  {currentValue} / {nextThreshold}
                  {isGold && ' MAX'}
                </div>
                <div className="ach-card-tiers">
                  {def.tiers.map(t => (
                    <div
                      key={t.tier}
                      className={`ach-tier-dot ${unlockedTiers.includes(t.tier) ? `earned ${t.tier}` : ''}`}
                      title={TIER_LABELS[t.tier]}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
