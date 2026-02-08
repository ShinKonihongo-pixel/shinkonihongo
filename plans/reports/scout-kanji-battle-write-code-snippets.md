# Kanji Battle Write Mode - Key Code Snippets

## 1. Canvas Drawing Layer Structure

### Background Rendering (kanji-drawing-canvas.tsx, lines 37-149)

```typescript
const drawBackground = useCallback(() => {
  const ctx = canvas.getContext('2d');

  // Layer 1: Grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2, size);      // Vertical line
  ctx.moveTo(0, size / 2);
  ctx.lineTo(size, size / 2);      // Horizontal line
  ctx.stroke();
  ctx.setLineDash([]);

  // Layer 2: Kanji reference (very faded)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';  // 7% opacity
  ctx.font = `${size * 0.78}px "Noto Sans JP"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(kanjiCharacter, size / 2, size / 2);

  // Layer 3: SVG guide strokes (color-coded)
  const scale = size / 109;  // KanjiVG coords are 109x109
  strokePaths.forEach((path, idx) => {
    if (idx < currentStrokeIndex) {
      // Past stroke - show result
      const result = strokeResults[idx];
      ctx.strokeStyle = result?.isCorrect
        ? 'rgba(34, 197, 94, 0.4)'    // Green
        : 'rgba(239, 68, 68, 0.35)';  // Red
      ctx.lineWidth = 4 * scale;
    } else if (idx === currentStrokeIndex) {
      // Current stroke - highlight
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';  // Blue
      ctx.lineWidth = 7 * scale;
    } else {
      // Future strokes - very faded
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 3 * scale;
    }

    // Parse and render SVG path...
  });

  // Layer 4: Completed user strokes (with result colors)
  completedStrokesRef.current.forEach((points, idx) => {
    const result = strokeResults[idx];
    ctx.strokeStyle = result?.isCorrect ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x * size, points[0].y * size);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x * size, points[i].y * size);
    }
    ctx.stroke();
  });
}, [kanjiCharacter, strokePaths, currentStrokeIndex, strokeResults, size]);
```

## 2. SVG Path Parsing and Rendering

### SVG Path Parser (kanji-drawing-canvas.tsx, lines 88-130)

```typescript
// Parse SVG path commands from KanjiVG format
const commands = path.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/g) || [];
let cx = 0, cy = 0;
ctx.beginPath();

