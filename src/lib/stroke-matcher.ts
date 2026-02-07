// Stroke matching library for Kanji writing validation
import type { StrokeData, StrokeMatchResult } from '../types/kanji-battle';

interface Point {
  x: number;
  y: number;
}

// Resample a stroke to have a fixed number of points
function resampleStroke(points: Point[], numPoints: number): Point[] {
  if (points.length < 2) return points;

  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const dx = p.x - points[i - 1].x;
    const dy = p.y - points[i - 1].y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  if (totalLength === 0) return [points[0]];

  const interval = totalLength / (numPoints - 1);
  const resampled: Point[] = [points[0]];
  let accumulatedDist = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segmentDist = Math.sqrt(dx * dx + dy * dy);

    if (segmentDist === 0) continue;

    while (accumulatedDist + segmentDist >= interval && resampled.length < numPoints) {
      const t = (interval - accumulatedDist) / segmentDist;
      resampled.push({
        x: points[i - 1].x + t * dx,
        y: points[i - 1].y + t * dy,
      });
      accumulatedDist = 0;
    }
    accumulatedDist += segmentDist;
  }

  // Ensure we have exactly numPoints
  while (resampled.length < numPoints) {
    resampled.push(points[points.length - 1]);
  }

  return resampled.slice(0, numPoints);
}

// Calculate direction vector of a stroke
function getStrokeDirection(points: Point[]): Point {
  if (points.length < 2) return { x: 0, y: 0 };
  const first = points[0];
  const last = points[points.length - 1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

// Calculate distance between two points
function pointDistance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Parse SVG path to waypoints (simplified)
export function svgPathToPoints(pathData: string, canvasSize: number = 109): Point[] {
  const points: Point[] = [];
  // Simple M/L/C parser - SVG paths from KanjiVG are typically within 0-109 coordinate space
  const commands = pathData.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/g) || [];

  let cx = 0, cy = 0;

  for (const cmd of commands) {
    const type = cmd[0];
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

    switch (type) {
      case 'M':
        cx = nums[0]; cy = nums[1];
        points.push({ x: cx / canvasSize, y: cy / canvasSize });
        break;
      case 'L':
        cx = nums[0]; cy = nums[1];
        points.push({ x: cx / canvasSize, y: cy / canvasSize });
        break;
      case 'C':
        // Cubic bezier - sample at endpoint
        for (let i = 0; i < nums.length; i += 6) {
          if (i + 5 < nums.length) {
            cx = nums[i + 4]; cy = nums[i + 5];
            points.push({ x: cx / canvasSize, y: cy / canvasSize });
          }
        }
        break;
      case 'c': {
        // Relative cubic bezier
        for (let i = 0; i < nums.length; i += 6) {
          if (i + 5 < nums.length) {
            cx += nums[i + 4]; cy += nums[i + 5];
            points.push({ x: cx / canvasSize, y: cy / canvasSize });
          }
        }
        break;
      }
    }
  }

  return points;
}

// Match a user's drawn stroke against a reference stroke
export function matchStroke(
  userStroke: StrokeData,
  referencePath: string,
  tolerance: number = 0.15
): StrokeMatchResult & { accuracy: number } {
  const refPoints = svgPathToPoints(referencePath);
  if (refPoints.length < 2 || userStroke.points.length < 2) {
    return { strokeIndex: 0, isCorrect: false, accuracy: 0, directionMatch: false, orderCorrect: true };
  }

  const userPoints = userStroke.points.map(p => ({ x: p.x, y: p.y }));

  // Resample both to same number of points
  const numSamples = 20;
  const resampledUser = resampleStroke(userPoints, numSamples);
  const resampledRef = resampleStroke(refPoints, numSamples);

  // Calculate average distance between corresponding points
  let totalDist = 0;
  for (let i = 0; i < numSamples; i++) {
    totalDist += pointDistance(resampledUser[i], resampledRef[i]);
  }
  const avgDist = totalDist / numSamples;

  // Check direction match
  const userDir = getStrokeDirection(userPoints);
  const refDir = getStrokeDirection(refPoints);
  const dotProduct = userDir.x * refDir.x + userDir.y * refDir.y;
  const directionMatch = dotProduct > 0.3; // Allow some deviation

  // Calculate accuracy (0-100)
  const accuracy = Math.max(0, Math.min(100, (1 - avgDist / tolerance) * 100));
  const isCorrect = accuracy >= 40 && directionMatch;

  return {
    strokeIndex: 0,
    isCorrect,
    accuracy,
    directionMatch,
    orderCorrect: true,
  };
}

// Calculate overall drawing score
export function calculateDrawingScore(
  results: StrokeMatchResult[],
  totalStrokes: number,
  drawingTimeMs: number,
  timeLimitMs: number
): number {
  if (results.length === 0 || totalStrokes === 0) return 0;

  // Accuracy component (60% weight)
  const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
  const accuracyScore = avgAccuracy * 0.6;

  // Completeness component (25% weight) - how many strokes were attempted
  const completeness = Math.min(results.length / totalStrokes, 1);
  const completenessScore = completeness * 25;

  // Correct order component (15% weight)
  const orderCorrectCount = results.filter(r => r.orderCorrect).length;
  const orderScore = (orderCorrectCount / results.length) * 15;

  // Time bonus (up to 10% extra for fast completion)
  const timeRatio = Math.max(0, 1 - drawingTimeMs / timeLimitMs);
  const timeBonus = timeRatio * 10;

  return Math.min(100, Math.round(accuracyScore + completenessScore + orderScore + timeBonus));
}
