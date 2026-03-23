# Timer Audit Report — 2026-03-23

Scope: all `setInterval` / `setTimeout` in `src/**/*.{ts,tsx}`

---

## setInterval Usages

| File | Line | Type | Has Cleanup | Risk |
|------|------|------|-------------|------|
| `src/components/cards-management/game/index.tsx` | 84 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/study/listening-study-view.tsx` | 48 | setInterval | YES (cleared inline when resolved) | low |
| `src/components/bingo-game/bingo-question-phase.tsx` | 34 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/classroom/test-take.tsx` | 78 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/ai-challenge/ai-challenge-play.tsx` | 67 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/ai-challenge/ai-challenge-play.tsx` | 97 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/common/floating-chat-panel.tsx` | 55 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/golden-bell/golden-bell-play.tsx` | 61 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/word-match/word-match-play.tsx` | 98 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/image-word/image-word-game-play.tsx` | 62 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/racing-game/racing-game-play.tsx` | 119 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/racing-game/racing-game-play-v2.tsx` | 102 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/racing-game/shared/race-question.tsx` | 42 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/picture-guess/picture-guess-play.tsx` | 50 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/kanji-battle/kanji-battle-play-write.tsx` | 88 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/kanji-battle/kanji-battle-play-read.tsx` | 72 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/quiz-game/play/use-game-timers.ts` | 37 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/quiz-game/play/use-game-timers.ts` | 78 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/quiz-game/play/use-game-timers.ts` | 94 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/quiz-game/play/use-game-timers.ts` | 115 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/quiz-game/play/use-game-timers.ts` | 136 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/pages/bingo-page.tsx` | 142 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/pages/chat-page.tsx` | 72 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/pages/lecture-page.tsx` | 274 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/pages/exercise/use-exercise-state.ts` | 209 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/pages/word-scramble/use-game-timer.ts` | 23 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/pages/kaiwa/use-kaiwa-state.ts` | 663 | setInterval | YES (`return () => clearInterval`) | low |
| `src/components/games/dictation-game.tsx` | 154 | setInterval | YES (ref cleared in useEffect cleanup) | low |
| `src/hooks/use-notifications.ts` | 137 | setInterval | YES (`return () => clearInterval`) | low |

---

## setTimeout Usages — Missing Cleanup (potential leaks)

These are `setTimeout` calls **not** inside a `useEffect` with a `return () => clearTimeout(...)`. Most are fire-and-forget UI toasts (low risk), but the ones below deserve attention:

| File | Line | Description | Risk |
|------|------|-------------|------|
| `src/services/quiz-game/game-flow.ts` | 21 | Bare `setTimeout(async () => {...})` at module level — no ref, no cleanup possible | **medium** — if component unmounts before it fires, the async work (Firestore write) still runs |
| `src/components/kaiwa/kaiwa-shadowing-mode.tsx` | 122, 142, 173, 200, 229 | Multiple bare `setTimeout` calls outside useEffect cleanup blocks | **medium** — timers can fire after component unmount causing state-update-on-unmounted warnings |
| `src/components/kaiwa/speaking/speaking-dialogue-view.tsx` | 200 | Bare `setTimeout` not covered by `phaseTimerRef` cleanup | medium |
| `src/components/game-hub/music-player/use-playback-control.ts` | 63, 74, 85 | Three bare `setTimeout` — no refs, no cleanup | medium |
| `src/hooks/racing-game/use-game-creation.ts` | 144, 148 | `botTimerRef` assigned but cleanup not verified outside this hook | low-medium |

---

## Fire-and-Forget setTimeout (low risk — intentional UI micro-delays)

The following are short-lived toasts / focus calls that do not cause memory leaks in practice because:
- They hold no component references that would prevent GC
- They resolve within 1.5–3 s and have no side effects after component unmounts (or the state setter silently no-ops in React 18+)

Files with acceptable bare `setTimeout`:
- `src/components/cards-management/game/quiz-game-settings-panel.tsx:23`
- `src/components/cards-management/game/ai-challenge-settings-panel.tsx:95`
- `src/components/study/session/study-header.tsx:245`
- `src/components/achievements/celebration-overlay.tsx:36`
- `src/components/achievements/achievement-toast.tsx:19,21,34`
- `src/components/kaiwa/kaiwa-message-item.tsx:46`
- `src/components/center/center-invite-manager.tsx:28`
- `src/components/center/center-branding-editor.tsx:25`
- `src/components/flashcard/kanji-decomposer-modal.tsx:185,384`
- `src/components/flashcard/kanji-analysis-editor.tsx:140`
- `src/components/flashcard/radical-explorer-panel.tsx:122`
- `src/components/classroom/classroom-invite-modal.tsx:53`
- `src/components/quiz-battle/quiz-battle-playing.tsx:44,48,62`
- `src/components/quiz-battle/quiz-battle-results.tsx:22` (has cleanup)
- `src/hooks/shared/use-notification.ts:16`
- And other toast/focus calls throughout the codebase

---

## Summary

- **setInterval without cleanup**: 0 — all intervals are properly cleared.
- **setTimeout with meaningful risk**: 5 files noted above (medium risk).
- **Recommended fixes** (not done yet per task instructions):
  1. `src/services/quiz-game/game-flow.ts:21` — wrap in an `AbortController` or store ref to cancel.
  2. `src/components/kaiwa/kaiwa-shadowing-mode.tsx` — collect bare `setTimeout` IDs in refs and clear in the existing cleanup.
  3. `src/components/game-hub/music-player/use-playback-control.ts` — add `timerRef` pattern for the three bare timeouts.
