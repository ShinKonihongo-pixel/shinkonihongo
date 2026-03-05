// Golden Bell Skill Spin Wheel
// Animated circular wheel that visually spins to a predetermined result

import { useState, useCallback, useRef, useEffect } from 'react';
import type { GoldenBellSkill } from '../../types/golden-bell';

interface SkillSpinWheelProps {
  skills: GoldenBellSkill[];
  onResult: (skill: GoldenBellSkill) => void;
  isSpinning: boolean;
  disabled?: boolean;
}

// Wheel segment colors
const SEGMENT_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7',
  '#f97316', '#06b6d4', '#ec4899',
];

export function SkillSpinWheel({ skills, onResult, isSpinning: externalSpinning, disabled }: SkillSpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<GoldenBellSkill | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const resultTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const segmentAngle = 360 / skills.length;

  const spin = useCallback(() => {
    if (spinning || disabled || skills.length === 0) return;

    // Predetermine result
    const resultIdx = Math.floor(Math.random() * skills.length);
    const resultSkill = skills[resultIdx];

    // Calculate target rotation: multiple full spins + land on result segment
    const targetSegmentCenter = resultIdx * segmentAngle + segmentAngle / 2;
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const targetRotation = rotation + (extraSpins * 360) + (360 - targetSegmentCenter);

    setSpinning(true);
    setResult(null);
    setRotation(targetRotation);

    // Reveal result after animation
    resultTimerRef.current = setTimeout(() => {
      setSpinning(false);
      setResult(resultSkill);
      onResult(resultSkill);
    }, 3500);
  }, [spinning, disabled, skills, segmentAngle, rotation, onResult]);

  // Auto-spin if externally triggered
  useEffect(() => {
    if (externalSpinning && !spinning && !result) {
      spin();
    }
  }, [externalSpinning, spinning, result, spin]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  if (skills.length === 0) return null;

  return (
    <div className="gb-spin-wheel-container">
      {/* Pointer */}
      <div className="gb-spin-pointer">▼</div>

      {/* Wheel */}
      <div
        ref={wheelRef}
        className={`gb-spin-wheel ${spinning ? 'spinning' : ''}`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
            : 'none',
        }}
      >
        {skills.map((skill, i) => {
          const startAngle = i * segmentAngle;
          const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

          return (
            <div
              key={skill.type}
              className="gb-spin-segment"
              style={{
                transform: `rotate(${startAngle}deg)`,
                clipPath: skills.length <= 2
                  ? `polygon(50% 50%, 50% 0%, ${i === 0 ? '100% 0%, 100% 100%, 50% 100%' : '0% 0%, 0% 100%, 50% 100%'})`
                  : undefined,
              }}
            >
              <div
                className="gb-spin-segment-fill"
                style={{
                  background: `conic-gradient(${color} 0deg, ${color} ${segmentAngle}deg, transparent ${segmentAngle}deg)`,
                  transform: `rotate(0deg)`,
                }}
              />
              <span
                className="gb-spin-segment-label"
                style={{
                  transform: `rotate(${segmentAngle / 2}deg) translateY(-65px)`,
                }}
              >
                <span className="gb-spin-emoji">{skill.emoji}</span>
              </span>
            </div>
          );
        })}
        <div className="gb-spin-center">🔔</div>
      </div>

      {/* Spin button */}
      {!spinning && !result && (
        <button className="gb-spin-btn" onClick={spin} disabled={disabled}>
          Quay!
        </button>
      )}

      {/* Result card */}
      {result && (
        <div className="gb-skill-result">
          <span className="gb-skill-result-emoji">{result.emoji}</span>
          <span className="gb-skill-result-name">{result.name}</span>
          <span className="gb-skill-result-desc">{result.description}</span>
        </div>
      )}
    </div>
  );
}
