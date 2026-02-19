// Bingo Number Spinner — premium slot-machine style number animation

import { useState, useEffect, useRef } from 'react';

interface BingoNumberSpinnerProps {
  targetNumber: number;
  winnerName: string;
  onComplete: () => void;
}

const SPIN_DURATION = 3000; // 3 seconds total

export function BingoNumberSpinner({
  targetNumber,
  winnerName,
  onComplete,
}: BingoNumberSpinnerProps) {
  const [displayNumber, setDisplayNumber] = useState(Math.floor(Math.random() * 99) + 1);
  const [phase, setPhase] = useState<'flicker' | 'decelerate' | 'landed'>('flicker');
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed < 1500) {
        // Phase 1: Rapid flicker
        setPhase('flicker');
        setDisplayNumber(Math.floor(Math.random() * 99) + 1);
        animFrameRef.current = requestAnimationFrame(animate);
      } else if (elapsed < 2500) {
        // Phase 2: Decelerate — slow down updates
        setPhase('decelerate');
        const progress = (elapsed - 1500) / 1000; // 0 to 1
        const delay = 50 + progress * 200; // 50ms → 250ms

        setTimeout(() => {
          if (Date.now() - startTimeRef.current < 2500) {
            // Mix in target number more as we approach landing
            const useTarget = Math.random() < progress * 0.6;
            setDisplayNumber(useTarget ? targetNumber : Math.floor(Math.random() * 99) + 1);
            animFrameRef.current = requestAnimationFrame(animate);
          } else {
            // Land on target
            setDisplayNumber(targetNumber);
            setPhase('landed');
          }
        }, delay);
        return; // Don't requestAnimationFrame here — setTimeout handles it
      } else {
        // Phase 3: Landed
        setDisplayNumber(targetNumber);
        setPhase('landed');
        return;
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Auto-complete after spin duration
    const completeTimer = setTimeout(onComplete, SPIN_DURATION);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearTimeout(completeTimer);
    };
  }, [targetNumber, onComplete]);

  return (
    <div className="bingo-spinner-overlay">
      <div className="bingo-spinner-content">
        <div className="bingo-spinner-winner">
          {winnerName} trả lời đúng!
        </div>

        <div className={`bingo-spinner-ball ${phase}`}>
          <span className="bingo-spinner-number">
            {displayNumber.toString().padStart(2, '0')}
          </span>
        </div>

        {phase === 'landed' && (
          <div className="bingo-spinner-glow-burst" />
        )}

        {/* CSS-only particles */}
        {phase === 'landed' && (
          <div className="bingo-spinner-particles">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="bingo-particle" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
