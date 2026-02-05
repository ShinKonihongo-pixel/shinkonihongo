// Volume control with presets

import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { VOLUME_PRESETS } from './types';

interface VolumeControlProps {
  volume: number;
  enabled: boolean;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMute: () => void;
  onSetVolume: (volume: number) => void;
}

export function VolumeControl({
  volume,
  enabled,
  onVolumeChange,
  onToggleMute,
  onSetVolume,
}: VolumeControlProps) {
  const VolumeIcon = volume === 0 || !enabled
    ? VolumeX
    : volume < 50
      ? Volume1
      : Volume2;

  const effectiveVolume = enabled ? volume : 0;

  return (
    <>
      {/* Volume Control - Enhanced */}
      <div className="fp-volume">
        <button
          className="fp-btn fp-btn-mini"
          onClick={onToggleMute}
          title={enabled ? 'Tắt tiếng (Ctrl+M)' : 'Bật tiếng (Ctrl+M)'}
        >
          <VolumeIcon size={16} />
        </button>
        <div className="fp-volume-track">
          <input
            type="range"
            min="0"
            max="100"
            value={effectiveVolume}
            onChange={onVolumeChange}
            className="fp-volume-slider"
          />
          <div
            className="fp-volume-fill"
            style={{ width: `${effectiveVolume}%` }}
          />
        </div>
        <span className="fp-volume-value">{effectiveVolume}%</span>
      </div>

      {/* Quick volume presets */}
      <div className="fp-volume-presets">
        {VOLUME_PRESETS.map(preset => (
          <button
            key={preset.value}
            className={`fp-preset-btn ${volume === preset.value ? 'active' : ''}`}
            onClick={() => onSetVolume(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </>
  );
}
