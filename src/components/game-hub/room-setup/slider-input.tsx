import type { SliderConfig } from './types';

interface SliderInputProps {
  value: number;
  onChange: (v: number) => void;
  config: SliderConfig;
  label: string;
  icon?: React.ReactNode;
  suffix?: string;
}

export function SliderInput({
  value,
  onChange,
  config,
  label,
  icon,
  suffix = '',
}: SliderInputProps) {
  const percent = ((value - config.min) / (config.max - config.min)) * 100;

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
        {config.labels && (
          <div className="rm-slider-labels">
            {config.labels.map((lbl, i) => (
              <span key={i}>{lbl}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
