// Achievement system global overlays — toast, celebration, showcase
// Extracted from AppContent to keep AppChrome under 200 LOC

import { lazy, Suspense } from 'react';
import type { useAchievementContextOptional } from '../../contexts/achievement-context';

const AchievementToast = lazy(() => import('../achievements/achievement-toast').then(m => ({ default: m.AchievementToast })));
const AchievementShowcase = lazy(() => import('../achievements/achievement-showcase').then(m => ({ default: m.AchievementShowcase })));
const CelebrationOverlay = lazy(() => import('../achievements/celebration-overlay').then(m => ({ default: m.CelebrationOverlay })));

type AchievementCtx = NonNullable<ReturnType<typeof useAchievementContextOptional>>;

export function AchievementOverlays({ ctx }: { ctx: AchievementCtx | null }) {
  if (!ctx) return null;

  return (
    <Suspense fallback={null}>
      <AchievementToast toast={ctx.pendingToast} onDismiss={ctx.dismissToast} />
      <CelebrationOverlay reason={ctx.celebration} onDismiss={ctx.dismissCelebration} />
      <AchievementShowcase
        achievements={ctx.achievements}
        isOpen={ctx.showShowcase}
        onClose={ctx.closeShowcase}
      />
    </Suspense>
  );
}
