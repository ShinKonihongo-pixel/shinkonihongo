// Kanji Battle Setup - Mode selection + JLPT level selection + room config
// Uses .rm-* design system for consistent modal styling
import { useState } from 'react';
import { X, Swords, BookOpen, PenTool, Clock, Users, Hash, Sparkles, Play } from 'lucide-react';
import type { CreateKanjiBattleData, KanjiBattleMode, JLPTLevel } from '../../types/kanji-battle';
import { getKanjiSeedCount } from '../../data/kanji-seed/index';
import { useBodyScrollLock } from '../../hooks/use-body-scroll-lock';
import { JLPT_LEVELS_WITH_BT } from '../../constants/jlpt';

const JLPT_LEVEL_OPTIONS = JLPT_LEVELS_WITH_BT.map(level => ({ level, label: level }));

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
  useBodyScrollLock();
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
  const maxRounds = Math.min(30, totalKanji);

  // Slider progress calculations
  const roundsPercent = ((totalRounds - 5) / (maxRounds - 5)) * 100;
  const timeMin = gameMode === 'write' ? 15 : 5;
  const timeMax = gameMode === 'write' ? 60 : 30;
  const timePercent = ((timePerQuestion - timeMin) / (timeMax - timeMin)) * 100;
  const playersPercent = ((maxPlayers - 2) / (20 - 2)) * 100;

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
    <div className="rm-overlay" onClick={onBack}>
      <div className="rm-modal large" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="rm-header">
          <div
            className="rm-header-gradient"
            style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)' }}
          />
          <div className="rm-header-icon">
            <Swords size={24} color="white" />
          </div>
          <div className="rm-header-content">
            <h1 className="rm-title">Tạo Phòng Chơi</h1>
            <span className="rm-subtitle">Đại Chiến Kanji</span>
          </div>
          <button className="rm-close-btn" onClick={onBack} type="button">
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        <div className="rm-body">
          {error && (
            <div className="rm-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Room Title */}
          <div className="rm-field">
            <label className="rm-label">
              <Swords size={16} />
              <span>Tên phòng</span>
            </label>
            <input
              type="text"
              className="rm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={30}
              placeholder="Đại Chiến Kanji"
            />
          </div>

          {/* Game Mode Toggle */}
          <div className="rm-field">
            <label className="rm-label">
              <BookOpen size={16} />
              <span>Chế độ chơi</span>
            </label>
            <div className="rm-pills">
              <button
                type="button"
                className={`rm-pill lg ${gameMode === 'read' ? 'active' : ''}`}
                onClick={() => setGameMode('read')}
              >
                <BookOpen size={16} />
                Đọc Kanji
                <span className="rm-pill-sub">Gõ nghĩa / cách đọc</span>
              </button>
              <button
                type="button"
                className={`rm-pill lg ${gameMode === 'write' ? 'active' : ''}`}
                onClick={() => {
                  setGameMode('write');
                  setTimePerQuestion(30);
                }}
              >
                <PenTool size={16} />
                Viết Kanji
                <span className="rm-pill-sub">Vẽ theo thứ tự nét</span>
              </button>
            </div>
          </div>

          {/* JLPT Level Selection */}
          <div className="rm-field">
            <label className="rm-label">
              <Hash size={16} />
              <span>Cấp độ JLPT</span>
              <span className="rm-label-hint">
                <span className="rm-label-value">{totalKanji} kanji</span>
              </span>
            </label>
            <div className="rm-pills">
              {JLPT_LEVEL_OPTIONS.map(({ level, label }) => (
                <button
                  key={level}
                  type="button"
                  className={`rm-pill ${selectedLevels.includes(level) ? 'active' : ''}`}
                  onClick={() => toggleLevel(level)}
                  data-level={level}
                >
                  {label} ({getKanjiSeedCount(level)})
                </button>
              ))}
            </div>
          </div>

          {/* Total Rounds */}
          <div className="rm-field">
            <label className="rm-label">
              <Hash size={16} />
              <span>Số câu hỏi</span>
              <span className="rm-label-hint">
                <span className="rm-label-value">{totalRounds} câu</span>
              </span>
            </label>
            <div className="rm-slider-wrap">
              <input
                type="range"
                className="rm-slider"
                min={5}
                max={maxRounds}
                step={5}
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                style={{ '--progress': `${roundsPercent}%` } as React.CSSProperties}
              />
              <div className="rm-slider-labels">
                <span>5</span>
                <span>{maxRounds}</span>
              </div>
            </div>
          </div>

          {/* Time per Question */}
          <div className="rm-field">
            <label className="rm-label">
              <Clock size={16} />
              <span>Thời gian mỗi câu</span>
              <span className="rm-label-hint">
                <span className="rm-label-value">{timePerQuestion}s</span>
              </span>
            </label>
            <div className="rm-slider-wrap">
              <input
                type="range"
                className="rm-slider"
                min={timeMin}
                max={timeMax}
                step={5}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                style={{ '--progress': `${timePercent}%` } as React.CSSProperties}
              />
              <div className="rm-slider-labels">
                <span>{timeMin}s</span>
                <span>{timeMax}s</span>
              </div>
            </div>
          </div>

          {/* Max Players */}
          <div className="rm-field">
            <label className="rm-label">
              <Users size={16} />
              <span>Số người chơi tối đa</span>
              <span className="rm-label-hint">
                <span className="rm-label-value">{maxPlayers} người</span>
              </span>
            </label>
            <div className="rm-slider-wrap">
              <input
                type="range"
                className="rm-slider"
                min={2}
                max={20}
                step={1}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                style={{ '--progress': `${playersPercent}%` } as React.CSSProperties}
              />
              <div className="rm-slider-labels">
                <span>2</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Skills Toggle */}
          <div className="rm-toggle-row">
            <div className="rm-toggle-info">
              <Sparkles size={18} />
              <div>
                <span className="rm-toggle-label">Kỹ năng đặc biệt</span>
                <span className="rm-toggle-desc">Mở khóa kỹ năng mỗi 5 câu</span>
              </div>
            </div>
            <button
              type="button"
              className={`rm-toggle-btn ${skillsEnabled ? 'active' : ''}`}
              onClick={() => setSkillsEnabled(!skillsEnabled)}
            >
              <span className="rm-toggle-thumb" />
            </button>
          </div>

          {/* Rules */}
          <div className="rm-rules">
            <div className="rm-rules-title">Luật chơi</div>
            <ul className="rm-rules-list">
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

        {/* Footer */}
        <footer className="rm-footer">
          <button type="button" className="rm-btn rm-btn-ghost" onClick={onBack}>
            Hủy
          </button>
          <button
            type="button"
            className="rm-btn rm-btn-primary rm-btn-lg"
            disabled={loading || totalKanji < 5}
            onClick={handleCreate}
            style={{ background: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)' }}
          >
            {loading ? (
              <>
                <span className="rm-spinner" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <>
                <Play size={20} fill="white" />
                <span>Tạo Phòng</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
