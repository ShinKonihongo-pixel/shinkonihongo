# Code Review Summary — Shinko Reusability Follow-up Audit

**Date:** 2026-03-30
**Reviewer:** code-reviewer subagent
**Scope:** Verify status of all 13 previously identified issues; audit shared component adoption; find new reusability gaps
**Prior reports:** `code-reviewer-260327-shinko-component-reuse-audit.md`, `shinko-duplication-patterns.md`

---

## Scope

- Files reviewed: ~40 deep-read + pattern search across 1,128 source files
- Lines analyzed: ~5,000 (targeted reads)
- Review focus: Delta since 2026-03-27 — 4 commits, 339 files changed
- Updated plans: none (research-only as requested)

---

## Overall Assessment

Significant cleanup was done in the 4 commits since the March 27 audit. 7 of 13 issues are now fixed. The `ModalShell`, `EmptyState`, `SearchInput` shared components were created with solid adoption (50, 39, 9 consumers respectively). `TabBar` and `LevelBadge` were created but adoption is shallow — only 3 consumers each vs 22+ remaining raw patterns. TypeScript error count dropped from 103 → 96, but the reduction is modest given the scope of the refactoring.

---

## Previous Issue Status Table

| ID | Description | Status | Evidence |
|---|---|---|---|
| **H1** | JLPTLevel defined 4 times with diverging shapes | **OPEN** | Still 4 definitions in `types/` + 3 new local definitions added: `dashboard-leaderboard.tsx:10`, `services/quiz-battle/quiz-battle-service.ts:13`, `hooks/ai-challenge/utils.ts:13`. Total proliferation **increased** to 7 sites |
| **H2** | Tab switching duplicated 14 times (no TabBar) | **PARTIAL** | `TabBar<T>` created and exported. 3 sites migrated (admin-page, center-dashboard-page, topic-detail-view). **19 raw tab `useState` patterns remain** (12 original + 7 new) |
| **H3** | KaiwaCharacter redefined locally 3 times | **PARTIAL** | `listening-tts-form.tsx` and `listening-audio-list.tsx` fixed (now import from types). `use-listening-audio-handlers.ts:9` **still has local `interface KaiwaCharacter { id, name }`** — still causes TS2345 errors at lines 178 and 228 |
| **H4** | role-permissions-page save is mock (setTimeout) | **OPEN** | `role-permissions-page.tsx:185-195` unchanged — still `await new Promise(resolve => setTimeout(resolve, 500))` with 3 TODO comments |
| **M1** | Stat display widgets duplicated 374 times | **OPEN** | 308 references to `stat-card`/`stat-value`/`stat-label`/`gm-stat` remain. No `StatCard` component created |
| **M2** | Level badge duplicated 15+ times | **PARTIAL** | `LevelBadge` component created and exported. 3 consumers. **42 raw level badge `className` patterns remain** across 25+ files with 15+ different CSS class names |
| **M3** | Game creation hooks near-identical across 5-6 types | **OPEN** | Now 9 hooks (3 new: `image-word`, `racing-game`, `kanji-battle`). Total 1,242 LOC of near-identical code. No generic `useCreateGame` extracted |
| **M4** | useUserData is god-context (23 consumers) | **PARTIAL** | Memoization fixed (commit 6721215) — the root `useMemo` in `UserDataProvider` now actually works because sub-hooks return stable references. Context split not done; still 21-24 consumers of the monolithic context |
| **M5** | `as any` in 7 lobby components for hostPlayer.role | **FIXED** | `role?: string` added to `BasePlayer` in `game-types.ts:19,33`. All 7 `as any` casts removed. Zero `as any` in entire codebase |
| **10** | Modal/Overlay Shell duplicated 35+ files | **FIXED** | `ModalShell` created, 50 consumers. Raw `position: fixed` modal overlays reduced from ~84 to 18 CSS patterns |
| **11** | EmptyState duplicated 36 times | **PARTIAL** | `EmptyState` created, 39 consumers (exceeds original target). **27 raw `className="empty-state"` patterns remain** — partial migration |
| **12** | Search/filter duplicated 80+ components | **PARTIAL** | `SearchInput` created, 9 consumers. Still ~70+ raw search input patterns not migrated |
| **13** | Button styles duplicated across 20+ CSS files | **OPEN** | No `Button` component or shared `buttons.css` created. 115 CSS files with button definitions |

**Summary: 2 Fixed, 6 Partial, 5 Open (of 13)**

---

## Shared Component Adoption Metrics

