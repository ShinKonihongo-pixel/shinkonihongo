// Radar/Spider chart for visualizing badge distribution
// Pure SVG implementation - no external dependencies

import { useMemo } from 'react';
import type { UserBadgeStats, BadgeType } from '../../types/friendship';
import { BADGE_DEFINITIONS } from '../../types/friendship';

interface BadgeRadarChartProps {
  stats: UserBadgeStats;
  size?: number;
}

// Calculate point position on the radar chart
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Create polygon points string for SVG
function createPolygonPoints(
  center: number,
  values: number[],
  maxValue: number,
  maxRadius: number
): string {
  const angleStep = 360 / values.length;
  return values
    .map((value, index) => {
      const normalizedValue = maxValue > 0 ? value / maxValue : 0;
      const radius = normalizedValue * maxRadius;
      const point = polarToCartesian(center, center, radius, index * angleStep);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

export function BadgeRadarChart({ stats, size = 420 }: BadgeRadarChartProps) {
  const center = size / 2;
  const maxRadius = (size / 2) - 60; // Leave space for larger labels
  const levels = 5; // Number of concentric circles

  // Get badge values in order
  const badgeData = useMemo(() => {
    return BADGE_DEFINITIONS.map(badge => ({
      type: badge.type,
      name: badge.name.replace('Chiến thần ', '').replace('Thiên thần ', ''),
      shortName: getShortName(badge.type),
      count: stats.receivedCounts[badge.type] || 0,
      color: badge.color,
      icon: badge.icon,
    }));
  }, [stats.receivedCounts]);

  // Find max value for scaling
  const maxValue = useMemo(() => {
    const max = Math.max(...badgeData.map(b => b.count), 1);
    // Round up to nearest nice number
    return Math.ceil(max / 5) * 5 || 5;
  }, [badgeData]);

  const values = badgeData.map(b => b.count);
  const angleStep = 360 / badgeData.length;

  // Generate grid lines (concentric polygons)
  const gridLevels = useMemo(() => {
    return Array.from({ length: levels }, (_, i) => {
      const radius = ((i + 1) / levels) * maxRadius;
      return badgeData.map((_, index) => {
        const point = polarToCartesian(center, center, radius, index * angleStep);
        return `${point.x},${point.y}`;
      }).join(' ');
    });
  }, [badgeData.length, maxRadius, center, angleStep]);

  // Generate axis lines
  const axisLines = useMemo(() => {
    return badgeData.map((_, index) => {
      const endPoint = polarToCartesian(center, center, maxRadius, index * angleStep);
      return { x2: endPoint.x, y2: endPoint.y };
    });
  }, [badgeData.length, maxRadius, center, angleStep]);

  // Generate label positions (larger offset for bigger shields)
  const labelPositions = useMemo(() => {
    return badgeData.map((badge, index) => {
      const point = polarToCartesian(center, center, maxRadius + 40, index * angleStep);
      return { ...badge, x: point.x, y: point.y, angle: index * angleStep };
    });
  }, [badgeData, maxRadius, center, angleStep]);

  // Data polygon points
  const dataPoints = createPolygonPoints(center, values, maxValue, maxRadius);

  // Calculate dot positions for data points
  const dotPositions = useMemo(() => {
    return values.map((value, index) => {
      const normalizedValue = maxValue > 0 ? value / maxValue : 0;
      const radius = normalizedValue * maxRadius;
      return polarToCartesian(center, center, radius, index * angleStep);
    });
  }, [values, maxValue, maxRadius, center, angleStep]);

  return (
    <div className="badge-radar-chart">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="radar-svg"
      >
        <defs>
          {/* Gradient for the data area */}
          <linearGradient id="dataGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.6" />
          </linearGradient>
          {/* Glow effect */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius}
          fill="var(--light)"
          stroke="var(--border)"
          strokeWidth="1"
        />

        {/* Grid levels (concentric polygons) */}
        {gridLevels.map((points, index) => (
          <polygon
            key={`grid-${index}`}
            points={points}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray={index < levels - 1 ? '4,4' : undefined}
            opacity={0.5}
          />
        ))}

        {/* Axis lines from center to each vertex */}
        {axisLines.map((line, index) => (
          <line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--border)"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* Data polygon (filled area) */}
        <polygon
          points={dataPoints}
          fill="url(#dataGradient)"
          stroke="var(--primary)"
          strokeWidth="2"
          filter="url(#glow)"
          className="data-polygon"
        />

        {/* Data points (dots) */}
        {dotPositions.map((pos, index) => (
          <g key={`dot-${index}`}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r="6"
              fill={badgeData[index].color}
              stroke="white"
              strokeWidth="2"
              className="data-dot"
            />
            {/* Value label on hover */}
            <title>{`${badgeData[index].name}: ${values[index]}`}</title>
          </g>
        ))}

        {/* Labels around the chart - Shield shaped badges */}
        {labelPositions.map((label, index) => {
          const isTop = label.angle < 180;
          const hasValue = values[index] > 0;
          const badgeColor = hasValue ? label.color : '#d1d5db';
          const badgeColorDark = hasValue ? adjustColorBrightness(label.color, -30) : '#9ca3af';
          // Shield size and position offset (2x larger)
          const shieldScale = 1.3;
          const shieldWidth = 28 * shieldScale;
          const shieldHeight = 32 * shieldScale;

          return (
            <g key={`label-${index}`} className="radar-label">
              {/* Shield badge background */}
              <g transform={`translate(${label.x - shieldWidth/2}, ${label.y - shieldHeight/2})`}>
                <defs>
                  <linearGradient id={`shield-grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={badgeColor} />
                    <stop offset="100%" stopColor={badgeColorDark} />
                  </linearGradient>
                </defs>
                <path
                  d={`M${14 * shieldScale} ${1 * shieldScale}
                      L${27 * shieldScale} ${7 * shieldScale}
                      V${19 * shieldScale}
                      C${27 * shieldScale} ${26 * shieldScale} ${19 * shieldScale} ${30 * shieldScale} ${14 * shieldScale} ${31.5 * shieldScale}
                      C${9 * shieldScale} ${30 * shieldScale} ${1 * shieldScale} ${26 * shieldScale} ${1 * shieldScale} ${19 * shieldScale}
                      V${7 * shieldScale}
                      L${14 * shieldScale} ${1 * shieldScale}Z`}
                  fill={`url(#shield-grad-${index})`}
                  stroke={badgeColorDark}
                  strokeWidth="1"
                  filter={hasValue ? 'url(#glow)' : undefined}
                  className={`radar-shield ${hasValue ? 'active' : 'inactive'}`}
                />
              </g>
              {/* Icon text on shield (2x larger) */}
              <text
                x={label.x}
                y={label.y + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="22"
                className="label-icon"
                style={{ filter: hasValue ? 'none' : 'grayscale(1) opacity(0.5)' }}
              >
                {label.icon}
              </text>
              {/* Label text below/above shield */}
              <text
                x={label.x}
                y={label.y + (isTop && label.angle !== 0 ? -28 : 28)}
                textAnchor="middle"
                dominantBaseline={isTop && label.angle !== 0 ? 'auto' : 'hanging'}
                fontSize="11"
                fill="var(--gray-dark)"
                fontWeight="500"
                className="label-text"
              >
                {label.shortName}
              </text>
            </g>
          );
        })}

        {/* Center value indicator */}
        <circle
          cx={center}
          cy={center}
          r="4"
          fill="var(--primary)"
        />
      </svg>

      {/* Scale legend */}
      <div className="radar-scale">
        <span className="scale-min">0</span>
        <span className="scale-max">{maxValue}</span>
      </div>
    </div>
  );
}

// Get shortened name for labels
function getShortName(type: BadgeType): string {
  const names: Record<BadgeType, string> = {
    kanji_champion: 'Kanji',
    vocab_champion: 'Từ vựng',
    grammar_champion: 'Ngữ pháp',
    kaiwa_champion: 'Kaiwa',
    listening_champion: 'Nghe',
    attendance_champion: 'Chuyên cần',
    reading_champion: 'Đọc hiểu',
    smart_champion: 'Thông minh',
    helpful_angel: 'Giúp đỡ',
  };
  return names[type] || type;
}

// Adjust color brightness
function adjustColorBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
