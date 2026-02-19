// Golden Bell Skill Management Settings
// Toggle skills, set skill interval, enable/disable individual skills

import { useState, useCallback } from 'react';
import { Sparkles, ToggleLeft, ToggleRight } from 'lucide-react';
import type { GoldenBellSkillType } from '../../../types/golden-bell';
import { ALL_GOLDEN_BELL_SKILLS, GOLDEN_BELL_SOLO_SKILLS, GOLDEN_BELL_TEAM_SKILLS } from '../../../types/golden-bell';

interface SkillSettings {
  enabled: boolean;
  interval: number;
  enabledSkills: GoldenBellSkillType[];
}

const DEFAULT_SETTINGS: SkillSettings = {
  enabled: true,
  interval: 5,
  enabledSkills: Object.keys(ALL_GOLDEN_BELL_SKILLS) as GoldenBellSkillType[],
};

export function GameSettingsGoldenBellSkills() {
  const [settings, setSettings] = useState<SkillSettings>(() => {
    try {
      const saved = localStorage.getItem('gb_skill_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const save = useCallback((newSettings: SkillSettings) => {
    setSettings(newSettings);
    localStorage.setItem('gb_skill_settings', JSON.stringify(newSettings));
  }, []);

  const toggleEnabled = useCallback(() => {
    save({ ...settings, enabled: !settings.enabled });
  }, [settings, save]);

  const setInterval = useCallback((val: number) => {
    save({ ...settings, interval: val });
  }, [settings, save]);

  const toggleSkill = useCallback((type: GoldenBellSkillType) => {
    const current = settings.enabledSkills;
    const newSkills = current.includes(type)
      ? current.filter(s => s !== type)
      : [...current, type];
    save({ ...settings, enabledSkills: newSkills });
  }, [settings, save]);

  return (
    <div className="gb-settings-section">
      <div className="gb-settings-header">
        <Sparkles size={20} />
        <h3>Kỹ Năng Đặc Biệt</h3>
      </div>

      {/* Master toggle */}
      <div className="gb-skill-toggle-row" onClick={toggleEnabled}>
        <div className="gb-skill-toggle-info">
          <span className="gb-skill-toggle-label">Bật kỹ năng</span>
          <span className="gb-skill-toggle-desc">Vòng quay kỹ năng trong game</span>
        </div>
        {settings.enabled
          ? <ToggleRight size={28} className="gb-toggle-on" />
          : <ToggleLeft size={28} className="gb-toggle-off" />}
      </div>

      {settings.enabled && (
        <>
          {/* Interval slider */}
          <div className="gb-skill-interval">
            <label>Kỹ năng xuất hiện sau mỗi</label>
            <div className="gb-skill-interval-row">
              <input
                type="range"
                min={3}
                max={10}
                step={1}
                value={settings.interval}
                onChange={e => setInterval(Number(e.target.value))}
              />
              <span className="gb-skill-interval-value">{settings.interval} câu</span>
            </div>
          </div>

          {/* Solo skills */}
          <div className="gb-skill-group">
            <h4>Solo</h4>
            {Object.values(GOLDEN_BELL_SOLO_SKILLS).map(skill => (
              <div
                key={skill.type}
                className={`gb-skill-item-row ${settings.enabledSkills.includes(skill.type) ? 'active' : ''}`}
                onClick={() => toggleSkill(skill.type)}
              >
                <span className="gb-skill-item-emoji">{skill.emoji}</span>
                <div className="gb-skill-item-info">
                  <span className="gb-skill-item-name">{skill.name}</span>
                  <span className="gb-skill-item-desc">{skill.description}</span>
                </div>
                <div className={`gb-skill-check ${settings.enabledSkills.includes(skill.type) ? 'checked' : ''}`} />
              </div>
            ))}
          </div>

          {/* Team skills */}
          <div className="gb-skill-group">
            <h4>Đội</h4>
            {Object.values(GOLDEN_BELL_TEAM_SKILLS).map(skill => (
              <div
                key={skill.type}
                className={`gb-skill-item-row ${settings.enabledSkills.includes(skill.type) ? 'active' : ''}`}
                onClick={() => toggleSkill(skill.type)}
              >
                <span className="gb-skill-item-emoji">{skill.emoji}</span>
                <div className="gb-skill-item-info">
                  <span className="gb-skill-item-name">{skill.name}</span>
                  <span className="gb-skill-item-desc">{skill.description}</span>
                </div>
                <div className={`gb-skill-check ${settings.enabledSkills.includes(skill.type) ? 'checked' : ''}`} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
