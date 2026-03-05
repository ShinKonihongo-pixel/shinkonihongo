// Kanji Drop custom setup section — level range picker for room creation

import { useState } from 'react';

interface KanjiDropCustomSetupProps {
  onChange: (levelStart: number, levelEnd: number) => void;
}

const LEVEL_PRESETS = [
  { label: 'Dễ (1-10)', start: 1, end: 10 },
  { label: 'Trung bình (11-30)', start: 11, end: 30 },
  { label: 'Khó (31-60)', start: 31, end: 60 },
  { label: 'Siêu khó (61-100)', start: 61, end: 100 },
] as const;

export function KanjiDropCustomSetup({ onChange }: KanjiDropCustomSetupProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [activePreset, setActivePreset] = useState(0);
  const [customStart, setCustomStart] = useState(1);
  const [customEnd, setCustomEnd] = useState(10);

  const handlePresetClick = (idx: number) => {
    setActivePreset(idx);
    setMode('preset');
    const p = LEVEL_PRESETS[idx];
    onChange(p.start, p.end);
  };

  const handleCustomChange = (start: number, end: number) => {
    const s = Math.max(1, Math.min(100, start));
    const e = Math.max(s, Math.min(100, end));
    setCustomStart(s);
    setCustomEnd(e);
    setMode('custom');
    onChange(s, e);
  };

  return (
    <div className="grs-section">
      <label className="grs-label">Phạm vi màn chơi</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {LEVEL_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className={`grs-option-btn ${mode === 'preset' && activePreset === idx ? 'selected' : ''}`}
            onClick={() => handlePresetClick(idx)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Tùy chỉnh:</span>
        <input
          type="number"
          min={1}
          max={100}
          value={mode === 'custom' ? customStart : LEVEL_PRESETS[activePreset].start}
          onChange={e => handleCustomChange(Number(e.target.value), mode === 'custom' ? customEnd : LEVEL_PRESETS[activePreset].end)}
          style={{
            width: '60px', padding: '0.4rem', borderRadius: '6px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', textAlign: 'center', fontSize: '0.85rem',
          }}
        />
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
        <input
          type="number"
          min={1}
          max={100}
          value={mode === 'custom' ? customEnd : LEVEL_PRESETS[activePreset].end}
          onChange={e => handleCustomChange(mode === 'custom' ? customStart : LEVEL_PRESETS[activePreset].start, Number(e.target.value))}
          style={{
            width: '60px', padding: '0.4rem', borderRadius: '6px',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'white', textAlign: 'center', fontSize: '0.85rem',
          }}
        />
      </div>
    </div>
  );
}