| Component | Location | Consumers | Notes |
|---|---|---|---|
| `ModalShell` | `src/components/ui/modal-shell.tsx` | **50** | Strong adoption. 18 raw modal CSS patterns remain |
| `EmptyState` | `src/components/ui/empty-state.tsx` | **39** | Good. 27 raw empty-state patterns not migrated |
| `SearchInput` | `src/components/ui/search-input.tsx` | **9** | Low — ~70+ raw search inputs remain |
| `TabBar<T>` | `src/components/ui/tab-bar.tsx` | **3** | Very low — 19 raw tab patterns remain |
| `LevelBadge` | `src/components/ui/level-badge.tsx` | **3** | Very low — 42 raw badge patterns remain |
| `LoadingIndicator` | `src/components/ui/loading-indicator.tsx` | unknown | Not audited this pass; 165 loading patterns reported in March 27 report |
| `ConfirmModal` | `src/components/ui/confirm-modal.tsx` | unknown | Not audited; 115 confirmation patterns reported previously |
| `PremiumButton` | `src/components/ui/premium-button.tsx` | unknown | Not audited; button CSS still duplicated |
| `useLobbyState` | `src/hooks/shared/use-lobby-state.ts` | 7 | Working well — template for game creation hooks |

---

## New Reusability Issues Found

### N1 — JLPTLevel proliferation worsened: now 7 definitions

The March 27 audit found 4 type definitions. Three new local definitions have been added:
- `src/components/dashboard/dashboard-leaderboard.tsx:10` — `type JLPTLevel = 'N5'|'N4'|'N3'|'N2'|'N1'` (missing BT)
- `src/services/quiz-battle/quiz-battle-service.ts:13` — same 5-value variant
- `src/hooks/ai-challenge/utils.ts:13` — 6-value variant with BT, exported but not from `types/`
- `src/components/ai-challenge/ai-challenge-menu.tsx:11` — `type JLPTLevel = typeof JLPT_LEVELS[number]` (derived)

Also: `src/hooks/settings/settings-types.ts:33,38` exports `JLPTLevelOption` and `JLPTLevelKey` as separate types with same 5-value shape. **9 competing definitions total.**

### N2 — 94 loading/error useState pairs: `useAsync` pattern missing

94 instances of `const [loading, setLoading] = useState` paired with `const [error, setError] = useState`. Pattern is identical in structure everywhere: set loading true, call async fn, catch and set error, finally set loading false. No shared `useAsync` or `useRequest` hook exists.

```ts
// Repeated 94 times in hooks:
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
// ...
setLoading(true); setError(null);
try { await ... } catch(e) { handleError(e, ...); setError(e.message); } finally { setLoading(false); }
```

**Estimated LOC impact:** ~300 LOC reduction if extracted to `useAsync<T>(fn)` hook.

### N3 — `use-listening-audio-handlers.ts` local KaiwaCharacter still present (H3 regression)

The March 27 fix commit (`d8c0033`) fixed 2 of 3 files but missed `use-listening-audio-handlers.ts:9`. The local interface shadows the canonical type causing 2 active TS2345 errors. Additionally the fix created a new TS2339 — `getPresetForCharacter` is expected from `useKaiwaCharacters()` in `listening-audio-view.tsx:49` but that hook does not export it.

### N4 — `getPresetForCharacter` missing from `useKaiwaCharacters` hook return

`listening-audio-view.tsx:49` destructures `getPresetForCharacter` from `useKaiwaCharacters()` but the hook does not return it (TS2339). `listening-audio-list.tsx:9` imports it directly as a named export instead. Inconsistent API across the 3 consuming files.

### N5 — Tab switching patterns growing: 22 instances vs 14 at audit time

The original 14 tab patterns have grown to 22. TabBar was only migrated to 3 sites. Sites not yet migrated include high-traffic pages: `student-detail-modal.tsx`, `friends-panel.tsx`, `notifications-page.tsx`, `branch-management-page.tsx`, `kaiwa-stats-dashboard.tsx`.

---

## Top 5 Recommended Actions (Impact/Effort)

### 1. Fix `use-listening-audio-handlers.ts` + `useKaiwaCharacters` API (Critical, 30 min)

- Delete `interface KaiwaCharacter` at line 9 of `use-listening-audio-handlers.ts`
- Import from `../../../types/listening`
- Add `getPresetForCharacter` to `useKaiwaCharacters` return (or make all consumers import it directly, consistently)
- Eliminates 4 active TS errors; unblocks TS error count reduction

### 2. Consolidate JLPTLevel to single canonical type (High, 1 hour)

Create `src/types/shared.ts` (or `src/types/common.ts`) with:
```ts
export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BT';
```
Delete the 4 definitions in `types/` domain files, make them re-export from shared. Delete 3 local component definitions, delete `JLPTLevelOption`/`JLPTLevelKey` aliases in settings-types (or keep only as internal aliases). Resolves the kaiwa/jlpt-question incompatibility and prevents future divergence.

