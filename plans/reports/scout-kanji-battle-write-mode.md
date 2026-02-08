# Kanji Battle Write Mode Architecture

## Overview

The Kanji Battle "write" mode allows players to draw kanji characters by stroke, with real-time stroke matching validation against reference SVG paths from KanjiVG.

---

## 1. Component Hierarchy

### Write Mode Flow
```
KanjiBattlePlay
├── KanjiBattlePlayWrite (orchestrator for write mode)
│   ├── KanjiDrawingCanvas (HTML5 canvas for stroke drawing)
│   └── PlayerLeaderboard (sidebar score display)
└── useStrokeDrawing (state management)
```

### File Locations
- **Orchestrator**: `/src/components/kanji-battle/kanji-battle-play.tsx`
- **Write Mode Component**: `/src/components/kanji-battle/kanji-battle-play-write.tsx`
- **Canvas Component**: `/src/components/kanji-battle/kanji-drawing-canvas.tsx`
- **Stroke Matching**: `/src/lib/stroke-matcher.ts`
- **Types**: `/src/types/kanji-battle.ts`
- **Hooks**: `/src/hooks/kanji-battle/use-stroke-drawing.ts`
- **Stroke Data**: `/src/data/kanjivg/index.ts`

---

## 2. How Strokes Are Drawn on Canvas

### KanjiDrawingCanvas Component (`kanji-drawing-canvas.tsx`)

**Canvas Layer Structure** (rendered in order):
1. **Grid layer** - Dashed center lines (horizontal & vertical)
2. **Kanji reference** - Large faded kanji character (~78% of canvas size, opacity 0.07)
3. **SVG guide strokes** - Color-coded reference strokes from KanjiVG:
   - **Current stroke** (blue, opacity 0.35): Highlighted for current drawing
   - **Completed strokes** (green/red, opacity 0.4/0.35): Shows if stroke was correct
   - **Future strokes** (very faded, opacity 0.05): Preview of upcoming strokes
4. **Completed user strokes** - Persistent color feedback:
   - Green (`#22c55e`): Correct stroke
   - Red (`#ef4444`): Incorrect stroke
   - Blue (`#6366f1`): Default for free-draw mode
5. **Current in-progress stroke** - Dark gray (`#1f2937`), rendered on top

**Canvas Properties**:
- Size: 300x300px (configurable via `size` prop)
- Touch-enabled: Supports both mouse and touch events
- Line rendering: `lineCap='round'`, `lineJoin='round'` for smooth curves
- Stroke width: 3.5px for user strokes, scaled for guides

**SVG Path Rendering Algorithm** (lines 88-130):
```
For each SVG path:
1. Parse commands: M (moveTo), L (lineTo), C (cubic bezier), c (relative bezier)
2. Parse numeric coordinates from path string
3. Scale coordinates: coordinate * (canvasSize / 109)
   - Note: KanjiVG uses 109x109 coordinate space
4. Apply appropriate context settings based on stroke index
5. Render path using canvas bezierCurveTo for smooth curves
```

**Coordinate System**:
- Normalized input: User strokes stored as 0-1 range (x, y)
- Canvas coordinates: Points multiplied by canvas size during rendering
- Scaling: `getPos()` method converts client coordinates to normalized (0-1) range

---

## 3. How Stroke Matching Works

### stroke-matcher.ts

**Main Function**: `matchStroke(userStroke, referencePath, tolerance = 0.15)`

**Matching Algorithm**:

1. **Parse Reference Path** → `svgPathToPoints()`
   - Extract SVG path coordinates
   - Normalize to 0-1 range (divide by canvasSize 109)
   - Result: Array of waypoints

2. **Resample Both Strokes** → `resampleStroke()`
   - Normalize user and reference to same number of points (20 samples)
   - Calculate stroke length using distance between consecutive points
   - Distribute sample points evenly along path
   - Ensures fair comparison regardless of drawing speed

3. **Calculate Distance Metric**
   - Point-by-point Euclidean distance: `sqrt((x2-x1)² + (y2-y1)²)`
   - Average distance across all 20 sample points
   - Lower distance = better match

