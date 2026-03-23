# Achievement System + Daily Missions

## Overview
Add gamification layer: persistent achievements (Firestore) and ephemeral daily missions (localStorage). Drives engagement via progress tracking, toast celebrations, and a mission widget on home page.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Data types & definitions | TODO | [phase-01](./phase-01-data-types-definitions.md) |
| 2 | Hooks, Firestore service, context | TODO | [phase-02](./phase-02-hooks-firestore-service.md) |
| 3 | UI components (toast, showcase, widget, celebration) | TODO | [phase-03](./phase-03-ui-components.md) |
| 4 | Integration into existing app | TODO | [phase-04](./phase-04-integration.md) |

## Architecture Summary

### New Files
- `src/types/achievements.ts` -- types
- `src/data/achievement-definitions.ts` -- static catalog (~20 achievements)
- `src/data/mission-templates.ts` -- pool of 8 mission templates
- `src/services/firestore/achievement-service.ts` -- Firestore CRUD
- `src/hooks/use-achievements.ts` -- achievement state + check logic
- `src/hooks/use-daily-missions.ts` -- daily mission generation + progress
- `src/contexts/achievement-context.tsx` -- provider exposing all achievement/mission state
- `src/components/achievements/achievement-toast.tsx` + `.css`
- `src/components/achievements/achievement-showcase.tsx` + `.css`
- `src/components/achievements/daily-missions-widget.tsx` + `.css`
- `src/components/achievements/celebration-overlay.tsx` + `.css`

### Modified Files
- `src/services/firestore/collections.ts` -- add `USER_ACHIEVEMENTS` collection
- `src/App.tsx` -- wrap with AchievementProvider, render global toast + overlay
- `src/components/pages/home-page.tsx` -- add DailyMissionsWidget
- `src/components/layout/sidebar.tsx` -- add mission progress badge
- `src/contexts/user-data-context.tsx` -- call achievement checks after session writes

### Data Flow
1. User action (study/game/jlpt) -> `user-data-context` writes session -> calls `achievement-context.check()`
2. Achievement context evaluates thresholds -> unlocks if met -> queues toast
3. Mission context tracks daily progress -> completion triggers celebration
4. Toast/overlay components consume queue from context, render + auto-dismiss

### Key Decisions
- Achievements in Firestore (cross-device persistence)
- Missions in localStorage (ephemeral, daily reset, follows `use-daily-words` pattern)
- Event-driven checks (not polling)
- Seeded random for mission generation (deterministic per date+userId)
- CSS prefix convention: `ach-`, `dm-`, `cel-`
- Dark glassmorphism theme consistent with existing app
