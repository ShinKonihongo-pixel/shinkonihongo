import type { SliderConfig } from './types';

interface SliderInputProps {
  value: number;
  onChange: (v: number) => void;
  config: SliderConfig;
  label: string;
  icon?: React.ReactNode;
  suffix?: string;
  /** Free-tier max limit — shows a visual marker on slider when set */
  freeMax?: number;
}

export function SliderInput({
  value,
  onChange,
  config,
  label,
  icon,
  suffix = '',
  freeMax,
}: SliderInputProps) {
  const percent = ((value - config.min) / (config.max - config.min)) * 100;
  const freeMaxPercent = freeMax != null
    ? ((freeMax - config.min) / (config.max - config.min)) * 100
    : undefined;

  return (
    <div className="rm-field">
      <label className="rm-label">
        {icon}
        <span>{label}</span>
        <span className="rm-label-hint">
          <span className="rm-label-value">{value}{suffix}</span>
        </span>
      </label>
      <div className="rm-slider-wrap">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rm-slider"
          style={{ '--progress': `${percent}%` } as React.CSSProperties}
        />
        {/* Free-tier limit marker */}
        {freeMaxPercent != null && freeMaxPercent < 100 && (
          <div
            className="rm-slider-free-max"
            style={{ left: `${freeMaxPercent}%` }}
            title={`Giới hạn miễn phí: ${freeMax}`}
          />
        )}
        {config.labels && (
          <div className="rm-slider-labels">
            {config.labels.map((lbl, i) => (
              <span key={i}>{lbl}</span>
            ))}
            {/* Show free-max label if not VIP */}
            {freeMax != null && !config.labels.includes(String(freeMax)) && (
              <span className="rm-slider-free-label" style={{ left: `${freeMaxPercent}%` }}>
                {freeMax}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
