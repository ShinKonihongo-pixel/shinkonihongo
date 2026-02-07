// Kanji Battle Manager - Admin management screen
import React, { useState } from 'react';
import { DEFAULT_KANJI_BATTLE_SETTINGS, KANJI_BATTLE_SKILLS } from '../../types/kanji-battle';
import { getKanjiSeedCount } from '../../data/kanji-seed/index';
import type { JLPTLevel } from '../../types/kanji-battle';

interface KanjiBattleManagerProps {
  onClose: () => void;
}

const LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1', 'BT'];

export const KanjiBattleManager: React.FC<KanjiBattleManagerProps> = ({ onClose }) => {
  const [settings, setSettings] = useState(DEFAULT_KANJI_BATTLE_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const totalKanji = LEVELS.reduce((sum, level) => sum + getKanjiSeedCount(level), 0);

  return (
    <div className="speed-quiz-manager">
      <div className="manager-header">
        <button className="back-btn" onClick={onClose}>← Quay lại</button>
        <h2>⚔️ Quản Lý Đại Chiến Kanji</h2>
      </div>

      <div className="manager-content">
        {/* Kanji Stats */}
        <div className="manager-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">📚</span>
              <span className="stat-value">{totalKanji}</span>
              <span className="stat-label">Tổng Kanji</span>
            </div>
            {LEVELS.map(level => (
              <div key={level} className="stat-card">
                <span className="stat-icon">🏷️</span>
                <span className="stat-value">{getKanjiSeedCount(level)}</span>
                <span className="stat-label">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="manager-settings" style={{ marginTop: '1.5rem' }}>
          <h3>⚙️ Cài Đặt Mặc Định</h3>
          <div className="settings-form">
            <div className="form-group">
              <label>Số người chơi tối đa</label>
              <input type="number" value={settings.maxPlayers}
                onChange={e => setSettings({ ...settings, maxPlayers: Number(e.target.value) })} min={2} max={50} />
            </div>
            <div className="form-group">
              <label>Số câu hỏi mặc định</label>
              <input type="number" value={settings.totalRounds}
                onChange={e => setSettings({ ...settings, totalRounds: Number(e.target.value) })} min={5} max={50} />
            </div>
            <div className="form-group">
              <label>Thời gian mỗi câu (giây)</label>
              <input type="number" value={settings.timePerQuestion}
                onChange={e => setSettings({ ...settings, timePerQuestion: Number(e.target.value) })} min={5} max={60} />
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={settings.skillsEnabled}
                  onChange={e => setSettings({ ...settings, skillsEnabled: e.target.checked })} />
                <span>Bật kỹ năng đặc biệt</span>
              </label>
            </div>
          </div>

          <div className="skills-preview">
            <h4>✨ Danh sách kỹ năng</h4>
            <div className="skills-grid">
              {Object.values(KANJI_BATTLE_SKILLS).map(skill => (
                <div key={skill.type} className="skill-preview-card">
                  <span className="emoji">{skill.emoji}</span>
                  <span className="name">{skill.name}</span>
                  <span className="desc">{skill.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="settings-actions">
            <button className={`speed-quiz-btn primary ${saveStatus === 'saved' ? 'saved' : ''}`}
              onClick={handleSaveSettings} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? '⏳ Đang lưu...' : saveStatus === 'saved' ? '✅ Đã lưu!' : '💾 Lưu Cài Đặt'}
            </button>
            <button className="speed-quiz-btn secondary"
              onClick={() => setSettings(DEFAULT_KANJI_BATTLE_SETTINGS)}>
              🔄 Khôi Phục Mặc Định
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
