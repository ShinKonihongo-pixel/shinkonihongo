# Code Review: svg-charts-extended library

**Date:** 2026-03-25
**Reviewer:** code-reviewer agent

---

## Code Review Summary

### Scope
- Files reviewed: 4
  - `src/components/analytics/svg-charts-extended.tsx` (724 lines, 6 chart components)
  - `src/components/analytics/svg-charts-extended.css` (77 lines)
  - `src/components/analytics/index.ts` (41 lines)
  - `src/components/analytics/svg-charts.tsx` (first 50 lines, patterns only)
- Lines of code analyzed: ~892
- Review focus: New chart library — math correctness, type safety, animation performance, accessibility, consistency

### Overall Assessment

Solid implementation. Visual quality is high, TypeScript compiles without errors, SVG math is mostly correct. Three bugs of note: a broken CSS animation (`bubblePop`), a `gauge-arc` CSS animation that uses a hardcoded `stroke-dasharray: 500` that will mis-animate for short arcs, and a subtle `largeArc` sweep direction issue in GaugeChart. Accessibility is absent (consistent with the base library — neither has `role`/`aria-*`/`<title>`). No unused imports.

---

### Critical Issues

None.

---

### High Priority Findings

**1. `bubblePop` keyframe animates `r` — invalid in CSS (SVG `r` is a presentation attribute, not a CSS property in most browsers)**

File: `svg-charts-extended.css` lines 47–51

```css
@keyframes bubblePop {
  from { r: 0; opacity: 0; }   /* ← r: 0 is not a valid CSS property */
  50%  { opacity: 0.8; }
  to   { opacity: 1; }         /* ← missing r: <final-value> */
}
```

`r` on SVG `<circle>` is a geometric attribute. Chrome supports animating it via CSS since ~2019, but Firefox and Safari do not reliably treat it as a CSS-animatable property. The `to` keyframe also omits `r`, so the intended "pop from zero radius" effect won't work cross-browser. The base library uses `from { r: 0; opacity: 0; }` in `.chart-dot` (same pattern), so this is inherited, but still a bug.

**Fix:** Use SVG `<animate>` element (as already done for the gauge needle dot on line 382) or use `transform: scale(0)` / `scale(1)` with `transform-box: fill-box` (like the existing `.polar-slice` animation already does correctly).

---

**2. `gauge-arc` CSS hardcodes `stroke-dasharray: 500` — mismatches actual arc length at runtime**

File: `svg-charts-extended.css` lines 31–34

```css
.gauge-arc {
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: gaugeDraw 1.2s ...;
}
```

`R = 72`, sweep = 270°, so actual arc circumference = `2π × 72 × (270/360) ≈ 339px`. With `stroke-dasharray: 500`, the "draw" animation starts from an offset of 500 but the actual dash length is ~339, so the arc is **fully visible from frame 1** — no draw effect occurs at all.

The base library solves this correctly with a CSS custom property `var(--ring-circ)` set inline. The extended library's gauge omits this pattern.

**Fix (option A):** Set `stroke-dasharray` and `stroke-dashoffset` inline on the element to match the actual arc length, similar to how `svg-charts.tsx` handles `.ring-arc`.
**Fix (option B):** Use `stroke-dasharray: 340; stroke-dashoffset: 340;` in CSS (correct constant for this radius).

---

**3. GaugeChart: arc sweep direction may render incorrectly when `value` is near 0 or near 100**

File: `svg-charts-extended.tsx` lines 322–331

```ts
const sweepDeg = (clamped / 100) * totalSweep;
const largeArc = sweepDeg > 180 ? 1 : 0;
const valuePath = clamped > 0
  ? `M ${start.x},${start.y} A ${R},${R} 0 ${largeArc} 0 ${end.x},${end.y}`
  : '';
```

When `clamped` is exactly 100, `endAngle = startAngle - 270 = -45°`. `start` and `end` are nearly coincident points on the arc (225° and -45° map to nearly the same x,y on a circle when floating-point rounding is applied). SVG arcs between coincident (or near-coincident) points are undefined behavior — renderers typically draw nothing. `sweepDeg` would be 270 → `largeArc = 1`, correct, but the near-coincident point problem remains.

**Fix:** When `clamped >= 99.9`, use the `trackPath` (full arc) for the value arc, or nudge `endAngle` by a tiny epsilon to guarantee distinct points.

---

### Medium Priority Improvements

**4. `hexToRgb` defined inside the render function of HeatmapChart — re-created on every render**

File: `svg-charts-extended.tsx` lines 195–201

Pure utility with no dependencies on component state. Should be extracted to module scope, as `clamp` and `EmptyState` are.

**Fix:** Move above the `HeatmapChart` function definition.

---

**5. Duplicate module-level constants with the base library (`GRID_LINE`, `LABEL_COLOR`, `VALUE_COLOR`)**

File: `svg-charts-extended.tsx` lines 8–10 — identical values to `svg-charts.tsx` lines 15–17.

Minor DRY violation. Since these are internal style tokens, they could be exported from the base module and re-imported, or placed in a shared `chart-tokens.ts`. Low urgency given they are unlikely to diverge independently.

---

**6. `EmptyState` duplicated from base library**

File: `svg-charts-extended.tsx` lines 15–23 — identical implementation to `svg-charts.tsx` lines 45–52.

Same fix: export from base and import in extended.

---

**7. BubbleChart: `colorIdx` used to index `colors` array but sort re-orders `data` — label-to-color mapping may be unstable**

File: `svg-charts-extended.tsx` lines 484–511