4. **Check Direction Match**
   - Calculate direction vectors: `(end - start)` for both strokes
   - Normalize vectors
   - Compute dot product: `dotProduct > 0.3` threshold
   - Allows ~72° deviation from reference stroke direction

5. **Calculate Accuracy Score** (0-100)
   - Formula: `Math.max(0, Math.min(100, (1 - avgDist / tolerance) * 100))`
   - At tolerance (0.15): avgDist=0.15 → 0% accuracy
   - At 0: avgDist=0 → 100% accuracy
   - Linear interpolation between 0-tolerance range

6. **Final Validation**
   - `isCorrect = accuracy >= 40 && directionMatch`
   - Requires both distance and direction thresholds

**Return Object**:
```typescript
{
  strokeIndex: number,      // Index of stroke
  isCorrect: boolean,       // Pass/fail
  accuracy: number,         // 0-100 score
  directionMatch: boolean,  // Direction check passed
  orderCorrect: boolean     // Always true (order validation not implemented)
}
```

**Scoring Example**:
- Perfect match: avgDist=0 → accuracy=100%, isCorrect=true
- Good match: avgDist=0.08 → accuracy=47%, isCorrect=true
- Poor match: avgDist=0.20 → accuracy=0%, isCorrect=false

---

## 4. How Kanji Reference/Guide Strokes Are Rendered

### Reference Stroke Rendering (kanji-drawing-canvas.tsx, lines 66-131)

**Source Data**: `strokePaths: string[]` - Array of SVG path data

**Rendering Logic**:
```typescript
const scale = size / 109;  // Convert from KanjiVG coords to canvas

strokePaths.forEach((path, idx) => {
  if (idx < currentStrokeIndex) {
    // Already drawn - use result color
    color = result.isCorrect ? green(0.4) : red(0.35);
    lineWidth = 4 * scale;
  } else if (idx === currentStrokeIndex) {
    // Currently drawing - highlight
    color = blue(0.35);
    lineWidth = 7 * scale;  // Thicker for visibility
  } else {
    // Future strokes - very faded preview
    color = black(0.05);
    lineWidth = 3 * scale;
  }
  
  // Parse SVG and render
});
```

**SVG Command Parsing** (handles KanjiVG format):
- **M**: Move to (absolute)
- **L**: Line to (absolute)
- **C**: Cubic bezier (absolute) - samples endpoints
- **c**: Relative cubic bezier

**Fading Effect**:
- Creates visual hierarchy showing past, current, and future strokes
- Prevents visual clutter while providing guidance

---

## 5. Component Hierarchy & Data Flow

### State Management

**useStrokeDrawing Hook** (use-stroke-drawing.ts):
```typescript
{
  currentStrokeIndex: number,    // Which stroke to draw next (0-indexed)
  strokeResults: StrokeMatchResult[],  // Results for each completed stroke
  isComplete: boolean,           // All strokes finished
  totalStrokes: number,          // Expected stroke count
  handleStrokeComplete: (stroke) => void,  // Called when user completes stroke
  resetDrawing: () => void       // Reset for new round
}
```

**Flow**:
1. User draws on canvas
2. `onStrokeComplete` fires when user releases mouse/touch
3. Hook calls `matchStroke()` from stroke-matcher
4. Result stored in `strokeResults` array
5. `currentStrokeIndex` incremented
6. When `currentStrokeIndex >= totalStrokes`: set `isComplete=true`, call `onComplete(results, timeMs)`

**KanjiBattlePlayWrite Component Lifecycle**:
1. **Load stroke data** (useEffect)
   - `loadStrokeData(kanjiCharacter)` → `strokePaths`
2. **Initialize drawing hook**
   - `useStrokeDrawing({ strokePaths, ... })`
3. **Render canvas**
   - Pass `currentStrokeIndex`, `strokeResults`, `strokePaths`
4. **Submit results** (onComplete callback)
   - Pass stroke results and drawing time to parent

---

## 6. Key Files Summary

