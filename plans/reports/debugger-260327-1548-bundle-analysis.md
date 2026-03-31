# Shinko Build Performance & Bundle Composition Report
**Date:** 2026-03-27  **Build time:** 11.35s  **Modules:** 3404

---

## Executive Summary

- **Total dist size:** ~15.2 MB (pre-cache manifest says 15242.89 KiB)
- **Initial load (blocking):** ~554 kB raw / ~141 kB gzip — dominated by Firebase SDK
- **Lazy loading:** 29 pages all correctly lazy-loaded via `React.lazy()`
- **Critical issue:** Firebase (443 kB) loads eagerly on every page visit — it's in the critical path
- **3 dynamic-import warnings:** Vite can't split modules that are also statically imported elsewhere

---

## Initial Load Bundle (Blocking on First Paint)

These chunks load synchronously before the app renders:

| Chunk | Raw | Gzip | Contents |
|-------|-----|------|----------|
| `index-Cotyy-yC.js` | 527 kB | 161 kB | Main app chunk (unclear contents — likely index/shared code) |
| `vendor-firebase-CAVqBiPf.js` | 443 kB | 136 kB | Firebase SDK (auth + firestore + storage) |
| `vendor-react-qkC6yhPU.js` | 11 kB | 4 kB | React core |
| `vendor-ui-p_RDBC8l.js` | 47 kB | 15 kB | UI vendor libs |
| **Total initial** | **~1028 kB** | **~316 kB** | |

**The 527 kB `index-Cotyy-yC.js` chunk is concerning** — this is likely the bundled output of the eagerly-loaded provider chain and shared hooks/contexts.

---

## Top 5 Largest Chunks

| Rank | Chunk | Raw | Gzip | Contents |
|------|-------|-----|------|----------|
| 1 | `index-Cotyy-yC.js` | 527 kB | 161 kB | Main/shared code bundle |
| 2 | `kanji-data-DYAMRgfF.js` | 523 kB | 195 kB | Kanji static data |
| 3 | `vendor-firebase-CAVqBiPf.js` | 443 kB | 136 kB | Firebase SDK |
| 4 | `jspdf.es.min-CQFAijot.js` | 385 kB | 126 kB | jsPDF library |
| 5 | `cards-page-mfcv91xG.js` | 340 kB | 83 kB | Cards page (lazy) |

---

## Top 5 Largest CSS Chunks

| Chunk | Raw | Gzip |
|-------|-----|------|
| `cards-page-Bca5_fS7.css` | 256 kB | 40 kB |
| `game-hub-page-Bja92No9.css` | 147 kB | 25 kB |
| `settings-page-BjcFj6X0.css` | 99 kB | 17 kB |
| `classroom-page-BMxi3noI.css` | 88 kB | 14 kB |
| `quiz-game-page-D7Hyxjnk.css` | 79 kB | 15 kB |

CSS for lazy pages loads with those pages — this is correct. However `cards-page` CSS at 256 kB raw is very large.

---

## Lazy Loading Status

**All 29 page components are correctly lazy-loaded** in `app-content.tsx` via `React.lazy()`.

No eager `import ... from '...pages/'` statements found — the pattern is sound.

Router (`router.tsx`) has no direct page imports; it imports only `AppLayout` and `AppContent` (both needed for initial render).

---

## Firebase Code-Splitting Status

**Firebase is NOT code-split — it loads eagerly.** Import chain:

```
main.tsx → router.tsx → AppLayout → user-data-context → use-auth → lib/firebase.ts → firebase SDK
```

`lib/firebase.ts` statically imports `firebase/app`, `firebase/firestore`, `firebase/auth`, `firebase/storage` synchronously. This forces the 443 kB vendor-firebase chunk into the critical path.

---

## Kanji Data Status

`kanji-data-DYAMRgfF.js` (523 kB / 195 kB gzip) is a **separate lazy chunk** — correctly split from the main bundle. It only loads when `KanjiStudyPage` is visited.

---

## Vite Dynamic Import Warnings (3 Issues)

These modules have conflicting static + dynamic imports, preventing effective code-splitting:

1. **`game-crud.ts`** — statically imported by `game-flow.ts`, `game-results.ts`, `index.ts`, `player-service.ts`; dynamically by `use-quiz-game-bots.ts`
2. **`classroom-firestore.ts`** — statically imported by 10+ classroom hooks; dynamically by `classroom-page.tsx`
3. **`student-report-pdf-export.ts`** — statically imported by `evaluation/index.tsx` and `student-detail-modal.tsx`; dynamically by `student-report-modal.tsx`

These are no-ops — Vite bundles them statically regardless of the dynamic import attempt.

---

## Chunks Over 500 kB

| Chunk | Raw | Issue |
|-------|-----|-------|
| `index-Cotyy-yC.js` | 527 kB | Likely over-eager aggregation |
| `kanji-data-DYAMRgfF.js` | 523 kB | Acceptable (lazy, data-only) |

---

## Recommendations

### Priority 1 — Reduce Initial Load (High Impact)

**Firebase lazy init**: Defer Firebase initialization until after first render.
- Create a `firebase-init` module that only exports promises/observables
- Use `initializeApp` lazily in `use-auth` via dynamic import or deferred call
- Expected savings: removes ~443 kB (136 kB gzip) from critical path

### Priority 2 — Investigate `index-Cotyy-yC.js` (527 kB)

This unnamed chunk is the largest. Identify what's inside:
- Run `npx vite-bundle-visualizer` or `rollup-plugin-visualizer` to inspect
- Likely contains: i18n translations, shared hooks, contexts, utilities bundled together
- Target: break into separate lazy chunks per feature domain

### Priority 3 — Fix Dynamic Import Conflicts

For `classroom-firestore.ts` and `game-crud.ts`:
- Remove static imports from hooks that pull them in eagerly
- Use lazy service factories or dynamic imports consistently
- This will allow Vite to move these modules into lazy chunks

### Priority 4 — CSS Optimization

`cards-page` CSS at 256 kB raw (40 kB gzip) is very large. Since it's lazy-loaded with the page, impact is limited — but splitting into component-level CSS files would improve maintainability and allow partial loading.

### Priority 5 — jsPDF / pptxgen / jszip

| Library | Raw | Strategy |
|---------|-----|----------|
| `jspdf.es.min` | 385 kB | Already lazy (PDF export only) |
| `pptxgen.es` | 275 kB | Already lazy (PPTX export only) |
| `jszip.min` | 97 kB | Already lazy |

These are already in lazy chunks — no action needed unless export features can be further deferred.

---

## Summary Scorecard

| Metric | Status |
|--------|--------|
| All pages lazy-loaded | PASS (29/29) |
| Firebase code-split | FAIL (443 kB in critical path) |
| Kanji data code-split | PASS (523 kB lazy) |
| Initial load < 200 kB gzip | FAIL (~316 kB gzip) |
| Chunks over 500 kB | 2 (index + kanji-data) |
| Vite split warnings | 3 (no-op dynamic imports) |

---

## Unresolved Questions

1. What is in `index-Cotyy-yC.js` (527 kB)? Need bundle visualizer to confirm. It may include i18n JSON, shared service initializers, or aggregated re-exports.
2. Is `lib/i18n` (imported in `main.tsx`) loading large translation files synchronously? `import './lib/i18n'` is eager — if it bundles large locale files, that contributes to the main chunk.
3. Can Firebase Auth be deferred? Anonymous sign-in (`signInAnonymously`) is called immediately — this may be intentional for app boot, making full deferral non-trivial.