### 3. Complete TabBar migration to remaining 19 sites (Medium, 2-3 hours)

TabBar component is production-ready (generic, typed, supports icons/badges). The 19 remaining raw tab patterns are the majority of tab-switching code. Priority targets:
- `student-detail-modal.tsx` (highest traffic)
- `friends-panel.tsx`
- `notifications-page.tsx`
- `cards-page.tsx`
- `branch-management-page.tsx`

**~180 LOC reduction + eliminates 15+ different CSS tab class names.**

### 4. Complete LevelBadge migration to remaining 42 sites (Medium, 2-3 hours)

`LevelBadge` component exists and handles per-level CSS classes via `lb-level--{level}` pattern. The 42 remaining raw patterns span 25+ files. Only 3 sites migrated so far. Priority: `flashcard-item.tsx`, `grammar-card-list.tsx`, `kaiwa-stats-dashboard.tsx`, `lecture-card.tsx`. Note: `kaiwa-badge` usage in `kaiwa-conversation-header.tsx` and `kaiwa-session-header.tsx` is used for non-JLPT badges (role, style, topic) — those should NOT migrate to LevelBadge.

### 5. Extract `useAsync<T>` hook to eliminate 94 loading/error patterns (Medium, 2 hours)

```ts
export function useAsync<T>(fn: (...args: any[]) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const execute = useCallback(async (...args: any[]) => {
    setLoading(true); setError(null);
    try { return await fn(...args); }
    catch(e) { handleError(e, 'useAsync'); setError((e as Error).message); throw e; }
    finally { setLoading(false); }
  }, [fn]);
  return { loading, error, execute };
}
```
Most of the 9 game-creation hooks and dozens of form handlers could reduce to 2-3 lines.

---

## TypeScript Build Status

`npx tsc -b` exits non-zero with **96 errors** (was 103 at March 27 audit; -7).

| Error Code | Count | Category |
|---|---|---|
| TS6133 | 49 | Unused declarations |
| TS2322 | 14 | Type mismatches |
| TS18048 | 6 | Possibly-undefined |
| TS2345 | 6 | Argument type mismatches |
| TS2552 | 4 | Possible misspelling |
| TS2304 | 4 | Undeclared names |
| TS2554 | 3 | Wrong arg count |
| TS18047 | 3 | Possibly null |
| Others | 7 | Mixed |

Key unfixed errors from March 27:
- `multi-line-chart.tsx` — 6x TS18048 `resolvedLines` possibly undefined (unchanged)
- `vocabulary-tab-form.tsx:63` / `vocabulary-tab.tsx:267` — Flashcard/GrammarCard type mismatch (unchanged)
- `use-listening-audio-handlers.ts:178,228` — KaiwaCharacter still local (H3 partial fix)
- `listening-audio-view.tsx:49` — new TS2339 from incomplete H3 fix

`npx tsc --noEmit` exits 0 (different tsconfig path — Vite does not enforce strict build checks).

---

## Metrics

| Metric | March 27 | March 30 | Change |
|---|---|---|---|
| TS build errors | 103 | 96 | -7 |
| `as any` casts | 11 | 0 | **-11 (all fixed)** |
| JLPTLevel definitions | 4 | 7+ | +3 (worsened) |
| Tab switching raw patterns | 14 | 22 | +8 |
| Level badge raw patterns | 15+ | 42 | +27 |
| ModalShell consumers | 0 | 50 | **+50** |
| EmptyState consumers | 0 | 39 | **+39** |
| SearchInput consumers | 0 | 9 | +9 |
| TabBar consumers | 0 | 3 | +3 |
| LevelBadge consumers | 0 | 3 | +3 |
| CSS `!important` | 116 | 129 | +13 |
| useUserData consumers | 23 | ~22 | ~same |
| Game creation hooks | 6 | 9 | +3 |

---

## Unresolved Questions

1. `role-permissions-page.tsx` mock save: is this tracked as a known deferred feature or was it expected to be fixed during the refactoring?
2. `getPresetForCharacter` — should it be returned from `useKaiwaCharacters()` hook or be a standalone utility? Currently inconsistent: `listening-audio-view.tsx` expects it from hook, `listening-audio-list.tsx` imports it directly.
3. `JLPTLevelOption` / `JLPTLevelKey` in `settings-types.ts` — are these intentionally separate types or aliases for `JLPTLevel`? If aliases, they should be removed during consolidation.
4. The 3 new game creation hooks (`image-word`, `racing-game`, `kanji-battle`) added since March 27 — is this the final count, or are more game types planned? Affects priority of extracting `useCreateGame`.
