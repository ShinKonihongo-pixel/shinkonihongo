# Code Review Summary — Shinko Component Reuse & Quality Audit

**Date:** 2026-03-27
**Reviewer:** code-reviewer subagent
**Scope:** Full codebase scan — components, hooks, contexts, services

---

## Scope

- Files reviewed: ~1,128 TypeScript/TSX source files (pattern-scan); deep-read on ~40 key files
- Lines of code analyzed: ~50,000+ (pattern search); ~3,000 (deep read)
- Review focus: Component reuse opportunities, hook optimization, performance, code quality, architecture
- Updated plans: none (no existing plan for this review)

---

## Overall Assessment

TypeScript build has **103 type errors** across 40 files — this is the most urgent finding. No console.log leakage in production code (good). CSS `!important` overuse at 116 occurrences is high but not new. Duplication patterns are significant but a prior scout report (`shinko-duplication-patterns.md`) already catalogued them; this review adds concrete line-number specifics and new findings not covered there.

---

## Critical Issues

### C1 — TypeScript build fails: 103 errors across 40 files

`npx tsc -b` exits non-zero. The errors fall into these categories:

| Error Code | Count | Category |
|---|---|---|
| TS6133 | 48 | Unused declarations (imports/vars) |
| TS2322 | 14 | Type mismatches |
| TS2304 | 11 | Undeclared names |
| TS2345 | 7 | Argument type mismatches |
| TS18048 | 6 | Possibly-undefined dereferences |
| TS2554 | 3 | Wrong argument count |
| Others | 14 | Mixed |

**Highest-risk non-trivial errors:**

1. **`src/contexts/user-data-context.tsx:25,126`** — `login` typed as sync `() => { success: boolean }` but `use-auth.ts:83` returns `Promise<{ success: boolean }>`. Consumers in `auth-gate.tsx:40` get the async version but type context sees sync — runtime behavior depends on which version the caller awaits.

2. **`src/components/pages/home-page.tsx:402`** — `onShowTour` referenced but never declared in scope. This is a **compile-time undefined variable** that will throw at runtime when the branch is hit.

3. **`src/components/pages/kaiwa/kaiwa-page-types.ts:12-13`** — `JLPTLevel` and `ConversationTopic` referenced without import (TS2304). The file is presumably new from recent refactoring.

4. **`src/components/cards-management/vocabulary-tab-form.tsx:63`** and **`vocabulary-tab.tsx:267`** — `Flashcard[]` ↔ `GrammarCard[]` type assignment errors (TS2322). These are structural incompatibilities, not just naming issues.

5. **`src/components/analytics/multi-line-chart.tsx:28,40,45,66,78,109`** — 6× `resolvedLines` possibly undefined dereferences (TS18048). Will crash if called with no lines.

6. **`src/components/cards-management/listening/`** — Three files define a local `interface KaiwaCharacter { id, name }` that shadows `src/types/listening.ts:34`'s fuller interface (which adds `gender`, `voiceURI`, etc.), causing TS2345 argument-type errors at call sites. Files: `listening-tts-form.tsx:10`, `listening-audio-list.tsx:14`, `use-listening-audio-handlers.ts:9`.

7. **`src/components/quiz-game/game-create-handlers.ts:5`** — `Dispatch` and `SetStateAction` imported as values instead of `import type`, violating `verbatimModuleSyntax` (TS1484).

**Fix priority:** Items 2, 3, 4, 5, 6 are runtime risk. Item 1 is a type contract mismatch that affects auth reliability. Item 7 is a clean compile error.

---

## High Priority Findings

### H1 — `JLPTLevel` type defined 4 times with diverging shapes

```
src/types/jlpt-question.ts:3  → 'N5'|'N4'|'N3'|'N2'|'N1'        (5 values)
src/types/flashcard.ts:3      → 'N5'|'N4'|'N3'|'N2'|'N1'|'BT'   (6 values)
src/types/kaiwa.ts:5          → 'N5'|'N4'|'N3'|'N2'|'N1'|'BT'   (6 values)
src/types/kanji-battle.ts:156 → 'N5'|'N4'|'N3'|'N2'|'N1'|'BT'   (6 values)
```

The `jlpt-question.ts` variant is missing `'BT'`, causing TS2345 in `use-kaiwa-state.ts:83,91` where a `kaiwa.JLPTLevel` is passed to a function expecting `jlpt-question.JLPTLevel`. This is a **structural type incompatibility** that causes real assignment failures.

**Fix:** Consolidate to a single canonical `JLPTLevel` in `src/types/common.ts` or `src/types/shared.ts`, re-export from each domain type file.