| File | Purpose | Key Exports |
|------|---------|------------|
| `kanji-battle-play-write.tsx` | Write mode orchestrator | Component |
| `kanji-drawing-canvas.tsx` | Canvas & stroke rendering | Component, rendering logic |
| `use-stroke-drawing.ts` | Stroke state & completion | Hook |
| `stroke-matcher.ts` | Stroke validation algorithm | `matchStroke()`, `calculateDrawingScore()` |
| `kanji-battle.ts` | Types & interfaces | `StrokeData`, `StrokeMatchResult`, etc |
| `kanjivg/index.ts` | SVG path data loading | `loadStrokeData()` |

---

## 7. Stroke Rendering Timeline

```
Canvas Init
  ↓
Draw Grid (faded cross)
  ↓
Draw Kanji Reference (very faded, opacity 0.07)
  ↓
Draw SVG Guide Strokes
  ├─ Past: colored by result (green/red)
  ├─ Current: blue highlight
  └─ Future: very faded preview
  ↓
Draw Completed User Strokes (green/red)
  ↓
[On MouseMove during drawing]
  Draw current stroke segment (dark gray)
  ↓
[On MouseUp]
  Save completed stroke points
  Match against reference
  Store result
  Redraw background with new result colors
```

---

## 8. Data Format: StrokeData

```typescript
interface StrokeData {
  points: { x: number; y: number }[];  // Normalized 0-1 coordinates
  timestamp: number                     // When stroke started
}
```

Example: User draws diagonal line
```
points: [
  { x: 0.2, y: 0.2 },
  { x: 0.25, y: 0.25 },
  { x: 0.3, y: 0.3 },
  ...
  { x: 0.8, y: 0.8 }
]
```

---

## 9. Drawing Score Calculation

**calculateDrawingScore()** (stroke-matcher.ts, lines 162-187):

```
Final Score = Accuracy (60%) + Completeness (25%) + Order (15%) + Time Bonus (0-10%)

Where:
  Accuracy = avg of all stroke accuracies * 60
  Completeness = (strokes_drawn / total_strokes) * 25
  Order = (correct_order_count / total_strokes) * 15
  Time Bonus = (1 - drawingTime/timeLimit) * 10  [up to 10% extra]

Max: 100 points
```

---

## 10. Canvas Event Handling

**Mouse/Touch Events**:
- `onMouseDown` / `onTouchStart`: Start new stroke
- `onMouseMove` / `onTouchMove`: Add point to current stroke + live redraw segment
- `onMouseUp` / `onMouseLeave` / `onTouchEnd`: End stroke, save to completed, trigger matching
- `touchAction: 'none'` prevents default touch scrolling

**Coordinate Conversion** (getPos):
```typescript
// Canvas bounding rect scaling
const rect = canvas.getBoundingClientRect();
const scaleX = canvasSize / rect.width;
const scaleY = canvasSize / rect.height;

// Touch support: get first touch point
if ('touches' in e) {
  return { 
    x: (e.touches[0].clientX - rect.left) * scaleX,
    y: (e.touches[0].clientY - rect.top) * scaleY
  };
}
```

---

## Key Implementation Details

### Stroke Persistence
- `completedStrokesRef` (useRef) maintains array of completed stroke points
- Resets when `currentStrokeIndex === 0` (new round)
- Survives React re-renders due to useRef

### SVG Path Parsing
- Handles KanjiVG 109x109 coordinate space
- Scales to canvas size: `coordinate * (size / 109)`
- Supports bezier curves for smooth stroke rendering

### Color Feedback System
- **Correct stroke**: Green (#22c55e)
- **Incorrect stroke**: Red (#ef4444)
- **In-progress**: Dark gray (#1f2937)
- **Current guide**: Blue (opacity 0.35)
- **Past guides**: Colored by result
- **Future guides**: Very faded (opacity 0.05)

### Free-Draw Mode
- When no SVG reference paths available: `accuracy=70, isCorrect=true`
- Fallback stroke count from question metadata

---

## Performance Considerations

1. **Caching**: Stroke data cached in-memory
2. **Resampling**: Limited to 20 points for consistent matching
3. **Live Segment Drawing**: Only draws new segment during mousemove
4. **Background Redraw**: Full redraw on completion, not on every move
5. **Normalized Coords**: 0-1 range avoids floating-point precision issues

