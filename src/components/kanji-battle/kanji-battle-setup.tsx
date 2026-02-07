// Kanji Battle Setup - Mode selection + JLPT level selection + room config
import { useState } from 'react';
import type { CreateKanjiBattleData, KanjiBattleMode, JLPTLevel } from '../../types/kanji-battle';
import { getKanjiSeedCount } from '../../data/kanji-seed/index';

const JLPT_LEVELS: { level: JLPTLevel; label: string; color: string }[] = [
  { level: 'N5', label: 'N5', color: '#22c55e' },
  { level: 'N4', label: 'N4', color: '#3b82f6' },
  { level: 'N3', label: 'N3', color: '#f59e0b' },
  { level: 'N2', label: 'N2', color: '#ef4444' },
  { level: 'N1', label: 'N1', color: '#8b5cf6' },
  { level: 'BT', label: 'BT', color: '#6366f1' },
];

interface KanjiBattleSetupProps {
  onCreateGame: (data: CreateKanjiBattleData) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function KanjiBattleSetup({
  onCreateGame,
  onBack,
  loading = false,
  error,
}: KanjiBattleSetupProps) {
  const [title, setTitle] = useState('Đại Chiến Kanji');
  const [gameMode, setGameMode] = useState<KanjiBattleMode>('read');
  const [selectedLevels, setSelectedLevels] = useState<JLPTLevel[]>(['N5']);
  const [totalRounds, setTotalRounds] = useState(15);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [skillsEnabled, setSkillsEnabled] = useState(true);

  const toggleLevel = (level: JLPTLevel) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(l => l !== level);
      }
      return [...prev, level];
    });
  };

  const totalKanji = selectedLevels.reduce((sum, level) => sum + getKanjiSeedCount(level), 0);

  const handleCreate = () => {
    onCreateGame({
      title,
      totalRounds,
      timePerQuestion,
      maxPlayers,
      skillsEnabled,
      gameMode,
      selectedLevels,
    });
  };

  return (
    <div className="speed-quiz-setup" style={{ maxWidth: 500, margin: '0 auto', padding: '1.5rem' }}>
      <button className="speed-quiz-back-btn" onClick={onBack} style={{ marginBottom: '1rem' }}>
        ← Quay lại
      </button>

      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>⚔️ Tạo Phòng Đại Chiến Kanji</h2>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Tên phòng</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={30}
          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '1rem' }}
        />
      </div>

      {/* Game Mode Toggle */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Chế độ chơi</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setGameMode('read')}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: 12, border: '2px solid',
              borderColor: gameMode === 'read' ? '#FF5722' : '#d1d5db',
              background: gameMode === 'read' ? '#FFF3E0' : '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
            }}
          >
            📖 Đọc Kanji
            <div style={{ fontSize: '0.75rem', fontWeight: 400, marginTop: 4, opacity: 0.7 }}>
              Gõ nghĩa / cách đọc
            </div>
          </button>
          <button
            onClick={() => {
              setGameMode('write');
              setTimePerQuestion(30); // More time for writing
            }}
            style={{
              flex: 1, padding: '0.75rem', borderRadius: 12, border: '2px solid',
              borderColor: gameMode === 'write' ? '#FF5722' : '#d1d5db',
              background: gameMode === 'write' ? '#FFF3E0' : '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
            }}
          >
            ✍️ Viết Kanji
            <div style={{ fontSize: '0.75rem', fontWeight: 400, marginTop: 4, opacity: 0.7 }}>
              Vẽ theo thứ tự nét
            </div>
          </button>
        </div>
      </div>

      {/* JLPT Level Selection */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
          Cấp độ JLPT <span style={{ fontWeight: 400, color: '#6b7280' }}>({totalKanji} kanji)</span>
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {JLPT_LEVELS.map(({ level, label, color }) => {
            const isSelected = selectedLevels.includes(level);
            const count = getKanjiSeedCount(level);
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 20, border: '2px solid',
                  borderColor: isSelected ? color : '#d1d5db',
                  background: isSelected ? `${color}15` : '#fff',
                  color: isSelected ? color : '#6b7280',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                  transition: 'all 0.15s ease',
                }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Rounds */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          Số câu hỏi: <span style={{ color: '#FF5722' }}>{totalRounds}</span>
        </label>
        <input
          type="range" min={5} max={Math.min(30, totalKanji)} step={5} value={totalRounds}
          onChange={(e) => setTotalRounds(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af' }}>
          <span>5</span><span>{Math.min(30, totalKanji)}</span>
        </div>
      </div>

      {/* Time per question */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          Thời gian mỗi câu: <span style={{ color: '#FF5722' }}>{timePerQuestion}s</span>
        </label>
        <input
          type="range" min={gameMode === 'write' ? 15 : 5} max={gameMode === 'write' ? 60 : 30}
          step={5} value={timePerQuestion}
          onChange={(e) => setTimePerQuestion(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Max Players */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          Số người chơi tối đa: <span style={{ color: '#FF5722' }}>{maxPlayers}</span>
        </label>
        <input
          type="range" min={2} max={20} step={1} value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Skills Toggle */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox" id="skills-toggle" checked={skillsEnabled}
          onChange={(e) => setSkillsEnabled(e.target.checked)}
        />
        <label htmlFor="skills-toggle" style={{ fontWeight: 600 }}>✨ Bật kỹ năng đặc biệt</label>
      </div>

      {/* Create Button */}
      <button
        className="speed-quiz-btn primary large"
        onClick={handleCreate}
        disabled={loading || totalKanji < 5}
        style={{ width: '100%', padding: '0.875rem', fontSize: '1.1rem' }}
      >
        {loading ? '⏳ Đang tạo...' : '🚀 Tạo Phòng'}
      </button>

      {/* Rules */}
      <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f9fafb', borderRadius: 12 }}>
        <h4 style={{ marginBottom: 8 }}>📋 Luật chơi</h4>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.8, fontSize: '0.85rem', color: '#6b7280' }}>
          {gameMode === 'read' ? (
            <>
              <li>⚔️ Kanji hiện lên - gõ nghĩa / cách đọc nhanh nhất</li>
              <li>💡 Có 3 lượt gợi ý miễn phí</li>
              <li>🏆 Người có điểm cao nhất thắng</li>
            </>
          ) : (
            <>
              <li>⚔️ Kanji hiện lên - vẽ theo đúng thứ tự nét</li>
              <li>✍️ Mỗi nét được chấm điểm chính xác</li>
              <li>🏆 Điểm = chính xác × tốc độ</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