**Impact:** Fixes 3+ TS errors, prevents future divergence.

### H2 — Tab switching pattern duplicated 14 times without shared component

Pattern: `const [activeTab, setActiveTab] = useState<SomeTabType>('default')` + JSX tab buttons using `className={\`tab ${activeTab === 'x' ? 'active' : ''}\`}`.

Files (14 confirmed instances):
- `src/components/pages/admin-page.tsx:46`
- `src/components/pages/cards-page.tsx:65`
- `src/components/pages/center-dashboard-page.tsx:78`
- `src/components/pages/branch-management-page.tsx:42`
- `src/components/pages/notifications-page.tsx:51`
- `src/components/cards-management/kaiwa/index.tsx:57`
- `src/components/cards-management/vocabulary-tab.tsx:46`
- `src/components/cards-management/custom-topics/index.tsx:57`
- `src/components/branch-management/branch-salaries-tab.tsx:26`
- `src/components/branch-management/branch-teachers-tab.tsx:29`
- `src/components/kaiwa/kaiwa-stats-dashboard.tsx:54`
- `src/components/classroom/student-detail-modal.tsx:81`
- `src/components/common/export-import-modal.tsx:37`
- `src/components/friends/friends-panel.tsx:45`

Each also has tab-button JSX with different CSS class names (`subtab`, `tab-btn`, `stats-tab`, `session-tab-btn`, `sub-tab`, etc.) — same behavioral pattern, 14 different CSS class names.

**Fix:** Extract `<TabBar tabs={[...]} activeTab={tab} onChange={setTab} />` + `useTabState<T>(defaultTab)`. The prior duplication report suggested this; this confirms the exact count and files.

**Estimated LOC impact:** ~200 LOC reduction + 14 CSS class consolidations.

### H3 — `KaiwaCharacter` redefined locally 3 times, shadowing canonical type

`src/types/listening.ts:34` exports the full interface (6 fields). Three files in `src/components/cards-management/listening/` redefine a stripped-down local version (2 fields: `id`, `name`), which causes TS2345 errors when these components pass their local version to functions that expect the full type.

Files:
- `listening-tts-form.tsx:10` — `interface KaiwaCharacter { id: string; name: string }`
- `listening-audio-list.tsx:14` — same
- `use-listening-audio-handlers.ts:9` — same

**Fix:** Delete local definitions, import from `../../../types/listening`.

**Impact:** Fixes 3 TS2345 errors, removes ~6 LOC of duplicate declarations.

### H4 — `role-permissions-page.tsx` save is a mock (setTimeout), never persists

`src/components/pages/role-permissions-page.tsx:185,189` — The `handleSave` function contains `await new Promise(resolve => setTimeout(resolve, 500))` with a TODO comment acknowledging Firestore write is not implemented. The UI shows a success indicator but nothing is persisted. This is a **feature gap masquerading as working functionality**.

**Severity:** High if the page is user-facing; Medium if admin-only.

---

## Medium Priority Improvements

### M1 — Stat display widgets duplicated 374 times across components

Pattern: `<div className="stat-card"><span className="stat-value">{n}</span><span className="stat-label">Label</span></div>`

Examples:
- `src/components/cards-management/game/dashboard-view.tsx:73-106` — 4 identical `gm-stat-card` blocks
- `src/components/study/study-result.tsx:75-80` — same pattern with `stat-card`
- `src/components/lecture/pptx-import-modal.tsx:213-218` — same with `stat-value`/`stat-label`

**Fix:**
```tsx
function StatCard({ value, label, icon }: { value: string | number; label: string; icon?: ReactNode }) {
  return <div className="stat-card"><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>;
}
```
**Estimated LOC impact:** ~300-500 LOC reduction.

### M2 — Level badge pattern duplicated 15+ times with inconsistent CSS class names

| Component | CSS class |
|---|---|
| `lecture-card.tsx:39` | `lecture-level-badge` |
| `ui/study-header-compact.tsx:35` | `level-badge` |
| `home/learning-path-widget.tsx:66` | `lp-badge` |
| `home/daily-words-task.tsx:93` | `dw-card-level-badge` |
| `flashcard/flashcard-list.tsx:69` | `jlpt-badge-small` |
| `kaiwa/kaiwa-conversation-header.tsx:80` | `kaiwa-badge` |
| `kaiwa/kaiwa-stats-dashboard.tsx:288` | `level-badge` (with inline style) |
| `cards-management/kaiwa/questions-view.tsx:220,430` | `meta-badge level`, `level-badge` |
| `study/session/study-header.tsx:96` | `level-badge-study` |