for (const cmd of commands) {
  const type = cmd[0];
  const nums = cmd.slice(1).trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(n => !isNaN(n));

  switch (type) {
    case 'M':  // Move to (absolute)
      cx = nums[0] * scale;
      cy = nums[1] * scale;
      ctx.moveTo(cx, cy);
      break;

    case 'L':  // Line to (absolute)
      cx = nums[0] * scale;
      cy = nums[1] * scale;
      ctx.lineTo(cx, cy);
      break;

    case 'C':  // Cubic bezier (absolute)
      for (let i = 0; i < nums.length; i += 6) {
        if (i + 5 < nums.length) {
          ctx.bezierCurveTo(
            nums[i] * scale, nums[i + 1] * scale,
            nums[i + 2] * scale, nums[i + 3] * scale,
            nums[i + 4] * scale, nums[i + 5] * scale
          );
          cx = nums[i + 4] * scale;
          cy = nums[i + 5] * scale;
        }
      }
      break;

    case 'c':  // Cubic bezier (relative)
      for (let i = 0; i < nums.length; i += 6) {
        if (i + 5 < nums.length) {
          ctx.bezierCurveTo(
            cx + nums[i] * scale, cy + nums[i + 1] * scale,
            cx + nums[i + 2] * scale, cy + nums[i + 3] * scale,
            cx + nums[i + 4] * scale, cy + nums[i + 5] * scale
          );
          cx += nums[i + 4] * scale;
          cy += nums[i + 5] * scale;
        }
      }
      break;
  }
}
ctx.stroke();
```

## 3. Stroke Matching Algorithm

### Main Matching Function (stroke-matcher.ts, lines 118-159)

```typescript
export function matchStroke(
  userStroke: StrokeData,
  referencePath: string,
  tolerance: number = 0.15
): StrokeMatchResult & { accuracy: number } {
  // Step 1: Parse reference SVG path
  const refPoints = svgPathToPoints(referencePath);
  if (refPoints.length < 2 || userStroke.points.length < 2) {
    return { strokeIndex: 0, isCorrect: false, accuracy: 0, 
             directionMatch: false, orderCorrect: true };
  }

  const userPoints = userStroke.points.map(p => ({ x: p.x, y: p.y }));

  // Step 2: Resample both strokes to same number of points
  const numSamples = 20;
  const resampledUser = resampleStroke(userPoints, numSamples);
  const resampledRef = resampleStroke(refPoints, numSamples);

  // Step 3: Calculate average distance between sample points
  let totalDist = 0;
  for (let i = 0; i < numSamples; i++) {
    totalDist += pointDistance(resampledUser[i], resampledRef[i]);
  }
  const avgDist = totalDist / numSamples;

  // Step 4: Check direction match
  const userDir = getStrokeDirection(userPoints);
  const refDir = getStrokeDirection(refPoints);
  const dotProduct = userDir.x * refDir.x + userDir.y * refDir.y;
  const directionMatch = dotProduct > 0.3;  // ~72° deviation allowed

  // Step 5: Calculate accuracy score (0-100)
  // Linear interpolation: 0 at tolerance, 100 at 0
  const accuracy = Math.max(0, Math.min(100, (1 - avgDist / tolerance) * 100));

  // Step 6: Final validation
  const isCorrect = accuracy >= 40 && directionMatch;

  return {
    strokeIndex: 0,
    isCorrect,
    accuracy,
    directionMatch,
    orderCorrect: true,
  };
}
```

### Resample Algorithm (stroke-matcher.ts, lines 10-50)

```typescript
function resampleStroke(points: Point[], numPoints: number): Point[] {
  if (points.length < 2) return points;

  // Calculate total stroke length
  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x;
    const dy = p.y - points[i - 1].y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  if (totalLength === 0) return [points[0]];

  // Distribute points evenly by distance
  const interval = totalLength / (numPoints - 1);
  const resampled: Point[] = [points[0]];
  let accumulatedDist = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentDist = Math.sqrt(dx * dx + dy * dy);

    if (segmentDist === 0) continue;

    // Insert resampled points along this segment
    while (accumulatedDist + segmentDist >= interval 
           && resampled.length < numPoints) {
      const t = (interval - accumulatedDist) / segmentDist;
      resampled.push({
        x: points[i - 1].x + t * dx,
        y: points[i - 1].y + t * dy,
      });
      accumulatedDist = 0;
    }
    accumulatedDist += segmentDist;
  }

  // Ensure exactly numPoints
  while (resampled.length < numPoints) {
    resampled.push(points[points.length - 1]);
  }

  return resampled.slice(0, numPoints);
}
```

### Direction Vector Calculation (stroke-matcher.ts, lines 52-62)

```typescript
function getStrokeDirection(points: Point[]): Point {
  if (points.length < 2) return { x: 0, y: 0 };
  
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  
  // Normalize to unit vector
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  
  return { x: dx / len, y: dy / len };
}
```

## 4. Stroke Drawing Hook State Management

### useStrokeDrawing Hook (use-stroke-drawing.ts, lines 13-73)

```typescript
export function useStrokeDrawing({
  strokePaths,
  fallbackStrokeCount = 0,
  onComplete
}: UseStrokeDrawingProps) {
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [strokeResults, setStrokeResults] = useState<StrokeMatchResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const totalExpectedStrokes = strokePaths.length > 0 
    ? strokePaths.length 
    : fallbackStrokeCount;

  const handleStrokeComplete = useCallback((stroke: StrokeData) => {
    if (isComplete || currentStrokeIndex >= totalExpectedStrokes) return;

    let matchResult: StrokeMatchResult;

    if (strokePaths.length > 0 && currentStrokeIndex < strokePaths.length) {
      // Has SVG reference - do real matching
      const referencePath = strokePaths[currentStrokeIndex];
      const result = matchStroke(stroke, referencePath);
      matchResult = {
        ...result,
        strokeIndex: currentStrokeIndex,
        orderCorrect: true,
      };
    } else {
      // No reference - free draw mode
      matchResult = {
        strokeIndex: currentStrokeIndex,
        isCorrect: true,
        accuracy: 70,
        directionMatch: true,
        orderCorrect: true,
      };
    }

    const newResults = [...strokeResults, matchResult];
    setStrokeResults(newResults);

    const nextIndex = currentStrokeIndex + 1;
    setCurrentStrokeIndex(nextIndex);

    // Check if all strokes complete
    if (nextIndex >= totalExpectedStrokes) {
      setIsComplete(true);
      const drawingTimeMs = Date.now() - startTime;
      onComplete?.(newResults, drawingTimeMs);
    }
  }, [isComplete, currentStrokeIndex, totalExpectedStrokes, 
      strokePaths, strokeResults, startTime, onComplete]);

  const resetDrawing = useCallback(() => {
    setCurrentStrokeIndex(0);
    setStrokeResults([]);
    setIsComplete(false);
  }, []);

  return {
    currentStrokeIndex,
    strokeResults,
    isComplete,
    totalStrokes: totalExpectedStrokes,
    handleStrokeComplete,
    resetDrawing,
  };
}
```

## 5. Canvas Touch/Mouse Event Handling

### Event Handlers (kanji-drawing-canvas.tsx, lines 177-239)

```typescript
// Convert browser coordinates to normalized canvas coords (0-1)
const getPos = (e: React.MouseEvent | React.TouchEvent) => {
  const canvas = canvasRef.current!;
  const rect = canvas.getBoundingClientRect();
  const scaleX = size / rect.width;
  const scaleY = size / rect.height;

  if ('touches' in e) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

// Start stroke
const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
  if (disabled) return;
  e.preventDefault();
  setIsDrawing(true);
  const pos = getPos(e);
  setCurrentPoints([{ x: pos.x / size, y: pos.y / size }]);
};

