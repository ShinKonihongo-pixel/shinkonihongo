// Kanji Drawing Canvas - HTML5 canvas for stroke drawing with morph animation
// After user releases a stroke, it morphs into the actual kanji SVG stroke
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { StrokeData, StrokeMatchResult } from '../../types/kanji-battle';

// --- Morph animation helpers ---

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

/** Sample dense points along SVG path (normalized 0-1 space) */
function sampleSVGPathDense(pathData: string, samplesPerCurve = 10): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const S = 109; // KanjiVG coordinate space
  const commands = pathData.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/g) || [];
  let cx = 0, cy = 0;

  for (const cmd of commands) {
    const type = cmd[0];
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    switch (type) {
      case 'M':
        cx = nums[0]; cy = nums[1];
        points.push({ x: cx / S, y: cy / S });
        break;
      case 'L':
        cx = nums[0]; cy = nums[1];
        points.push({ x: cx / S, y: cy / S });
        break;
      case 'C':
        for (let i = 0; i < nums.length; i += 6) {
          if (i + 5 >= nums.length) break;
          for (let j = 1; j <= samplesPerCurve; j++) {
            const t = j / samplesPerCurve;
            points.push({
              x: cubicBezier(t, cx, nums[i], nums[i + 2], nums[i + 4]) / S,
              y: cubicBezier(t, cy, nums[i + 1], nums[i + 3], nums[i + 5]) / S,
            });
          }
          cx = nums[i + 4]; cy = nums[i + 5];
        }
        break;
      case 'c':
        for (let i = 0; i < nums.length; i += 6) {
          if (i + 5 >= nums.length) break;
          const ax = cx, ay = cy;
          for (let j = 1; j <= samplesPerCurve; j++) {
            const t = j / samplesPerCurve;
            points.push({
              x: cubicBezier(t, ax, ax + nums[i], ax + nums[i + 2], ax + nums[i + 4]) / S,
              y: cubicBezier(t, ay, ay + nums[i + 1], ay + nums[i + 3], ay + nums[i + 5]) / S,
            });
          }
          cx += nums[i + 4]; cy += nums[i + 5];
        }
        break;
    }
  }
  return points;
}

/** Resample point array to fixed count with even arc-length spacing */
function resampleToCount(pts: { x: number; y: number }[], n: number): { x: number; y: number }[] {
  if (pts.length === 0) return Array(n).fill({ x: 0, y: 0 });
  if (pts.length === 1 || n < 2) return Array(n).fill(pts[0]);

  const dists = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = dists[dists.length - 1];
  if (total === 0) return Array(n).fill(pts[0]);

  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    let seg = 0;
    while (seg < dists.length - 2 && dists[seg + 1] < target) seg++;
    const segLen = dists[seg + 1] - dists[seg];
    const t = segLen > 0 ? (target - dists[seg]) / segLen : 0;
    result.push({
      x: pts[seg].x + t * (pts[seg + 1].x - pts[seg].x),
      y: pts[seg].y + t * (pts[seg + 1].y - pts[seg].y),
    });
  }
  return result;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const MORPH_SAMPLES = 30;
const MORPH_DURATION_MS = 280;

// --- Component ---

interface KanjiDrawingCanvasProps {
  kanjiCharacter: string;
  strokePaths: string[];
  currentStrokeIndex: number;
  onStrokeComplete: (stroke: StrokeData) => void;
  disabled?: boolean;
  strokeResults?: StrokeMatchResult[];
  size?: number;
}