Same visual element (JLPT level pill), 9+ different CSS class names.

**Fix:** `<LevelBadge level="N3" />` component in `src/components/ui/`.

**Estimated LOC impact:** ~150 LOC reduction + CSS consolidation.

### M3 — Game creation hooks have near-identical structure across 5 game types

`use-game-creation.ts` exists in: `golden-bell/`, `word-match/`, `bingo-game/`, `word-scramble/`, `quiz-battle/`, `kanji-drop/`. A `diff` of `golden-bell` vs `word-match` versions shows ~70% structural identity — only type imports and game-specific initialization differ.

Each has the same pattern:
1. `useCallback(async (data: CreateXData) => { setLoading(true); setError(null); ... generateGameCode(); createGameRoom(...); ... })`
2. Same error handling structure
3. Same bot scheduling invocation

**Fix:** Generic `useCreateGame<TGame, TCreateData>(factory: (data) => TGame)` that takes a factory function. The per-game hooks become thin wrappers.

**Estimated LOC impact:** ~800 LOC reduction across 6 hooks.

### M4 — `useUserData` is a god-context consumed by 23 components

`src/contexts/user-data-context.tsx` bundles: auth state, user history, friendships, badges, game invitations, classroom notifications, friend notifications — all in one useMemo'd blob with 11 dependencies. 23 components consume this context.

Any change to friendship state (e.g., a friend request) re-renders all 23 consumers because the entire memoized object is a single context value. Components that only need `currentUser` get re-rendered when `friendNotifications` changes.

**Fix:** Split into smaller contexts — `useAuthContext` (auth only), `useSocialContext` (friends/badges/invitations), `useNotificationsContext`. Or use context selectors (Zustand/jotai would be ideal for this use case).

**Estimated impact:** Reduces unnecessary re-renders for ~20 components.

### M5 — `as any` used in 7 lobby components for `hostPlayer.role`

```tsx
// Pattern repeated in 7 lobby files:
role={(hostPlayer as any).role}
```

Files: `bingo-game-lobby.tsx:103`, `word-scramble-lobby.tsx:59`, `golden-bell-lobby.tsx:85`, `word-match-lobby.tsx:60`, `image-word-lobby.tsx:61`, `picture-guess-lobby.tsx:67`, `kanji-battle-lobby.tsx:68`

This indicates `role` is not typed on the shared `BasePlayer` type but all game types have it.

**Fix:** Add `role?: string` to `BasePlayer` type in `src/hooks/shared/game-types.ts`. Removes all 7 `as any` casts.

### M6 — CSS `!important` at 116 occurrences

Already tracked in project memory. Specific offenders (from prior report): `src/components/shared/game-lobby/premium-lobby.css` (21 instances), `src/components/quiz-game/quiz-game-premium.css` (11 instances). New CSS files added in this refactoring cycle (`src/components/cards-management/kaiwa/kaiwa-tab-*.css`, `src/components/pages/admin-page-*.css`) should be audited before they accumulate more.

---

## Low Priority Suggestions

### L1 — 29 `eslint-disable` comments, mostly `react-hooks/set-state-in-effect`

The custom rule `react-hooks/set-state-in-effect` is being suppressed in 20+ places. This is a non-standard rule (not in `eslint-plugin-react-hooks`). If it's a custom/typo rule, these comments do nothing. If it is intentional, the pattern it suppresses (setState inside useEffect) is actually valid React when the effect runs only on mount. The comments add noise without protecting against real issues.

**Recommendation:** Audit whether the rule exists; if not, remove all 20+ suppress comments.

### L2 — `only-export-components` suppressed in `player-leaderboard.tsx:161`

`// eslint-disable-next-line react-refresh/only-export-components` — this suppress prevents HMR from working correctly for that export. The underlying fix is to move the non-component export to a separate utility file.

### L3 — `onShowTour` undeclared variable in `home-page.tsx:402`

This is also a Critical (C1) item. At Low level: the feature (onboarding tour button) is silently broken — the button will never render because `onShowTour` is always `undefined`, but no error is thrown (React renders `null` for `{undefined && ...}`). A prop or context connection is missing.

### L4 — `role-permissions-page.tsx` uses `void _startListenPhase` to suppress unused warning

`src/components/kaiwa/kaiwa-shadowing-mode.tsx:91`: `void _startListenPhase; // Suppress unused warning`. This is a code smell — unused function should be removed, not suppressed.