```ts
{[...data].sort((a, b) => b.size - a.size).map((d, i) => {
  const colorIdx = i % colors.length;          // ← i is post-sort index
  const bubbleColor = d.color ?? colors[colorIdx];
  return (
    ...
    fill={d.color ? bubbleColor : `url(#bubble-grad-${colorIdx})`}  // ← uses post-sort i
```

The `<defs>` gradient IDs (`bubble-grad-0`, `bubble-grad-1`, …) are generated in the original `colors` array order (lines 444–449), but `colorIdx` after sorting is different. When `d.color` is undefined the fill uses `url(#bubble-grad-{i-after-sort})` — this references the wrong gradient. The visual result is just slightly wrong colors, not a crash.

**Fix:** Compute `colorIdx` from the original data index (pass it through `.map` before sorting), or use `d.color ?? colors[originalIndex % colors.length]` by attaching the original index before sorting.

---

**8. FunnelChart: drop-off text uses `−` (unicode minus) but renders outside the trapezoid boundary for wide funnels**

File: `svg-charts-extended.tsx` lines 593–602

`x={topRight + 8}` — `topRight` can be up to `(W + MAX_BAR_W) / 2 = (340 + 280) / 2 = 310`. With `W = 340`, this puts the text at `x = 318`, which is within the viewBox (340px), but only 22px from the right edge. With long percentage strings like "−100%" this clips.

**Fix:** Cap `x` at `W - 4` or right-align against the viewBox edge.

---

### Low Priority Suggestions

**9. No `will-change` property on animated elements**

Neither the base library nor the extended library uses `will-change`. For the gauge arc (1.2s draw) and waterfall bars (staggered), adding `will-change: stroke-dashoffset` / `will-change: transform` would hint the compositor to promote these layers. This is a micro-optimisation only relevant on low-powered devices; omitting it is acceptable for an internal analytics dashboard.

**10. GaugeChart: `maxWidth: 200` and PolarAreaChart: `maxWidth: 240` set inline but not documented in props**

Callers cannot override these constraints. If a parent layout needs a larger gauge, the chart silently refuses to scale. Consider exposing `maxWidth` as an optional prop or removing the constraint (the `viewBox` already preserves aspect ratio).

**11. Accessibility: no `role`, `aria-label`, or `<title>` on any SVG**

Consistent with the base library (both have zero accessibility attributes). For a teacher-facing analytics dashboard, WCAG 2.1 Level AA requires charts to convey their data to screen readers. At minimum, each `<svg>` should carry `role="img" aria-label="..."`. This is a systemic gap across both files.

**12. WaterfallChart: `allItems` typing inconsistency**

When `showTotal = false`, items are spread with `isTotal: false as const`. When `showTotal = true`, only the appended total item has `isTotal: true`. The `isTotal` check on line 118 uses `'isTotal' in d && d.isTotal` — this is safe but the conditional spread on line 61 (`items.map(it => ({ ...it, isTotal: false as const }))`) is unnecessary; TypeScript narrows correctly without it.

---

### Positive Observations

- SVG math for WaterfallChart (running total, y-scale, connector lines) is correct and handles negative values well.
- HeatmapChart's `hexToRgb` + opacity-based intensity is a clean approach to single-hue heat coloring.
- PolarAreaChart angle math is correct (radians, `-Math.PI/2` origin at top, clockwise sweep).
- Animation stagger delays (`i * 0.08s`) are a nice touch with no performance cost.
- `clamp(v / sMax * 18, 4, 22)` for bubble radius prevents degenerate zero-size bubbles.
- `index.ts` barrel exports are clean and complete — all 13 chart types and all prop types re-exported.
- TypeScript compilation: zero errors.
- `transform-box: fill-box` applied consistently on all scale/transform animations — correct practice for SVG.
- Guard `if (!data.length) return <EmptyState />` present on all 6 charts.

---

### Recommended Actions

1. **[High]** Fix `gauge-arc` CSS: set `stroke-dasharray` to ~339 (actual arc length) or use inline style/CSS var matching base pattern.
2. **[High]** Fix `bubblePop` animation: replace `r: 0` with `transform: scale(0)` + `transform-box: fill-box`.
3. **[High]** Fix GaugeChart value=100 edge case: use track path or epsilon offset.
4. **[Medium]** Fix BubbleChart color-index drift after sort: capture original index before sort.
5. **[Medium]** Extract `hexToRgb`, `GRID_LINE`, `LABEL_COLOR`, `VALUE_COLOR`, and `EmptyState` to module scope / shared module.
6. **[Low]** Cap FunnelChart drop-off label x-position to prevent near-edge clipping.
7. **[Low]** Add `role="img"` + `aria-label` to SVG roots (systemic gap, both libraries).

---

### Metrics

- Type Coverage: 100% explicit props interfaces for all 6 charts; no `any`
- TypeScript errors: 0
- Linting issues: 0 (tsc clean)
- Animation bugs: 2 confirmed (bubblePop `r` property, gauge-arc dasharray mismatch)
- Logic bugs: 2 confirmed (gauge value=100 edge case, bubble color-index drift)

---

### Unresolved Questions

- Should `CHART_COLORS`, `GRID_LINE`, `LABEL_COLOR`, `VALUE_COLOR`, `EmptyState`, and `smoothPath` be refactored into a shared `chart-utils.ts` to serve both files? This would require a minor coordinated refactor of both chart files.
- Is WCAG accessibility in scope for the analytics dashboard? If so, both `svg-charts.tsx` and `svg-charts-extended.tsx` need systematic `role`/`aria-label` additions.
