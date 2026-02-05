import type { ToggleOption } from './types';

interface ToggleSwitchProps {
  option: ToggleOption;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ToggleSwitch({
  option,
  enabled,
  onChange,
}: ToggleSwitchProps) {
  return (
    <div className="rm-toggle-row">
      <div className="rm-toggle-info">
        {option.icon && <span className="rm-toggle-icon">{option.icon}</span>}
        <div className="rm-toggle-text">
          <span className="rm-toggle-label">{option.label}</span>
          {option.description && (
            <span className="rm-toggle-desc">{option.description}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        className={`rm-toggle-btn ${enabled ? 'active' : ''}`}
        onClick={() => onChange(!enabled)}
      />
    </div>
  );
}
