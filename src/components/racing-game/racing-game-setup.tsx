// Racing Game Setup - Configure and create a new race
// Select vehicle, questions, game mode, traps, and other settings

import { useState } from 'react';
import { ArrowLeft, Play, Settings, BookOpen, Clock, Map, HelpCircle, Users, AlertTriangle } from 'lucide-react';
import type { VehicleType, RacingVehicle, CreateRacingGameData, GameMode } from '../../types/racing-game';
import { DEFAULT_VEHICLES, DEFAULT_TRACK_ZONES } from '../../types/racing-game';
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
  const [title, setTitle] = useState(raceType === 'boat' ? 'Cuộc Đua Thuyền' : 'Cuộc Chạy Đua');
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>('N5');
  const [questionCount, setQuestionCount] = useState(20);
  const [timePerQuestion, setTimePerQuestion] = useState(15);
  const [trackLength, setTrackLength] = useState(100);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // New state for "Đường Đua" features
  const [gameMode, setGameMode] = useState<GameMode>('individual');
  const [teamCount, setTeamCount] = useState(2);
  const [enableTraps, setEnableTraps] = useState(false);

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
      gameMode,
      teamCount: gameMode === 'team' ? teamCount : undefined,
      enableTraps,
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
          <h2>{raceType === 'boat' ? 'Đua Thuyền' : 'Chạy Đua'}</h2>
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

      {/* Game Mode Selection */}
      <div className="setup-section">
        <label><Users size={16} /> Chế Độ Chơi</label>
        <div className="mode-selector">
          <button
            className={`mode-btn ${gameMode === 'individual' ? 'selected' : ''}`}
            onClick={() => setGameMode('individual')}
          >
            <span className="mode-icon">🏃</span>
            <span className="mode-name">Cá Nhân</span>
            <span className="mode-desc">Thi đấu riêng lẻ</span>
          </button>
          <button
            className={`mode-btn ${gameMode === 'team' ? 'selected' : ''}`}
            onClick={() => setGameMode('team')}
          >
            <span className="mode-icon">👥</span>
            <span className="mode-name">Đội</span>
            <span className="mode-desc">Thi đấu theo đội</span>
          </button>
        </div>
      </div>

      {/* Team Count (only show if team mode) */}
      {gameMode === 'team' && (
        <div className="setup-section">
          <label><Users size={16} /> Số Đội</label>
          <div className="team-count-selector">
            {[2, 3, 4].map(count => (
              <button
                key={count}
                className={`team-count-btn ${teamCount === count ? 'selected' : ''}`}
                onClick={() => setTeamCount(count)}
              >
                {count} đội
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trap Toggle */}
      <div className="setup-section">
        <label><AlertTriangle size={16} /> Hệ Thống Bẫy</label>
        <div className="trap-toggle">
          <button
            className={`toggle-btn ${!enableTraps ? 'selected' : ''}`}
            onClick={() => setEnableTraps(false)}
          >
            <span className="toggle-icon">🚫</span>
            <span>Tắt</span>
          </button>
          <button
            className={`toggle-btn ${enableTraps ? 'selected' : ''}`}
            onClick={() => setEnableTraps(true)}
          >
            <span className="toggle-icon">⚠️</span>
            <span>Bật</span>
          </button>
        </div>
        {enableTraps && (
          <div className="trap-info">
            <span className="info-icon">ℹ️</span>
            <span>Bẫy sẽ xuất hiện ngẫu nhiên: ⛓️ Nhà tù, 🧊 Băng giá, 🕳️ Hố sụt</span>
          </div>
        )}
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

      {/* Track Zones Preview */}
      <div className="setup-section">
        <label><Map size={16} /> Các Vùng Đường Đua</label>
        <div className="track-zones-preview">
          {DEFAULT_TRACK_ZONES.map(zone => (
            <div
              key={zone.id}
              className={`zone-preview zone-${zone.type}`}
              style={{
                width: `${zone.endPosition - zone.startPosition}%`,
                background: zone.background,
              }}
              title={`${zone.type}: ${zone.startPosition}% - ${zone.endPosition}%`}
            >
              <span className="zone-deco">{zone.decorations[0]}</span>
            </div>
          ))}
        </div>
        <div className="zone-labels">
          <span>🏁 Xuất phát</span>
          <span>🌲 Rừng</span>
          <span>🏜️ Sa mạc</span>
          <span>⛰️ Núi</span>
          <span>🌊 Nước</span>
          <span>🏆 Đích</span>
        </div>
      </div>

      {/* Info Box */}
      <div className="setup-info">
        <div className="info-item">
          <span className="info-icon">🎁</span>
          <span>Hộp mù xuất hiện mỗi 5 câu hỏi</span>
        </div>
        <div className="info-item">
          <span className="info-icon">🏆</span>
          <span>Câu hỏi cột mốc mỗi 5 câu (x2 bonus)</span>
        </div>
        <div className="info-item">
          <span className="info-icon">🔥</span>
          <span>Combo streak tăng tốc độ bonus</span>
        </div>
        {enableTraps && (
          <div className="info-item">
            <span className="info-icon">⚠️</span>
            <span>Bẫy xuất hiện ngẫu nhiên trên đường đua</span>
          </div>
        )}
        {gameMode === 'team' && (
          <div className="info-item">
            <span className="info-icon">👥</span>
            <span>Đội thắng = tổng khoảng cách cao nhất</span>
          </div>
        )}
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