### L5 — Only 2 components use `React.memo` across 1,128 files

`daily-words-task.tsx:73` and `grammar-card.tsx:21`. With 14 tab-switching pages and large list components (student-detail-modal at 590 LOC, test-bank at ~600 LOC), there are legitimate candidates for memoizing child components to prevent re-renders. Not urgent since most performance issues would need profiling to confirm, but notable.

---

## Positive Observations

- **Zero `console.log` in production code** — all logging goes through `handleError()`. Excellent discipline.
- **`useLobbyState` shared hook** — correctly extracted and used in 7 lobby components. Template for game creation hooks.
- **`user-data-context.tsx`** uses `useMemo` with explicit dependency array on the context value — prevents unnecessary re-renders from reference equality. The split concern is still an issue (M4) but the memoization is correct.
- **`useOffline`** — well-structured, proper cleanup of event listeners, debounced sync, clean error handling via `handleError`.
- **Game creation hooks** — all follow identical error handling structure (setLoading, setError, try/catch). Consistency is good even if not yet DRY.
- **TS strict mode** — enforced (`verbatimModuleSyntax`), which is why the TS1484 error was caught.

---

## Recommended Actions

### Immediate (fixes real bugs / compile failures)

1. **Fix `home-page.tsx:402`** — declare or import `onShowTour`. Check `App.tsx` / `app-content.tsx` for where it should be wired from.
2. **Fix `kaiwa-page-types.ts:12-13`** — add missing imports for `JLPTLevel`, `ConversationTopic`.
3. **Delete local `KaiwaCharacter` redefinitions** in 3 listening files; import from `types/listening.ts`.
4. **Fix `game-create-handlers.ts:5`** — `import type { Dispatch, SetStateAction }` (add `type` keyword).
5. **Fix `user-data-context.tsx:25`** — change `login` type to `Promise<...>` to match `use-auth.ts:83`.
6. **Fix `multi-line-chart.tsx`** — add null guard for `resolvedLines` before 6 dereferences.
7. **Fix `vocabulary-tab-form.tsx:63` / `vocabulary-tab.tsx:267`** — investigate why `Flashcard[]` and `GrammarCard[]` are being assigned interchangeably; add correct union type or separate props.

### Short-term (1-2 weeks)

8. **Consolidate `JLPTLevel` type** to single canonical definition; remove 3 duplicate declarations. Add `'BT'` to `jlpt-question.ts` if needed, or narrow where appropriate.
9. **Add `role?: string` to `BasePlayer`** — removes 7 `as any` casts in lobby components.
10. **Extract `<TabBar>` component** — covers 14 instances, ~200 LOC saved + CSS normalization.
11. **Extract `<LevelBadge>` component** — covers 15+ instances, ~150 LOC + 9 CSS class names consolidated.
12. **Implement `role-permissions-page.tsx` Firestore write** — currently `handleSave` is a fake. Track as a separate task if intentionally deferred.

### Medium-term (sprint)

13. **Generic `useCreateGame` hook** — covers 6 game-creation hooks, ~800 LOC reduction.
14. **Split `UserDataContext`** into auth / social / notifications sub-contexts to reduce re-render surface for 23 consumers.
15. **Extract `<StatCard>` component** — covers 374 instances, ~300-500 LOC reduction.
16. **Audit `eslint-disable react-hooks/set-state-in-effect`** — verify rule exists, remove if not.

---

## Metrics

- Type errors (tsc -b): **103** (48 unused vars, 55 structural/logic errors)
- Files with type errors: **40**
- `as any` usage: **11** (7 clustered in lobby components — H5; 4 scattered)
- `eslint-disable` comments: **29**
- `!important` in CSS: **116**
- `React.memo` usage: **2** across ~400 TSX files
- Tab switching duplications: **14** confirmed instances
- Level badge duplications: **15+** with 9 different CSS class names
- Stat card duplications: **374** class references
- Console.log in production: **0** (excellent)
- Game creation hooks (near-identical): **6** hooks

---

## Unresolved Questions

1. Is `onShowTour` intentionally removed from `HomePage` props or was it accidentally dropped during recent refactoring? The button is present in JSX but the variable is never defined.
2. `role-permissions-page.tsx` save is fake — is this a known deferred feature or a regression?
3. The `jlpt-question.ts` `JLPTLevel` excludes `'BT'` — is this intentional (JLPT never has a "BT" level) or an oversight causing the kaiwa/jlpt-question incompatibility?
4. The `react-hooks/set-state-in-effect` ESLint rule suppressed in 20+ places — is this a custom rule or a typo?
