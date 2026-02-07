// Stroke drawing state management for write mode

import { useState, useCallback } from 'react';
import type { StrokeData, StrokeMatchResult } from '../../types/kanji-battle';
import { matchStroke } from '../../lib/stroke-matcher';

interface UseStrokeDrawingProps {
  strokePaths: string[];
  fallbackStrokeCount?: number;
  onComplete?: (results: StrokeMatchResult[], drawingTimeMs: number) => void;
}

export function useStrokeDrawing({ strokePaths, fallbackStrokeCount = 0, onComplete }: UseStrokeDrawingProps) {
  const [currentStrokeIndex, setCurrentStrokeIndex] = useState(0);
  const [strokeResults, setStrokeResults] = useState<StrokeMatchResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const totalExpectedStrokes = strokePaths.length > 0 ? strokePaths.length : fallbackStrokeCount;

  const handleStrokeComplete = useCallback((stroke: StrokeData) => {
    if (isComplete || currentStrokeIndex >= totalExpectedStrokes) return;

    let matchResult: StrokeMatchResult;

    if (strokePaths.length > 0 && currentStrokeIndex < strokePaths.length) {
      // Has SVG reference path - do actual matching
      const referencePath = strokePaths[currentStrokeIndex];
      const result = matchStroke(stroke, referencePath);
      matchResult = {
        ...result,
        strokeIndex: currentStrokeIndex,
        orderCorrect: true,
      };
    } else {
      // No reference path - free draw mode, accept stroke with default score
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

    if (nextIndex >= totalExpectedStrokes) {
      setIsComplete(true);
      const drawingTimeMs = Date.now() - startTime;
      onComplete?.(newResults, drawingTimeMs);
    }
  }, [isComplete, currentStrokeIndex, totalExpectedStrokes, strokePaths, strokeResults, startTime, onComplete]);

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
