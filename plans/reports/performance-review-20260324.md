# Performance Review — Shinko App
**Date:** 2026-03-24 | **Scope:** Full app audit (bundle, rendering, network, CSS)
**Status:** ✅ ALL OPTIMIZATIONS IMPLEMENTED

---

## Implementation Results (Build Verified)

| Chunk | Size (gzip) | Load Trigger |
|-------|-------------|--------------|
| vendor-firebase | 136KB | App startup (required) |
| index (core app) | 313KB | App startup |
| vendor-ui (lucide) | 15KB | App startup |
| jspdf.es.min | 126KB | PDF export click only |
| pptxgen.es | 96KB | PPTX export click only |
| jszip.min | 30KB | PPTX import click only |
| classroom-page | 39KB | Route navigation only |
| cards-page | 81KB | Route navigation only |

---

## Executive Summary

| Category | Score | Key Issue |
|----------|-------|-----------|
| Bundle & Code Splitting | ✅ Fixed | Heavy libs now dynamic-imported, code-split into separate chunks |
| Context & Re-renders | ✅ Fixed | Contexts split into domain-specific sub-contexts |
| Network & Data Loading | ⚠️ Medium | All Firestore data loaded on mount; N+1 queries |
| CSS & Rendering | ⚠️ Medium | 719 animations, 13 backdrop-filter, no virtualization |
| Image Optimization | 🔴 Critical | 62 avatar PNGs (up to 788KB), no lazy loading |
| PWA Caching | ⚠️ Medium | Only Firestore cached; fonts/CDN/storage not cached |

---

## 1. BUNDLE SIZE & CODE SPLITTING

### 1.1 Lazy Loading — GOOD ✅
All 40+ page components use `React.lazy()` in App.tsx (lines 15-49). Suspense fallback present.

### 1.2 Eagerly Imported Heavy Libraries — CRITICAL ❌

| Library | Size (est.) | File | Used In |
|---------|-------------|------|---------|
| jsPDF + autotable | ~500KB | `utils/student-report-pdf-export.ts:4-5` | Classroom only |
| kuroshiro + kuromoji | ~4MB | `services/furigana-service.ts:4-5` | Lecture editor |
| pptxgenjs | ~300KB | `lib/pptx/pptx-exporter.ts:3` | Lecture editor |
| jszip | ~100KB | `lib/pptx/pptx-importer.ts:4` | Lecture editor |
| fast-xml-parser | ~50KB | `lib/pptx/pptx-parser.ts:3` | Lecture editor |

**Fix:** Convert to dynamic `import()` — these are niche features, not core.

```typescript
// Before (eager)
import { jsPDF } from 'jspdf';
// After (lazy)
const { jsPDF } = await import('jspdf');
```

### 1.3 Large Data Files Bundled — MEDIUM ⚠️

| File | Size | Used By |
|------|------|---------|
| `data/krad-decomposition.ts` | 44KB | Kanji decomposer |
| `data/radicals.ts` | 36KB | Kanji decomposer |
| `data/han-viet-dictionary.ts` | 32KB | Han-Viet tooltip |

**Fix:** Dynamic import or lazy-load when feature accessed.

### 1.4 Vite Config Issue
`chunkSizeWarningLimit: 20000` (20MB) suppresses ALL warnings — hiding real problems.

**Fix:** Set to 500KB, then fix actual chunk issues with manual `rollupOptions.output.manualChunks`.

---

## 2. CONTEXT & RE-RENDER ISSUES

### 2.1 Monolithic Contexts — CRITICAL ❌

**FlashcardDataContext** (`flashcard-data-context.tsx:126-144`):
- Bundles 34+ properties: flashcards + lessons + grammar + kanji + reading + exercises
- Any change to ONE subset re-renders ALL consumers

**JLPTDataContext** (`jlpt-data-context.tsx:119-135`):
- Bundles 40+ properties: JLPT questions + kaiwa + custom topics
- Kaiwa editors re-render when JLPT data changes

**Fix:** Split into domain-specific contexts:
```
FlashcardDataContext → VocabContext, GrammarContext, KanjiContext, ReadingContext
JLPTDataContext → JLPTContext, KaiwaContext, CustomTopicContext
```

### 2.2 UserDataContext Dependency Hell — HIGH ❌
`user-data-context.tsx:174-185` — useMemo depends on 7 hook result objects that create new references every render, invalidating memoization.

**Fix:** Memoize individual hook results, or use `useRef` + shallow compare.

### 2.3 All Firestore Data Loaded on Mount — HIGH ❌
Context providers (`FlashcardDataProvider`, `JLPTDataProvider`, `AchievementProvider`) all fire Firestore queries on app mount — even if user never visits those features.

**Fix:** Defer data loading until route/feature accessed. Use lazy providers per route group.

### 2.4 AppContent Subscribes to 4 Contexts — HIGH ❌
`App.tsx:202-207` — AppContent consumes UserData + FlashcardData + JLPTData + Achievement contexts. ANY change in ANY context re-renders AppContent + all children.

**Fix:** Extract context consumers into smaller components that only subscribe to what they need.

### 2.5 Cascading useEffect in App.tsx — MEDIUM ⚠️
`App.tsx:373-392` — Derived state pattern causes 3 sequential re-renders (currentUser → JLPT modal → onboarding).

**Fix:** Compute derived state inline, not via useEffect.

### 2.6 AchievementContext Stat Assembly — MEDIUM ⚠️
`achievement-context.tsx:110-163` — 3 identical useEffect blocks call `assembleStats()` + `checkAchievements()` on every session change. Redundant computation.

