// Racing Game Setup - Configure and create a new race
// Select vehicle, questions, and game settings

import { useState } from 'react';
import { ArrowLeft, Play, Settings, BookOpen, Clock, Map, HelpCircle } from 'lucide-react';
import type { VehicleType, RacingVehicle, CreateRacingGameData } from '../../types/racing-game';
import { DEFAULT_VEHICLES } from '../../types/racing-game';
import type { JLPTLevel } from '../../types/flashcard';

interface RacingGameSetupProps {
  raceType: VehicleType;
  selectedVehicle: RacingVehicle;
  onSelectVehicle: (vehicle: RacingVehicle) => void;
  onCreateGame: (data: CreateRacingGameData) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function RacingGameSetup({
  raceType,
  selectedVehicle,
  onSelectVehicle,
  onCreateGame,
  onCancel,
  loading,
  error,
}: RacingGameSetupProps) {
  const [title, setTitle] = useState(raceType === 'boat' ? 'Cuộc Đua Thuyền' : 'Cuộc Đua Ngựa');
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [questionCount, setQuestionCount] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [trackLength, setTrackLength] = useState(100);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const vehiclesForType = DEFAULT_VEHICLES.filter(v => v.type === raceType);

  const handleCreate = () => {
    onCreateGame({
      title,
      raceType,
      jlptLevel,
      contentSource: 'flashcard',
      questionCount,
      timePerQuestion,
      trackLength,
    });
  };

  return (
    <div className="racing-setup">
      {/* Error Message */}
      {error && (
        <div className="racing-error">
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="racing-setup-header">
        <button className="back-btn" onClick={onCancel}>
          <ArrowLeft size={20} />
        </button>
        <div className="setup-title">
          <span className="setup-icon">{raceType === 'boat' ? '🚣' : '🏇'}</span>
          <h2>{raceType === 'boat' ? 'Đua Thuyền' : 'Đua Ngựa'}</h2>
        </div>
      </div>

      {/* Game Title */}
      <div className="setup-section">
        <label>Tên Cuộc Đua</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập tên cuộc đua..."
          maxLength={50}
        />
      </div>

      {/* Vehicle Selection */}
      <div className="setup-section">
        <label>Chọn Phương Tiện</label>
        <div className="vehicle-grid">
          {vehiclesForType.map(vehicle => (
            <button
              key={vehicle.id}
              className={`vehicle-card ${selectedVehicle.id === vehicle.id ? 'selected' : ''} ${vehicle.unlockPoints > 0 ? 'locked' : ''}`}
              onClick={() => vehicle.unlockPoints === 0 && onSelectVehicle(vehicle)}
              disabled={vehicle.unlockPoints > 0}
            >
              <span className="vehicle-emoji">{vehicle.emoji}</span>
              <span className="vehicle-name">{vehicle.name}</span>
              <div className="vehicle-stats">
                <span>Tốc độ: {vehicle.baseSpeed}-{vehicle.maxSpeed}</span>
              </div>
              {vehicle.unlockPoints > 0 && (
                <span className="unlock-badge">🔒 {vehicle.unlockPoints} điểm</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Level Selection */}
      <div className="setup-section">
        <label><BookOpen size={16} /> Cấp Độ JLPT</label>
        <div className="level-selector">
          {JLPT_LEVELS.map(level => (
            <button
              key={level}
              className={`level-btn ${jlptLevel === level ? 'selected' : ''}`}
              onClick={() => setJlptLevel(level)}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Settings */}
      <div className="setup-section">
        <div className="setting-row">
          <label><HelpCircle size={16} /> Số Câu Hỏi</label>
          <div className="setting-control">
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            />
            <span className="setting-value">{questionCount}</span>
          </div>
        </div>

        <div className="setting-row">
          <label><Clock size={16} /> Thời Gian/Câu</label>
          <div className="setting-control">
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
            />
            <span className="setting-value">{timePerQuestion}s</span>
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <Settings size={16} />
        {showAdvanced ? 'Ẩn cài đặt nâng cao' : 'Cài đặt nâng cao'}
      </button>

      {showAdvanced && (
        <div className="setup-section advanced">
          <div className="setting-row">
            <label><Map size={16} /> Độ Dài Đường Đua</label>
            <div className="setting-control">
              <input
                type="range"
                min={50}
                max={200}
                step={25}
                value={trackLength}
                onChange={(e) => setTrackLength(Number(e.target.value))}
              />
              <span className="setting-value">{trackLength} km</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="setup-info">
        <div className="info-item">
          <span className="info-icon">🎁</span>
          <span>Hộp mù xuất hiện mỗi 5 câu hỏi</span>
        </div>
        <div className="info-item">
          <span className="info-icon">🔥</span>
          <span>Combo streak tăng tốc độ bonus</span>
        </div>
      </div>

      {/* Create Button */}
      <button
        className="create-race-btn"
        onClick={handleCreate}
        disabled={loading || !title.trim()}
      >
        <Play size={20} />
        {loading ? 'Đang tạo...' : 'Tạo Cuộc Đua'}
      </button>
    </div>
  );
}
