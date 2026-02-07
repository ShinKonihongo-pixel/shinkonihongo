// Kanji Drawing Canvas - HTML5 canvas for stroke drawing
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { StrokeData, StrokeMatchResult } from '../../types/kanji-battle';

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

  // Reset completed strokes when stroke index resets (new round)
  useEffect(() => {
    if (currentStrokeIndex === 0) {
      completedStrokesRef.current = [];
    }
  }, [currentStrokeIndex]);

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
          // Already drawn - show result color
          const result = strokeResults[idx];
          ctx.strokeStyle = result?.isCorrect ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 4 * scale;
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

  useEffect(() => {
    drawBackground();
  }, [drawBackground]);

  // Redraw current in-progress stroke on top of background
  useEffect(() => {
    if (currentPoints.length < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground();

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x * size, currentPoints[0].y * size);
    for (let i = 1; i < currentPoints.length; i++) {
      ctx.lineTo(currentPoints[i].x * size, currentPoints[i].y * size);
    }
    ctx.stroke();
  }, [currentPoints, drawBackground, size]);

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
      ctx.lineWidth = 3.5;
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
      // Save completed stroke for persistent display
      completedStrokesRef.current = [...completedStrokesRef.current, [...currentPoints]];
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
