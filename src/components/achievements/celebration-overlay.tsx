// Celebration overlay — CSS confetti for major milestones

import { useEffect } from 'react';
import type { CelebrationReason } from '../../types/achievements';
import './celebration-overlay.css';

interface CelebrationOverlayProps {
  reason: CelebrationReason | null;
  onDismiss: () => void;
}

const CELEBRATION_CONFIG: Record<CelebrationReason, { emoji: string; title: string; subtitle: string }> = {
  all_missions: {
    emoji: '🎯',
    title: 'Hoàn thành xuất sắc!',
    subtitle: 'Bạn đã hoàn thành tất cả nhiệm vụ hôm nay!',
  },
  gold_achievement: {
    emoji: '🏆',
    title: 'Thành tựu Vàng!',
    subtitle: 'Bạn đã đạt cấp cao nhất!',
  },
  level_up: {
    emoji: '⬆️',
    title: 'Lên cấp!',
    subtitle: 'Tiếp tục phát huy nhé!',
  },
};

const PARTICLE_COUNT = 20;

export function CelebrationOverlay({ reason, onDismiss }: CelebrationOverlayProps) {
  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    if (!reason) return;
    const timer = setTimeout(onDismiss, 3500);
    return () => clearTimeout(timer);
  }, [reason, onDismiss]);

  if (!reason) return null;

  const config = CELEBRATION_CONFIG[reason];

  return (
    <div className="cel-overlay" onClick={onDismiss}>
      <div className="cel-particles">
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <div key={i} className="cel-particle" />
        ))}
      </div>
      <div className="cel-content">
        <div className="cel-icon">{config.emoji}</div>
        <h2 className="cel-title">{config.title}</h2>
        <p className="cel-subtitle">{config.subtitle}</p>
        <span className="cel-dismiss">Chạm để đóng</span>
      </div>
    </div>
  );
}
