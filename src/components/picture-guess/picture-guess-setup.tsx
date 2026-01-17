// Picture Guess Setup - Game configuration form
// Allows customizing puzzle count, time, difficulty, and hints

import { useState } from 'react';
import { Settings, Clock, Hash, Lightbulb, Zap, AlertTriangle, ArrowLeft, Play } from 'lucide-react';
import type { CreatePictureGuessData, PictureGuessMode } from '../../types/picture-guess';
import type { JLPTLevel } from '../../types/flashcard';

interface PictureGuessSetupProps {
  mode: PictureGuessMode;
  onBack: () => void;
  onCreate: (data: CreatePictureGuessData) => void;
  loading: boolean;
}

export function PictureGuessSetup({
  mode,
  onBack,
  onCreate,
  loading,
}: PictureGuessSetupProps) {
  const [title, setTitle] = useState(mode === 'single' ? 'Luyện tập' : 'Phòng đuổi hình');
  const [puzzleCount, setPuzzleCount] = useState(10);
  const [timePerPuzzle, setTimePerPuzzle] = useState(30);
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [allowHints, setAllowHints] = useState(true);
  const [speedBonus, setSpeedBonus] = useState(true);
  const [penaltyWrongAnswer, setPenaltyWrongAnswer] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      mode,
      jlptLevel,
      contentSource: 'flashcard',
      puzzleCount,
      timePerPuzzle,
      maxPlayers: mode === 'single' ? 1 : maxPlayers,
      allowHints,
      speedBonus,
      penaltyWrongAnswer,
    });
  };

  return (
    <div className="picture-guess-setup">
      <button className="pg-back-btn" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Quay lại</span>
      </button>

      <div className="pg-setup-header">
        <Settings size={32} />
        <h2>{mode === 'single' ? 'Cài Đặt Luyện Tập' : 'Tạo Phòng Chơi'}</h2>
      </div>

      <form className="pg-setup-form" onSubmit={handleSubmit}>
        {/* Game Title */}
        <div className="pg-form-group">
          <label>Tên trò chơi</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nhập tên trò chơi"
            maxLength={50}
          />
        </div>

        {/* JLPT Level */}
        <div className="pg-form-group">
          <label>Cấp độ JLPT</label>
          <div className="pg-level-buttons">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(level => (
              <button
                key={level}
                type="button"
                className={`pg-level-btn ${jlptLevel === level ? 'active' : ''}`}
                onClick={() => setJlptLevel(level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Puzzle Count */}
        <div className="pg-form-group">
          <label>
            <Hash size={18} />
            <span>Số câu hỏi: {puzzleCount}</span>
          </label>
          <input
            type="range"
            min={5}
            max={30}
            step={5}
            value={puzzleCount}
            onChange={e => setPuzzleCount(Number(e.target.value))}
          />
          <div className="pg-range-labels">
            <span>5</span>
            <span>30</span>
          </div>
        </div>

        {/* Time Per Puzzle */}
        <div className="pg-form-group">
          <label>
            <Clock size={18} />
            <span>Thời gian mỗi câu: {timePerPuzzle}s</span>
          </label>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={timePerPuzzle}
            onChange={e => setTimePerPuzzle(Number(e.target.value))}
          />
          <div className="pg-range-labels">
            <span>10s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Max Players (multiplayer only) */}
        {mode === 'multiplayer' && (
          <div className="pg-form-group">
            <label>
              <span>Số người chơi tối đa: {maxPlayers}</span>
            </label>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={maxPlayers}
              onChange={e => setMaxPlayers(Number(e.target.value))}
            />
            <div className="pg-range-labels">
              <span>2</span>
              <span>20</span>
            </div>
          </div>
        )}

        {/* Toggle Options */}
        <div className="pg-form-toggles">
          <label className="pg-toggle">
            <input
              type="checkbox"
              checked={allowHints}
              onChange={e => setAllowHints(e.target.checked)}
            />
            <span className="pg-toggle-slider"></span>
            <span className="pg-toggle-label">
              <Lightbulb size={18} />
              Cho phép gợi ý
            </span>
          </label>

          <label className="pg-toggle">
            <input
              type="checkbox"
              checked={speedBonus}
              onChange={e => setSpeedBonus(e.target.checked)}
            />
            <span className="pg-toggle-slider"></span>
            <span className="pg-toggle-label">
              <Zap size={18} />
              Điểm thưởng tốc độ
            </span>
          </label>

          <label className="pg-toggle">
            <input
              type="checkbox"
              checked={penaltyWrongAnswer}
              onChange={e => setPenaltyWrongAnswer(e.target.checked)}
            />
            <span className="pg-toggle-slider"></span>
            <span className="pg-toggle-label">
              <AlertTriangle size={18} />
              Trừ điểm sai
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button type="submit" className="pg-start-btn" disabled={loading}>
          <Play size={20} />
          <span>{loading ? 'Đang tạo...' : mode === 'single' ? 'Bắt Đầu' : 'Tạo Phòng'}</span>
        </button>
      </form>
    </div>
  );
}
