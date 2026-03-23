// Achievement unlock toast — slide-in notification

import { useEffect, useState } from 'react';
import type { AchievementToastItem } from '../../types/achievements';
import { TIER_LABELS } from '../../data/achievement-definitions';
import './achievement-toast.css';

interface AchievementToastProps {
  toast: AchievementToastItem | null;
  onDismiss: () => void;
}

export function AchievementToast({ toast, onDismiss }: AchievementToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setExiting(false);
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const Icon = toast.icon;
  const tierLabel = TIER_LABELS[toast.tier] || toast.tier;

  return (
    <div
      className={`ach-toast ${exiting ? 'ach-toast-exit' : ''}`}
      onClick={() => { setExiting(true); setTimeout(onDismiss, 300); }}
    >
      <div className={`ach-toast-icon ${toast.tier}`}>
        <Icon size={22} />
      </div>
      <div className="ach-toast-info">
        <div className="ach-toast-label">Thành tựu mới!</div>
        <div className="ach-toast-name">{toast.nameVi}</div>
        <div className={`ach-toast-tier ${toast.tier}`}>{tierLabel}</div>
      </div>
      <div className="ach-toast-xp">+{toast.xpReward} XP</div>
    </div>
  );
}