// Continue stroke (on every move)
const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
  if (!isDrawing || disabled) return;
  e.preventDefault();
  
  const pos = getPos(e);
  const newPoint = { x: pos.x / size, y: pos.y / size };
  setCurrentPoints(prev => [...prev, newPoint]);

  // Live segment drawing for immediate feedback
  const ctx = canvas.getContext('2d');
  if (currentPoints.length >= 1) {
    const last = currentPoints[currentPoints.length - 1];
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x * size, last.y * size);
    ctx.lineTo(newPoint.x * size, newPoint.y * size);
    ctx.stroke();
  }
};

// End stroke
const handleEnd = () => {
  if (!isDrawing || disabled) return;
  setIsDrawing(false);
  
  if (currentPoints.length >= 2) {
    // Save completed stroke for persistent display
    completedStrokesRef.current = [...completedStrokesRef.current, [...currentPoints]];
    
    // Trigger matching
    onStrokeComplete({
      points: currentPoints,
      timestamp: Date.now(),
    });
  }
  setCurrentPoints([]);
};
```

## 6. Write Mode Component Integration

### KanjiBattlePlayWrite Main Component (kanji-battle-play-write.tsx)

```typescript
export const KanjiBattlePlayWrite: React.FC<KanjiBattlePlayWriteProps> = ({
  game,
  currentPlayerId,
  onSubmitDrawing,
  onUseHint,
  onSelectSkill,
  onNextRound,
}) => {
  // Load stroke data
  useEffect(() => {
    if (game.currentQuestion?.kanjiCharacter) {
      loadStrokeData(game.currentQuestion.kanjiCharacter).then(data => {
        setStrokePaths(data?.strokePaths || []);
      });
    }
  }, [game.currentQuestion?.kanjiCharacter]);

  // Initialize stroke drawing hook
  const { 
    currentStrokeIndex, 
    strokeResults, 
    isComplete, 
    totalStrokes, 
    handleStrokeComplete, 
    resetDrawing 
  } = useStrokeDrawing({
    strokePaths,
    fallbackStrokeCount: game.currentQuestion?.strokeCount || 0,
    onComplete: (results, drawingTimeMs) => {
      onSubmitDrawing(results, drawingTimeMs);
    },
  });

  return (
    <div className="speed-quiz-play playing-phase with-leaderboard">
      <div className="speed-quiz-main">
        {/* Question display */}
        {game.currentQuestion && (
          <div className="question-area">
            <div style={{ fontSize: '3.5rem', fontWeight: 700 }}>
              {game.currentQuestion.kanjiCharacter}
            </div>
            
            {/* Stroke counter and last result */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <span>Nét {currentStrokeIndex + 1}/{totalStrokes || game.currentQuestion.strokeCount}</span>
              {strokeResults.length > 0 && (
                <span style={{ 
                  color: strokeResults[strokeResults.length - 1].isCorrect 
                    ? '#22c55e' 
                    : '#ef4444' 
                }}>
                  {strokeResults[strokeResults.length - 1].isCorrect ? '✓' : '✗'}
                  {' '}{Math.round(strokeResults[strokeResults.length - 1].accuracy)}%
                </span>
              )}
            </div>

            {/* Canvas for drawing */}
            <KanjiDrawingCanvas
              kanjiCharacter={game.currentQuestion.kanjiCharacter}
              strokePaths={strokePaths}
              currentStrokeIndex={currentStrokeIndex}
              onStrokeComplete={handleStrokeComplete}
              disabled={currentPlayer?.hasAnswered || isComplete}
              strokeResults={strokeResults}
              size={300}
            />
          </div>
        )}
      </div>

      {/* Leaderboard sidebar */}
      <div className="speed-quiz-sidebar">
        <PlayerLeaderboard players={leaderboardPlayers} />
      </div>
    </div>
  );
};
```

## 7. Type Definitions

### Core Types (kanji-battle.ts)

```typescript
// Stroke data from user drawing
export interface StrokeData {
  points: { x: number; y: number }[];  // Normalized 0-1
  timestamp: number;
}

// Result of matching one user stroke against reference
export interface StrokeMatchResult {
  strokeIndex: number;
  isCorrect: boolean;
  accuracy: number;       // 0-100
  directionMatch: boolean;
  orderCorrect: boolean;
}

// Kanji question (with write mode fields)
export interface KanjiBattleQuestion {
  id: string;
  kanjiCharacter: string;
  strokeCount: number;
  strokePaths?: string[];  // SVG paths from KanjiVG
  // ... other fields
}

// Player state (with write mode fields)
export interface KanjiBattlePlayer {
  // ... other fields
  drawnStrokes?: StrokeData[];
  strokeScore?: number;       // 0-100
  drawingTimeMs?: number;
}
```

---

## 8. Drawing Score Calculation

### Score Formula (stroke-matcher.ts, lines 162-187)

```typescript
export function calculateDrawingScore(
  results: StrokeMatchResult[],
  totalStrokes: number,
  drawingTimeMs: number,
  timeLimitMs: number
): number {
  if (results.length === 0 || totalStrokes === 0) return 0;

  // Accuracy component (60% weight)
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) 
    / results.length;
  const accuracyScore = avgAccuracy * 0.6;

  // Completeness component (25% weight)
  const completeness = Math.min(results.length / totalStrokes, 1);
  const completenessScore = completeness * 25;

  // Correct order component (15% weight)
  const orderCorrectCount = results.filter(r => r.orderCorrect).length;
  const orderScore = (orderCorrectCount / results.length) * 15;

  // Time bonus (up to 10% extra)
  const timeRatio = Math.max(0, 1 - drawingTimeMs / timeLimitMs);
  const timeBonus = timeRatio * 10;

  return Math.min(100, Math.round(
    accuracyScore + completenessScore + orderScore + timeBonus
  ));
}
```