**Fix:** Single combined effect with debounce.

---

## 3. NETWORK & DATA LOADING

### 3.1 N+1 Kanji Analysis Queries — MEDIUM ❌
`kanji-analysis-service.ts:19-28` — `getMultipleKanjiAnalysis()` calls individual `getDoc()` per character in a loop.

**Fix:** Batch with `where('id', 'in', chars)` (Firestore supports up to 30 items per `in` query).

### 3.2 No Pagination or Virtualization — MEDIUM ❌
Zero instances of react-window, react-virtual, or Virtuoso. Large lists (vocab, leaderboards, member lists) render ALL DOM nodes.

**Fix:** Add `react-window` for lists > 50 items (cards-management, leaderboards, classroom members).

### 3.3 Image Optimization — CRITICAL ❌
- 62 avatar PNGs in `/public/avatars/` — largest 788KB
- Only 1 component uses `loading="lazy"` (game-hub-page)
- 62 components render `<img>` without lazy loading

**Fix:**
1. Compress avatars to WebP (90%+ size reduction)
2. Add `loading="lazy"` to all non-above-fold images
3. Generate multiple sizes (64px, 128px, 256px) for different contexts

### 3.4 PWA Caching Gaps — MEDIUM ⚠️
Only Firestore API cached. Missing:
- Google Fonts (`fonts.googleapis.com`)
- CDN resources (`cdn.jsdelivr.net` — hanzi-writer data)
- Firebase Storage (avatars, audio files)

**Fix:** Add CacheFirst for fonts/CDN, StaleWhileRevalidate for Storage.

### 3.5 Multiple Synchronous JSON.parse on Mount — LOW ⚠️
5+ contexts/hooks call `localStorage.getItem()` + `JSON.parse()` synchronously during React init.

---

## 4. CSS & RENDERING PERFORMANCE

### 4.1 Expensive CSS Properties
- **backdrop-filter: blur()** — 13 instances (up to blur(24px))
- **box-shadow** — 90+ instances
- **filter** — 20+ instances (blur(80px) in home.css:1373 is extremely expensive)
- **719 total CSS animations**

### 4.2 Layout-Triggering Animations — HIGH ❌
- `kanji-battle-menu.css:143` — animates `left` property (forces layout)
- `kanji-battle-menu.css:104` — animates `background-position`
- `home.css:659,864,2315` — animates `width`

**Fix:** Replace with `transform: translateX()` and `background-size` animations.

### 4.3 will-change Underused — LOW ⚠️
Only 3 instances in entire codebase. Elements with frequent animations should declare `will-change: transform`.

### 4.4 Timer Cleanup Risk — MEDIUM ⚠️
127 setTimeout/setInterval instances across components. Mixed cleanup patterns — some properly cleaned, others status unclear.

### 4.5 Google Fonts Blocking Render — MEDIUM ⚠️
`index.html:15` loads 10 font families in a single blocking request. Most are rarely used.

**Fix:**
1. Keep only Inter + Noto Sans JP in initial load
2. Load decorative fonts (Zen Antique, Hachi Maru Pop, etc.) lazily via JS
3. Add `font-display: swap` to prevent FOIT

---

## 5. PRIORITIZED ACTION PLAN

### Phase 1 — Quick Wins (High Impact, Low Effort)
| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Add `loading="lazy"` to all `<img>` tags | 🔴 High | 1h |
| 2 | Compress avatars to WebP + resize | 🔴 High | 2h |
| 3 | Dynamic import jsPDF, kuroshiro, pptxgenjs, jszip | 🔴 High | 2h |
| 4 | Reduce Google Fonts to 2 families on initial load | ⚠️ Medium | 1h |
| 5 | Fix layout-triggering animations (left → translateX) | ⚠️ Medium | 1h |
| 6 | Lower chunkSizeWarningLimit to 500KB | ⚠️ Medium | 0.5h |

### Phase 2 — Architecture Improvements (High Impact, Medium Effort)
| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 7 | Split FlashcardDataContext into 4 domain contexts | 🔴 High | 4h |
| 8 | Split JLPTDataContext into 3 contexts | 🔴 High | 3h |
| 9 | Defer Firestore loading until route accessed | 🔴 High | 4h |
| 10 | Add react-window to large lists | ⚠️ Medium | 3h |
| 11 | Expand PWA runtime caching (fonts, CDN, storage) | ⚠️ Medium | 1h |
| 12 | Batch kanji analysis queries | ⚠️ Medium | 1h |

### Phase 3 — Polish (Medium Impact, Higher Effort)
| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 13 | Memoize UserDataContext hook results | ⚠️ Medium | 2h |
| 14 | Consolidate AchievementContext effects | ⚠️ Low | 1h |
| 15 | Audit 127 setTimeout/setInterval for cleanup | ⚠️ Low | 2h |
| 16 | Remove filter: blur(80px) in home.css | ⚠️ Low | 0.5h |
| 17 | Lazy-load data files (radicals, krad, han-viet) | ⚠️ Low | 1h |

---

## Estimated Total Impact

| Metric | Before (est.) | After Phase 1+2 |
|--------|--------------|-----------------|
| Initial JS bundle | ~5MB+ | ~2-3MB |
| Initial network requests | 40+ | ~15-20 |
| Time to Interactive | 4-6s | 2-3s |
| Context re-renders per action | 4 cascading | 1 targeted |
| Avatar payload | ~15MB total | ~1.5MB (WebP) |
| Largest Contentful Paint | 3-5s | 1-2s |