export const KanjiDrawingCanvas: React.FC<KanjiDrawingCanvasProps> = ({
  kanjiCharacter,
  strokePaths,
  currentStrokeIndex,
  onStrokeComplete,
  disabled = false,
  strokeResults = [],
  size = 300,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const completedStrokesRef = useRef<{ x: number; y: number }[][]>([]);

  // Brush width matching kanji stroke thickness (like tracing over the kanji)
  const brushWidth = size / 109 * 5;

  // Morph animation refs
  const morphAnimRef = useRef<{
    fromPoints: { x: number; y: number }[];
    toPoints: { x: number; y: number }[];
    startTime: number;
  } | null>(null);
  const animFrameRef = useRef<number>(0);

  // Reset on new round
  useEffect(() => {
    if (currentStrokeIndex === 0) {
      completedStrokesRef.current = [];
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        morphAnimRef.current = null;
      }
    }
  }, [currentStrokeIndex]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Draw background: kanji reference, grid, SVG guides, completed user strokes
  const drawBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    // 1. Draw grid lines (dashed cross)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw kanji character as large faded reference (always visible)
    if (kanjiCharacter) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
      ctx.font = `${size * 0.78}px "Noto Sans JP", "Hiragino Kaku Gothic Pro", "Yu Gothic", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(kanjiCharacter, size / 2, size / 2 + size * 0.02);
      ctx.restore();
    }

    // 3. Draw SVG reference strokes (if available)
    if (strokePaths.length > 0) {
      const scale = size / 109;
      strokePaths.forEach((path, idx) => {
        if (idx < currentStrokeIndex) {
          // Already drawn - render as solid kanji stroke with result color
          const result = strokeResults[idx];
          ctx.strokeStyle = result?.isCorrect ? '#22c55e' : '#ef4444';
          ctx.lineWidth = brushWidth;
        } else if (idx === currentStrokeIndex) {
          // Current stroke - highlight guide
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.lineWidth = 7 * scale;
        } else {
          // Future strokes - very faded
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 3 * scale;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Parse and render SVG path
        const commands = path.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/g) || [];
        let cx = 0, cy = 0;
        ctx.beginPath();
        for (const cmd of commands) {
          const type = cmd[0];
          const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
          switch (type) {
            case 'M':
              cx = nums[0] * scale; cy = nums[1] * scale;
              ctx.moveTo(cx, cy);
              break;
            case 'L':
              cx = nums[0] * scale; cy = nums[1] * scale;
              ctx.lineTo(cx, cy);
              break;
            case 'C':
              for (let i = 0; i < nums.length; i += 6) {
                if (i + 5 < nums.length) {
                  ctx.bezierCurveTo(
                    nums[i] * scale, nums[i + 1] * scale,
                    nums[i + 2] * scale, nums[i + 3] * scale,
                    nums[i + 4] * scale, nums[i + 5] * scale
                  );
                  cx = nums[i + 4] * scale; cy = nums[i + 5] * scale;
                }
              }
              break;
            case 'c':
              for (let i = 0; i < nums.length; i += 6) {
                if (i + 5 < nums.length) {
                  ctx.bezierCurveTo(
                    cx + nums[i] * scale, cy + nums[i + 1] * scale,
                    cx + nums[i + 2] * scale, cy + nums[i + 3] * scale,
                    cx + nums[i + 4] * scale, cy + nums[i + 5] * scale
                  );
                  cx += nums[i + 4] * scale; cy += nums[i + 5] * scale;
                }
              }
              break;
          }
        }
        ctx.stroke();
      });
    }

    // 4. Draw completed user strokes with color feedback
    completedStrokesRef.current.forEach((points, idx) => {
      if (points.length < 2) return;
      const result = strokeResults[idx];
      ctx.strokeStyle = result ? (result.isCorrect ? '#22c55e' : '#ef4444') : '#6366f1';
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x * size, points[0].y * size);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * size, points[i].y * size);
      }
      ctx.stroke();
    });
  }, [kanjiCharacter, strokePaths, currentStrokeIndex, strokeResults, size, brushWidth]);

  // Keep latest drawBackground accessible for animation loop
  const drawBgRef = useRef(drawBackground);
  drawBgRef.current = drawBackground;

  // Redraw when background dependencies change (skip during morph - animation handles it)
  useEffect(() => {
    if (!morphAnimRef.current) drawBackground();
  }, [drawBackground]);

  // Redraw current in-progress stroke on top of background
  useEffect(() => {
    if (currentPoints.length < 2 || morphAnimRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground();

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x * size, currentPoints[0].y * size);
    for (let i = 1; i < currentPoints.length; i++) {
      ctx.lineTo(currentPoints[i].x * size, currentPoints[i].y * size);
    }
    ctx.stroke();
  }, [currentPoints, drawBackground, size]);

  // Start morph animation: user stroke → kanji SVG stroke
  const runMorphAnimation = useCallback(() => {
    const animate = (now: number) => {
      const anim = morphAnimRef.current;
      if (!anim) return;

      const elapsed = now - anim.startTime;
      const t = Math.min(1, elapsed / MORPH_DURATION_MS);
      const eased = easeOutCubic(t);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Redraw background layers
      drawBgRef.current();

      // Draw interpolated morphing stroke
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      const { fromPoints, toPoints } = anim;
      for (let i = 0; i < fromPoints.length; i++) {
        const x = (fromPoints[i].x + (toPoints[i].x - fromPoints[i].x) * eased) * size;
        const y = (fromPoints[i].y + (toPoints[i].y - fromPoints[i].y) * eased) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Morph complete - SVG guide layer (layer 3) renders the perfect bezier stroke
        morphAnimRef.current = null;
        drawBgRef.current();
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [size, brushWidth]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
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

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPoints([{ x: pos.x / size, y: pos.y / size }]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const pos = getPos(e);
    const newPoint = { x: pos.x / size, y: pos.y / size };
    setCurrentPoints(prev => [...prev, newPoint]);

    // Draw live stroke segment for immediate feedback
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (currentPoints.length >= 1) {
      const last = currentPoints[currentPoints.length - 1];
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = brushWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(last.x * size, last.y * size);
      ctx.lineTo(newPoint.x * size, newPoint.y * size);
      ctx.stroke();
    }
  };

  const handleEnd = () => {
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    if (currentPoints.length >= 2) {
      const svgPath = strokePaths[currentStrokeIndex];
      if (svgPath) {
        // Morph user stroke into the actual kanji SVG stroke
        const svgPts = sampleSVGPathDense(svgPath);
        const resampledUser = resampleToCount(currentPoints, MORPH_SAMPLES);
        const resampledSvg = resampleToCount(svgPts, MORPH_SAMPLES);

        morphAnimRef.current = {
          fromPoints: resampledUser,
          toPoints: resampledSvg,
          startTime: performance.now(),
        };
        runMorphAnimation();
      } else {
        // No SVG data - store raw user stroke as-is
        completedStrokesRef.current = [...completedStrokesRef.current, [...currentPoints]];
      }

      onStrokeComplete({
        points: currentPoints,
        timestamp: Date.now(),
      });
    }
    setCurrentPoints([]);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        style={{
          border: '2px solid #d1d5db',
          borderRadius: 12,
          background: '#fefefe',
          cursor: disabled ? 'not-allowed' : 'crosshair',
          touchAction: 'none',
          maxWidth: '100%',
          width: size,
          height: size,
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
};
