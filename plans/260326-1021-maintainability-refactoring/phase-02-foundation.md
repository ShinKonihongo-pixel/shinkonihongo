# Phase 2: Foundation

**Date:** 2026-03-26 | **Priority:** P1 | **Status:** NOT_STARTED
**Estimated effort:** 3-5 days | **Risk:** Medium
**Depends on:** Phase 1 (permissions extraction needed before App.tsx split)

---

## Context

- [Context & App.tsx Research](./research/researcher-02-contexts-app-structure.md)
- [Service Layer Research](./research/researcher-01-service-patterns.md)

## Overview

Restructure App.tsx from 1057 LOC monolith into focused modules. Split bloated contexts. Split remaining oversized hooks.

## Key Insights

- App.tsx has 3 functions: App(), AppInner(), AppContent() with 10 useState + 30 conditional page renders
- UserDataContext (202 LOC) aggregates auth + social + notifications; 80% of pages only need auth
- AchievementContext (219 LOC) mixes achievements + daily missions + celebration
- ReadingSettings + ListeningSettings wrap ALL pages but used by only 2 pages each
- `use-groq-advanced.ts` (623 LOC) and `use-game-sounds.ts` (607 LOC) violate 200 LOC limit

---

## 2.1 Context Consolidation

### Requirements
- Split UserDataContext into AuthContext + SocialContext
- Split AchievementContext into AchievementDataContext + DailyMissionsContext
- Move ReadingSettings/ListeningSettings providers into their page components
- Backward-compat re-exports during transition

### Related Files
- `src/contexts/user-data-context.tsx` (202 LOC)
- `src/contexts/achievement-context.tsx` (219 LOC)
- `src/contexts/reading-settings-context.tsx` (158 LOC)
- `src/contexts/listening-settings-context.tsx` (158 LOC)
- `src/App.tsx` -- provider nesting tree

### Implementation Steps

**Step 1: Split UserDataContext**
- Create `src/contexts/auth-context.tsx` -- currentUser, login, logout, register, updateUser
- Create `src/contexts/social-context.tsx` -- friendships, badges, notifications
- SocialContext nests inside AuthContext (depends on currentUser)
- Update user-data-context.tsx to re-export from both (bridge)

**Step 2: Split AchievementContext**
- Create `src/contexts/achievement-data-context.tsx` -- achievement CRUD, unlock events
- Create `src/contexts/daily-missions-context.tsx` -- mission generation, progress, celebration
- DailyMissions nests inside AchievementData

**Step 3: Lazy-load page-scoped contexts**
- Move ReadingSettingsProvider into reading-practice page component
- Move ListeningSettingsProvider into listening-study page component
- Remove from App.tsx provider tree
- Pages that need these contexts wrap themselves

**Step 4: Update provider nesting in App.tsx**
- Remove ReadingSettings/ListeningSettings from global nesting
- Replace UserDataProvider with AuthProvider + conditional SocialProvider
- Verify no circular dependency introduced

---

## 2.2 Extract App.tsx

### Requirements
- Split App.tsx (1057 LOC) into 3-4 focused files, each <200 LOC
- Preserve exact rendering behavior
- Permission checks already centralized (Phase 1.2 prereq)

### Related Files
- `src/App.tsx` (1057 LOC)
- `src/utils/role-permissions.ts` (from Phase 1.2)

### Implementation Steps

**Step 1: Extract `src/hooks/use-app-state.ts`**
- Move 10 useState hooks + 3 useEffects from AppContent
- Export: `useAppState()` returning all state + setters
- Includes game join param logic, URL<->state bridge

**Step 2: Extract `src/components/app-providers.tsx`**
- Move provider nesting tree into dedicated component
- Props: `children: ReactNode`
- Clean pyramid: Auth > Flashcard > JLPT > Achievement > Center(conditional)

**Step 3: Extract `src/components/app-router.tsx`**
- Move 30 conditional page renders from AppContent
- Import `canAccessPage` from role-permissions
- Each render block: `{page === 'x' && canAccessPage('x', role) && <Suspense><Page /></Suspense>}`
- Consider grouping: public pages, teacher pages, admin pages, super_admin pages

**Step 4: Slim App.tsx**
- App.tsx becomes orchestrator: imports AppProviders, AppRouter, useAppState
- Target: <200 LOC for App.tsx, <200 for each extracted file

---

## 2.3 Split Large Hooks

### Requirements
- `use-groq-advanced.ts` (623 LOC) -> 2-3 sub-hooks
- `use-game-sounds.ts` (607 LOC) -> 2-3 sub-hooks
- Each resulting file <200 LOC

### Related Files
- `src/hooks/use-groq-advanced.ts` (623 LOC)
- `src/hooks/use-game-sounds.ts` (607 LOC)

### Implementation Steps

**Step 1: Analyze use-groq-advanced.ts**
- Read file, identify logical boundaries
- Likely splits: conversation state, message handling, evaluation/analysis
- Create `src/hooks/groq/` sub-directory if not exists

**Step 2: Split use-groq-advanced.ts**
- Create focused sub-hooks under `src/hooks/groq/`
- Main hook composes sub-hooks (match bingo/racing pattern)
- Backward-compat re-export from original location

**Step 3: Analyze use-game-sounds.ts**
- Read file, identify sound categories
- Likely splits: sound loading/caching, playback control, sound mappings
- Create `src/hooks/game-sounds/` sub-directory

**Step 4: Split use-game-sounds.ts**
- Create focused sub-hooks
- Main hook composes sub-hooks
- Backward-compat re-export

---

## Todo

- [ ] 2.1a Split UserDataContext -> AuthContext + SocialContext
- [ ] 2.1b Split AchievementContext -> AchievementData + DailyMissions
- [ ] 2.1c Move ReadingSettings/ListeningSettings into page components
- [ ] 2.1d Update App.tsx provider tree
- [ ] 2.2a Extract use-app-state.ts
- [ ] 2.2b Extract app-providers.tsx
- [ ] 2.2c Extract app-router.tsx
- [ ] 2.2d Slim App.tsx to <200 LOC
- [ ] 2.3a Split use-groq-advanced.ts
- [ ] 2.3b Split use-game-sounds.ts

## Success Criteria

- App.tsx <200 LOC
- No context file >150 LOC
- No hook file >200 LOC
- ReadingSettings/ListeningSettings no longer in global provider tree
- All existing tests pass
- No user-facing behavior change

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Context split causes missing data in consumers | High | Grep all useContext consumers before splitting; bridge re-exports |
| Provider reorder causes different render behavior | Medium | React DevTools profiling before/after; snapshot tests |
| Moving settings providers breaks page isolation | Medium | Test reading + listening pages thoroughly |
| Game sounds split breaks audio timing | Low | Manual playback testing on all 5+ games |

## Security Considerations

- Auth context split must not lose session persistence behavior
- Permission checks in app-router must be exact equivalent of current inline checks

## Next Steps

After Phase 2 complete, proceed to [Phase 3: Scale](./phase-03-scale.md) for CSS tokens and bundle optimization.
