// Game Tab - Professional Game Management Dashboard
// Unified hub for managing all game settings, visibility, and analytics

import { useState, useEffect, useCallback } from 'react';
import {
  Gamepad2, Settings, ChevronRight, TrendingUp, Users, Clock, Zap,
  Activity, Volume2, Bot, RefreshCw, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import { PictureGuessPuzzleEditor } from '../picture-guess/picture-guess-puzzle-editor';
import { BingoGameManager } from '../bingo-game/bingo-game-manager';
import { KanjiBattleManager } from '../kanji-battle/kanji-battle-manager';
import { WordMatchManager } from '../word-match/word-match-manager';
import { ImageWordManagementPage } from '../pages/image-word-management-page';
import {
  getGameVisibilitySettings,
  toggleGameVisibility,
  showAllGames,
  type GameVisibilitySettings,
} from '../../services/game-visibility-storage';
import type { GameType } from '../../types/game-hub';
import { useSettings, type AIDifficultyId, type AICustomSettings, type FlashcardDifficulty, type JLPTLevelKey, DEFAULT_AI_CUSTOM_SETTINGS } from '../../hooks/use-settings';
import { AI_OPPONENTS } from '../../types/ai-challenge';
import { useLessons } from '../../hooks/use-lessons';
import type { Lesson } from '../../types/flashcard';

type GameSection = 'dashboard' | 'quiz' | 'picture-guess' | 'bingo' | 'kanji-battle' | 'word-match' | 'image-word' | 'ai-challenge' | 'global-settings';

// Game configuration with management capabilities
interface GameConfig {
  id: GameType;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
  gradient: string;
  color: string;
  category: string;
  hasManager: boolean;
  isNew: boolean;
  stats: { questions: number | null; played: number; avgScore: number | null };
}

// All game configurations
const ALL_GAMES: GameConfig[] = [
  {
    id: 'picture-guess',
    title: 'Đuổi Hình Bắt Chữ',
    shortTitle: 'Picture Guess',
    description: 'Đoán từ qua hình ảnh emoji gợi ý',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#667eea',
    category: 'puzzle',
    hasManager: true,
    isNew: false,
    stats: { questions: 24, played: 156, avgScore: 78 },
  },
  {
    id: 'bingo',
    title: 'Bingo',
    shortTitle: 'Bingo',
    description: 'Bốc số may mắn - 6 dãy, ai BINGO trước thắng',
    emoji: '🎱',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    category: 'luck',
    hasManager: true,
    isNew: false,
    stats: { questions: null, played: 89, avgScore: null },
  },
  {
    id: 'kanji-battle',
    title: 'Đại Chiến Kanji',
    shortTitle: 'Kanji Battle',
    description: 'Đọc hoặc viết kanji nhanh nhất để chiến thắng',
    emoji: '⚔️',
    gradient: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
    color: '#FF5722',
    category: 'quiz',
    hasManager: true,
    isNew: true,
    stats: { questions: 150, played: 234, avgScore: 82 },
  },
  {
    id: 'word-match',
    title: 'Nối Từ Thách Đấu',
    shortTitle: 'Word Match',
    description: 'Nối cặp từ nhanh và chính xác nhất',
    emoji: '🔗',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    color: '#11998e',
    category: 'matching',
    hasManager: true,
    isNew: false,
    stats: { questions: 80, played: 67, avgScore: 75 },
  },
  {
    id: 'image-word',
    title: 'Nối Hình - Từ',
    shortTitle: 'Image Match',
    description: 'Nối hình ảnh với từ vựng tương ứng',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
    color: '#E91E63',
    category: 'matching',
    hasManager: true,
    isNew: true,
    stats: { questions: 0, played: 0, avgScore: null },
  },
  {
    id: 'ai-challenge',
    title: 'Thách Đấu AI',
    shortTitle: 'AI Battle',
    description: 'Đấu trí 1v1 với AI - 10 cấp độ thử thách',
    emoji: '🤖',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#6366f1',
    category: 'ai',
    hasManager: true,
    isNew: true,
    stats: { questions: null, played: 45, avgScore: 68 },
  },
  {
    id: 'quiz',
    title: 'Đại Chiến Tiếng Nhật',
    shortTitle: 'Đại Chiến',
    description: 'Đối kháng kiến thức tiếng Nhật với bạn bè',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
    color: '#FF6B6B',
    category: 'quiz',
    hasManager: true,
    isNew: false,
    stats: { questions: null, played: 312, avgScore: 71 },
  },
  {
    id: 'golden-bell',
    title: 'Rung Chuông Vàng',
    shortTitle: 'Golden Bell',
    description: 'Loại trực tiếp - người cuối thắng',
    emoji: '🔔',
    gradient: 'linear-gradient(135deg, #FFD93D 0%, #FF9F43 100%)',
    color: '#FFD93D',
    category: 'elimination',
    hasManager: false,
    isNew: false,
    stats: { questions: null, played: 203, avgScore: 65 },
  },
];

// Dashboard stats
interface DashboardStats {
  totalGamesPlayed: number;
  activeRooms: number;
  playersOnline: number;
  avgSessionTime: string;
  popularGame: string;
  todayGames: number;
}

export function GameTab() {
  const [activeSection, setActiveSection] = useState<GameSection>('dashboard');
  const [visibilitySettings, setVisibilitySettings] = useState<GameVisibilitySettings>({ hiddenGames: [], updatedAt: 0 });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalGamesPlayed: 591,
    activeRooms: 3,
    playersOnline: 12,
    avgSessionTime: '8 phút',
    popularGame: 'Kanji Battle',
    todayGames: 24,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load visibility settings on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibilitySettings(getGameVisibilitySettings());
  }, []);

  // Show toast notification
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Toggle game visibility
  const handleToggleVisibility = useCallback((gameId: GameType, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHiddenState = toggleGameVisibility(gameId);
    setVisibilitySettings(getGameVisibilitySettings());

    const game = ALL_GAMES.find(g => g.id === gameId);
    if (game) {
      showToast(newHiddenState ? `Đã ẩn "${game.title}"` : `Đã hiện "${game.title}"`);
    }
  }, [showToast]);

  // Show all games
  const handleShowAllGames = useCallback(() => {
    showAllGames();
    setVisibilitySettings(getGameVisibilitySettings());
    showToast('Đã hiện tất cả games');
  }, [showToast]);

  // Simulate data refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDashboardStats(prev => ({
        ...prev,
        playersOnline: Math.floor(Math.random() * 20) + 5,
        activeRooms: Math.floor(Math.random() * 5),
      }));
      setIsRefreshing(false);
      showToast('Đã cập nhật dữ liệu');
    }, 1000);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardStats(prev => ({
        ...prev,
        playersOnline: Math.max(0, prev.playersOnline + Math.floor(Math.random() * 5) - 2),
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if game is hidden
  const isHidden = (gameId: GameType) => visibilitySettings.hiddenGames.includes(gameId);

  // Count hidden games
  const hiddenCount = visibilitySettings.hiddenGames.length;

  // Dashboard view
  if (activeSection === 'dashboard') {
    return (
      <div className="game-management-dashboard">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="gm-toast">
            <Check size={16} />
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="gm-header">
          <div className="gm-header-left">
            <div className="gm-icon">
              <Gamepad2 size={28} />
            </div>
            <div className="gm-header-text">
              <h2>Game Management</h2>
              <p>Quản lý hiển thị và cài đặt tất cả mini-games</p>
            </div>
          </div>
          <div className="gm-header-actions">
            <button
              className={`gm-btn-icon ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={18} />
            </button>
            <button
              className="gm-btn-secondary"
              onClick={() => setActiveSection('global-settings')}
            >
              <Settings size={16} />
              Cài Đặt Chung
            </button>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="gm-stats-row">
          <div className="gm-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)' }}>
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{dashboardStats.totalGamesPlayed}</span>
              <span className="stat-label">Tổng Lượt Chơi</span>
            </div>
          </div>
          <div className="gm-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #2196F3 0%, #03A9F4 100%)' }}>
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{dashboardStats.activeRooms}</span>
              <span className="stat-label">Phòng Hoạt Động</span>
            </div>
          </div>
          <div className="gm-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #E040FB 100%)' }}>
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{dashboardStats.playersOnline}</span>
              <span className="stat-label">Đang Online</span>
            </div>
          </div>
          <div className="gm-stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{dashboardStats.avgSessionTime}</span>
              <span className="stat-label">TB Mỗi Game</span>
            </div>
          </div>
        </div>

        {/* Visibility Control Banner */}
        {hiddenCount > 0 && (
          <div className="gm-visibility-banner">
            <div className="visibility-info">
              <AlertCircle size={18} />
              <span><strong>{hiddenCount}</strong> game đang bị ẩn khỏi màn hình chơi</span>
            </div>
            <button className="gm-btn-text" onClick={handleShowAllGames}>
              <Eye size={16} />
              Hiện Tất Cả
            </button>
          </div>
        )}

        {/* Main Games Grid */}
        <div className="gm-section">
          <div className="gm-section-header">
            <h3>
              <Zap size={18} />
              Quản Lý Hiển Thị Game
            </h3>
            <span className="gm-badge">{ALL_GAMES.length} games</span>
          </div>

          <p className="gm-section-hint">
            Nhấn nút <EyeOff size={14} style={{ verticalAlign: 'middle' }} /> để ẩn game khỏi danh sách chơi
          </p>

          <div className="gm-games-grid">
            {ALL_GAMES.map((game) => {
              const hidden = isHidden(game.id);
              return (
                <div
                  key={game.id}
                  className={`gm-game-card ${!game.hasManager ? 'no-manager' : ''} ${hidden ? 'is-hidden' : ''}`}
                  onClick={() => game.hasManager && setActiveSection(game.id as GameSection)}
                >
                  {/* Visibility Toggle Button */}
                  <button
                    className={`gm-visibility-toggle ${hidden ? 'hidden' : 'visible'}`}
                    onClick={(e) => handleToggleVisibility(game.id, e)}
                    title={hidden ? 'Nhấn để hiện game' : 'Nhấn để ẩn game'}
                  >
                    {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  <div className="gm-game-card-header" style={{ background: game.gradient }}>
                    <span className="gm-game-emoji">{game.emoji}</span>
                    {game.isNew && <span className="gm-new-badge">MỚI</span>}
                    {hidden && <span className="gm-hidden-badge">ẨN</span>}
                  </div>
                  <div className="gm-game-card-body">
                    <h4>{game.title}</h4>
                    <p>{game.description}</p>

                    {/* Mini Stats */}
                    <div className="gm-game-stats">
                      {game.stats.questions !== null && (
                        <span className="gm-mini-stat">
                          <span className="value">{game.stats.questions}</span>
                          <span className="label">câu</span>
                        </span>
                      )}
                      <span className="gm-mini-stat">
                        <span className="value">{game.stats.played}</span>
                        <span className="label">lượt</span>
                      </span>
                      {game.stats.avgScore !== null && (
                        <span className="gm-mini-stat">
                          <span className="value">{game.stats.avgScore}%</span>
                          <span className="label">TB</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="gm-game-card-footer">
                    {game.hasManager ? (
                      <span className="gm-manage-link">
                        Quản lý <ChevronRight size={14} />
                      </span>
                    ) : (
                      <span className="gm-no-manager-hint">Tự động</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="gm-section">
          <div className="gm-section-header">
            <h3>
              <Activity size={18} />
              Hoạt Động Gần Đây
            </h3>
            <button className="gm-btn-text">Xem tất cả</button>
          </div>

          <div className="gm-activity-feed">
            <ActivityItem
              icon="🎱"
              title="Bingo #A4F2"
              description="Phòng mới được tạo bởi Teacher1"
              time="2 phút trước"
              status="active"
            />
            <ActivityItem
              icon="⚔️"
              title="Đại Chiến Kanji kết thúc"
              description="Người thắng: Sakura với 850 điểm"
              time="15 phút trước"
              status="completed"
            />
            <ActivityItem
              icon="🔗"
              title="Word Match #B7C1"
              description="5 người chơi đang thi đấu"
              time="25 phút trước"
              status="playing"
            />
            <ActivityItem
              icon="🖼️"
              title="Bài học mới"
              description="Image-Word: Động vật (12 cặp)"
              time="1 giờ trước"
              status="new"
            />
          </div>
        </div>

        {/* Quick Tips */}
        <div className="gm-tips-banner">
          <div className="gm-tip-icon">💡</div>
          <div className="gm-tip-content">
            <strong>Mẹo:</strong> Ẩn game để tập trung học sinh vào các game cụ thể.
            Game bị ẩn sẽ không hiển thị ở màn hình chọn game.
          </div>
        </div>
      </div>
    );
  }

  // Global Settings View
  if (activeSection === 'global-settings') {
    return <GlobalSettingsPanel onBack={() => setActiveSection('dashboard')} />;
  }

  // Picture Guess Editor
  if (activeSection === 'picture-guess') {
    return <PictureGuessPuzzleEditor onClose={() => setActiveSection('dashboard')} />;
  }

  // Bingo Manager
  if (activeSection === 'bingo') {
    return <BingoGameManager onClose={() => setActiveSection('dashboard')} />;
  }

  // Kanji Battle Manager
  if (activeSection === 'kanji-battle') {
    return <KanjiBattleManager onClose={() => setActiveSection('dashboard')} />;
  }

  // Word Match Manager
  if (activeSection === 'word-match') {
    return <WordMatchManager onClose={() => setActiveSection('dashboard')} />;
  }

  // Image Word Manager
  if (activeSection === 'image-word') {
    return <ImageWordManagementPage onBack={() => setActiveSection('dashboard')} />;
  }

  // Quiz Game (Đại Chiến Tiếng Nhật) Manager
  if (activeSection === 'quiz') {
    return <QuizGameSettingsPanel onBack={() => setActiveSection('dashboard')} />;
  }

  // AI Challenge Settings
  if (activeSection === 'ai-challenge') {
    return <AIChallengeSettingsPanel onBack={() => setActiveSection('dashboard')} />;
  }

  return null;
}

// Activity Feed Item Component
function ActivityItem({
  icon,
  title,
  description,
  time,
  status,
}: {
  icon: string;
  title: string;
  description: string;
  time: string;
  status: 'active' | 'completed' | 'playing' | 'new';
}) {
  const statusColors = {
    active: '#4CAF50',
    completed: '#9E9E9E',
    playing: '#2196F3',
    new: '#FF9800',
  };

  return (
    <div className="gm-activity-item">
      <span className="gm-activity-icon">{icon}</span>
      <div className="gm-activity-content">
        <div className="gm-activity-header">
          <span className="gm-activity-title">{title}</span>
          <span className="gm-activity-status" style={{ background: statusColors[status] }}>
            {status === 'active' && 'Mới'}
            {status === 'completed' && 'Xong'}
            {status === 'playing' && 'Đang chơi'}
            {status === 'new' && 'Tạo mới'}
          </span>
        </div>
        <span className="gm-activity-desc">{description}</span>
        <span className="gm-activity-time">{time}</span>
      </div>
    </div>
  );
}

// Global Settings Panel
function GlobalSettingsPanel({ onBack }: { onBack: () => void }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoStartBots, setAutoStartBots] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);

  return (
    <div className="gm-global-settings">
      <div className="gm-header">
        <button className="gm-back-btn" onClick={onBack}>
          ← Quay lại Dashboard
        </button>
        <div className="gm-header-text">
          <h2>Cài Đặt Chung</h2>
          <p>Cấu hình áp dụng cho tất cả mini-games</p>
        </div>
      </div>

      <div className="gm-settings-grid">
        {/* Sound Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Volume2 size={20} />
            <h4>Âm Thanh & Hiệu Ứng</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Âm thanh game</span>
                <span className="setting-desc">Hiệu ứng âm thanh khi chơi</span>
              </div>
              <button
                className={`toggle-switch ${soundEnabled ? 'active' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Bot Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Bot size={20} />
            <h4>Bot & Tự Động</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Tự động thêm Bot</span>
                <span className="setting-desc">Thêm bot khi không đủ người chơi</span>
              </div>
              <button
                className={`toggle-switch ${autoStartBots ? 'active' : ''}`}
                onClick={() => setAutoStartBots(!autoStartBots)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Eye size={20} />
            <h4>Hiển Thị</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Bảng xếp hạng</span>
                <span className="setting-desc">Hiện bảng xếp hạng sau game</span>
              </div>
              <button
                className={`toggle-switch ${showLeaderboard ? 'active' : ''}`}
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="gm-settings-card">
          <div className="settings-card-header">
            <Clock size={20} />
            <h4>Thời Gian</h4>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Thời gian mặc định</span>
                <span className="setting-desc">Giới hạn thời gian mỗi câu</span>
              </div>
              <div className="setting-select">
                <select
                  value={defaultTimeLimit}
                  onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
                >
                  <option value={15}>15 giây</option>
                  <option value={20}>20 giây</option>
                  <option value={30}>30 giây</option>
                  <option value={45}>45 giây</option>
                  <option value={60}>60 giây</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gm-settings-actions">
        <button className="gm-btn-primary">
          💾 Lưu Cài Đặt
        </button>
        <button className="gm-btn-secondary">
          🔄 Khôi Phục Mặc Định
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Đại Chiến Tiếng Nhật Settings Panel
// Manages difficulty mix % and JLPT time per question category
// ============================================================

const QUIZ_DIFFICULTY_LABELS: { key: 'super_hard' | 'hard' | 'medium' | 'easy'; label: string; color: string }[] = [
  { key: 'super_hard', label: 'Siêu khó', color: '#DC2626' },
  { key: 'hard', label: 'Khó', color: '#F59E0B' },
  { key: 'medium', label: 'Vừa', color: '#3B82F6' },
  { key: 'easy', label: 'Dễ', color: '#10B981' },
];

const JLPT_CATEGORY_LABELS: { key: 'vocabulary' | 'grammar' | 'reading' | 'listening'; label: string; icon: string }[] = [
  { key: 'vocabulary', label: 'Từ vựng', icon: '📝' },
  { key: 'grammar', label: 'Ngữ pháp', icon: '📖' },
  { key: 'reading', label: 'Đọc hiểu', icon: '📄' },
  { key: 'listening', label: 'Nghe', icon: '🎧' },
];

type DiffKey = 'super_hard' | 'hard' | 'medium' | 'easy';
type DiffRow = { super_hard: number; hard: number; medium: number; easy: number };

function QuizGameSettingsPanel({ onBack }: { onBack: () => void }) {
  const { settings, updateSetting } = useSettings();
  const [saved, setSaved] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<DiffKey | null>(null);

  const mix = settings.quizDifficultyMix;
  const jlptTime = settings.quizJlptTimePerCategory;

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Row total for a level
  const rowTotal = (row: DiffRow) => row.super_hard + row.hard + row.medium + row.easy;

  // Max value a slider can reach (remaining budget)
  const maxForCell = (level: DiffKey, cardDiff: DiffKey) => {
    const row = mix[level];
    const othersTotal = rowTotal(row) - row[cardDiff];
    return 100 - othersTotal;
  };

  // Update one cell, clamped so row total <= 100
  const updateMixCell = (level: DiffKey, cardDiff: DiffKey, value: number) => {
    const clamped = Math.min(value, maxForCell(level, cardDiff));
    const row = { ...mix[level], [cardDiff]: clamped };
    updateSetting('quizDifficultyMix', { ...mix, [level]: row });
    showSaved();
  };

  // Update JLPT time for a category
  const updateJlptTime = (key: keyof typeof jlptTime, value: number) => {
    updateSetting('quizJlptTimePerCategory', { ...jlptTime, [key]: value });
    showSaved();
  };

  // Reset to defaults
  const resetDefaults = () => {
    updateSetting('quizDifficultyMix', {
      super_hard: { super_hard: 60, hard: 25, medium: 10, easy: 5 },
      hard:       { super_hard: 20, hard: 45, medium: 25, easy: 10 },
      medium:     { super_hard: 5,  hard: 20, medium: 50, easy: 25 },
      easy:       { super_hard: 0,  hard: 10, medium: 30, easy: 60 },
    });
    updateSetting('quizJlptTimePerCategory', { vocabulary: 15, grammar: 20, reading: 30, listening: 25 });
    showSaved();
  };

  return (
    <div className="gm-quiz-settings">
      <div className="gm-header">
        <button className="gm-back-btn" onClick={onBack}>
          ← Quay lại Dashboard
        </button>
        <div className="gm-header-text">
          <h2>🎯 Đại Chiến Tiếng Nhật</h2>
          <p>Quản lý phần trăm trộn mức độ và thời gian JLPT</p>
        </div>
      </div>

      {saved && (
        <div className="gm-toast">
          <Check size={16} />
          Đã lưu cài đặt!
        </div>
      )}

      {/* Section 1: Per-level difficulty mix matrix */}
      <div className="gm-settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-card-header">
          <Zap size={20} />
          <h4>Phần Trăm Trộn Mức Độ</h4>
        </div>
        <div className="settings-card-body">
          <p className="gm-section-hint" style={{ marginBottom: '1rem' }}>
            Mỗi mức độ khi người chơi chọn sẽ trộn câu hỏi từ các thẻ có độ khó khác nhau. Tổng tối đa 100%.
          </p>

          {/* One expandable card per game difficulty level */}
          {QUIZ_DIFFICULTY_LABELS.map(level => {
            const row = mix[level.key];
            const total = rowTotal(row);
            const isExpanded = expandedLevel === level.key;

            return (
              <div key={level.key} className="quiz-mix-level" style={{ marginBottom: '0.75rem' }}>
                {/* Level header — click to expand */}
                <div
                  className="quiz-mix-level-header"
                  onClick={() => setExpandedLevel(isExpanded ? null : level.key)}
                  style={{ borderLeftColor: level.color }}
                >
                  <div className="quiz-mix-level-title">
                    <ChevronRight size={16} className={isExpanded ? 'rotated' : ''} />
                    <span style={{ color: level.color, fontWeight: 700 }}>{level.label}</span>
                  </div>

                  {/* Mini visual bar preview */}
                  <div className="quiz-mix-bar mini">
                    {total > 0 ? QUIZ_DIFFICULTY_LABELS.map(d => {
                      const pct = Math.round((row[d.key] / total) * 100);
                      if (pct === 0) return null;
                      return (
                        <div
                          key={d.key}
                          className="quiz-mix-segment"
                          style={{ width: `${pct}%`, background: d.color }}
                          title={`${d.label}: ${row[d.key]}%`}
                        >
                          {pct >= 12 && <span>{row[d.key]}%</span>}
                        </div>
                      );
                    }) : (
                      <div className="quiz-mix-segment" style={{ width: '100%', background: '#e5e7eb' }}>
                        <span style={{ color: '#9ca3af' }}>0%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded sliders */}
                {isExpanded && (
                  <div className="quiz-mix-level-body">
                    {QUIZ_DIFFICULTY_LABELS.map(cardDiff => (
                      <div key={cardDiff.key} className="setting-row" style={{ alignItems: 'center', padding: '0.25rem 0' }}>
                        <div className="setting-info" style={{ minWidth: '80px' }}>
                          <span className="setting-label" style={{ color: cardDiff.color, fontWeight: 600, fontSize: '0.85rem' }}>
                            {cardDiff.label}
                          </span>
                        </div>
                        <div className="setting-control" style={{ flex: 1 }}>
                          <input
                            type="range"
                            min={0}
                            max={maxForCell(level.key, cardDiff.key)}
                            step={5}
                            value={row[cardDiff.key]}
                            onChange={(e) => updateMixCell(level.key, cardDiff.key, Number(e.target.value))}
                            style={{ accentColor: cardDiff.color }}
                          />
                          <span className="value" style={{ minWidth: '45px', textAlign: 'right' }}>{row[cardDiff.key]}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="gm-hint-text" style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: total === 100 ? '#10B981' : undefined }}>
                      Tổng: {total}% / 100%{total < 100 && ` — còn ${100 - total}%`}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: JLPT Time Per Category */}
      <div className="gm-settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-card-header">
          <Clock size={20} />
          <h4>Thời Gian JLPT Mỗi Loại Câu Hỏi</h4>
        </div>
        <div className="settings-card-body">
          <p className="gm-section-hint" style={{ marginBottom: '1rem' }}>
            Thời gian trả lời (giây) cho từng loại câu hỏi JLPT khi chơi Đại Chiến.
          </p>

          {JLPT_CATEGORY_LABELS.map(cat => (
            <div key={cat.key} className="setting-row" style={{ alignItems: 'center' }}>
              <div className="setting-info" style={{ minWidth: '100px' }}>
                <span className="setting-label">
                  {cat.icon} {cat.label}
                </span>
              </div>
              <div className="setting-control" style={{ flex: 1 }}>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={jlptTime[cat.key]}
                  onChange={(e) => updateJlptTime(cat.key, Number(e.target.value))}
                />
                <span className="value" style={{ minWidth: '40px', textAlign: 'right' }}>{jlptTime[cat.key]}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Question/Answer content */}
      <div className="gm-settings-card" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-card-header">
          <Settings size={20} />
          <h4>Nội Dung Câu Hỏi & Đáp Án</h4>
        </div>
        <div className="settings-card-body">
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Câu hỏi hiển thị</span>
              <span className="setting-desc">Nội dung hiện trên màn hình câu hỏi</span>
            </div>
            <div className="setting-select">
              <select
                value={settings.gameQuestionContent}
                onChange={(e) => { updateSetting('gameQuestionContent', e.target.value as 'kanji' | 'vocabulary' | 'meaning'); showSaved(); }}
              >
                <option value="kanji">Kanji</option>
                <option value="vocabulary">Từ vựng (Hiragana)</option>
                <option value="meaning">Nghĩa</option>
              </select>
            </div>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Đáp án hiển thị</span>
              <span className="setting-desc">Nội dung các lựa chọn đáp án</span>
            </div>
            <div className="setting-select">
              <select
                value={settings.gameAnswerContent}
                onChange={(e) => { updateSetting('gameAnswerContent', e.target.value as 'kanji' | 'vocabulary' | 'meaning' | 'vocabulary_meaning'); showSaved(); }}
              >
                <option value="vocabulary_meaning">Từ vựng + Nghĩa</option>
                <option value="kanji">Kanji</option>
                <option value="vocabulary">Từ vựng</option>
                <option value="meaning">Nghĩa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="gm-settings-actions">
        <button className="gm-btn-secondary" onClick={resetDefaults}>
          🔄 Khôi Phục Mặc Định
        </button>
      </div>
    </div>
  );
}

// AI Sessions configuration
const AI_SESSIONS = [
  { id: 1, name: 'Khởi Đầu', ais: ['gentle', 'friendly', 'curious', 'eager', 'clever', 'diligent', 'quick', 'smart', 'sharp'] as AIDifficultyId[] },
  { id: 2, name: 'Thử Thách', ais: ['skilled', 'excellent', 'talented', 'brilliant', 'genius', 'elite', 'master', 'grandmaster', 'sage'] as AIDifficultyId[] },
  { id: 3, name: 'Huyền Thoại', ais: ['superior', 'unbeatable', 'mythical', 'legendary', 'immortal', 'divine', 'celestial', 'supreme', 'champion'] as AIDifficultyId[] },
];

const DIFFICULTY_OPTIONS: { value: FlashcardDifficulty; label: string; emoji: string }[] = [
  { value: 'easy', label: 'Dễ', emoji: '🟢' },
  { value: 'medium', label: 'Trung bình', emoji: '🟡' },
  { value: 'hard', label: 'Khó', emoji: '🟠' },
  { value: 'super_hard', label: 'Siêu khó', emoji: '🔴' },
];

const JLPT_LEVELS: JLPTLevelKey[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// AI Challenge Settings Panel with Per-AI Lesson Selection
function AIChallengeSettingsPanel({ onBack }: { onBack: () => void }) {
  const { settings, updateSetting } = useSettings();
  const { lessons, loading: lessonsLoading, getLessonsByLevel, getChildLessons } = useLessons();
  const [currentSession, setCurrentSession] = useState(1);
  const [selectedAI, setSelectedAI] = useState<AIDifficultyId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevelKey>('N5');
  const [saved, setSaved] = useState(false);

  // Default lesson IDs structure to prevent undefined errors
  const DEFAULT_LESSON_IDS: Record<JLPTLevelKey, string[]> = { N5: [], N4: [], N3: [], N2: [], N1: [] };

  // Get current AI's settings with safe defaults
  const getAISettings = (aiId: AIDifficultyId): AICustomSettings => {
    const aiSettings = settings.aiChallengePerAISettings?.[aiId] || DEFAULT_AI_CUSTOM_SETTINGS;
    return {
      ...aiSettings,
      selectedLessonIds: { ...DEFAULT_LESSON_IDS, ...aiSettings.selectedLessonIds },
    };
  };

  // Update single AI's settings
  const updateAISettings = (aiId: AIDifficultyId, newSettings: Partial<AICustomSettings>) => {
    const currentPerAISettings = settings.aiChallengePerAISettings || {};
    const currentAISettings = currentPerAISettings[aiId] || DEFAULT_AI_CUSTOM_SETTINGS;
    updateSetting('aiChallengePerAISettings', {
      ...currentPerAISettings,
      [aiId]: { ...currentAISettings, ...newSettings },
    });
    showSaved();
  };

  // Toggle lesson selection for an AI at a specific level
  const toggleLesson = (aiId: AIDifficultyId, level: JLPTLevelKey, lessonId: string) => {
    const aiSettings = getAISettings(aiId);
    const currentLessons = aiSettings.selectedLessonIds[level] || [];
    const newLessons = currentLessons.includes(lessonId)
      ? currentLessons.filter(id => id !== lessonId)
      : [...currentLessons, lessonId];
    updateAISettings(aiId, {
      selectedLessonIds: {
        ...DEFAULT_LESSON_IDS,
        ...aiSettings.selectedLessonIds,
        [level]: newLessons,
      },
    });
  };

  // Select all lessons for an AI at a level
  const selectAllLessons = (aiId: AIDifficultyId, level: JLPTLevelKey) => {
    const aiSettings = getAISettings(aiId);
    updateAISettings(aiId, {
      selectedLessonIds: {
        ...DEFAULT_LESSON_IDS,
        ...aiSettings.selectedLessonIds,
        [level]: [], // Empty = all
      },
    });
  };

  // Get all lessons for a level (including children)
  const getAllLessonsForLevel = (level: JLPTLevelKey): Lesson[] => {
    return lessons.filter(l => l.jlptLevel === level);
  };

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Get current session's AIs
  const session = AI_SESSIONS.find(s => s.id === currentSession)!;

  // Get lessons for selected level
  const levelLessons = getLessonsByLevel(selectedLevel);

  // Helper to get selected lessons count for display
  const getSelectedLessonsInfo = (aiId: AIDifficultyId, level: JLPTLevelKey) => {
    const aiSettings = getAISettings(aiId);
    const selected = aiSettings.selectedLessonIds[level] || [];
    const totalInLevel = getAllLessonsForLevel(level).length;
    if (lessonsLoading) return '...';
    if (selected.length === 0) return totalInLevel > 0 ? `Tất cả (${totalInLevel})` : 'Trống';
    return `${selected.length}/${totalInLevel}`;
  };

  return (
    <div className="gm-ai-challenge-settings">
      <div className="gm-header">
        <button className="gm-back-btn" onClick={onBack}>
          ← Quay lại Dashboard
        </button>
        <div className="gm-header-text">
          <h2>🤖 Cài Đặt Thách Đấu AI</h2>
          <p>Chọn bài học nguồn câu hỏi cho từng AI theo cấp độ JLPT</p>
        </div>
      </div>

      {saved && (
        <div className="gm-toast">
          <Check size={16} />
          Đã lưu cài đặt!
        </div>
      )}

      {/* JLPT Level Tabs */}
      <div className="gm-level-tabs">
        {JLPT_LEVELS.map(level => (
          <button
            key={level}
            className={`gm-level-tab ${selectedLevel === level ? 'active' : ''}`}
            onClick={() => setSelectedLevel(level)}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Session Tabs */}
      <div className="gm-session-tabs">
        {AI_SESSIONS.map(s => (
          <button
            key={s.id}
            className={`gm-session-tab ${currentSession === s.id ? 'active' : ''}`}
            onClick={() => { setCurrentSession(s.id); setSelectedAI(null); }}
          >
            <span className="tab-num">{s.id}</span>
            <span className="tab-name">{s.name}</span>
          </button>
        ))}
      </div>

      {/* AI Grid */}
      <div className="gm-ai-grid">
        {session.ais.map((aiId, idx) => {
          const ai = AI_OPPONENTS[aiId];
          const aiSettings = getAISettings(aiId);
          const isSelected = selectedAI === aiId;
          const globalIdx = (currentSession - 1) * 9 + idx + 1;
          const selectedLessonIds = aiSettings.selectedLessonIds?.[selectedLevel] || [];

          return (
            <div
              key={aiId}
              className={`gm-ai-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedAI(isSelected ? null : aiId)}
            >
              <div className="ai-card-header">
                <span className="ai-rank">#{globalIdx}</span>
                <span className="ai-emoji">{ai.emoji}</span>
                <span className="ai-name">{ai.name}</span>
              </div>
              <div className="ai-card-stats">
                <span className="stat" title="Độ chính xác">
                  🎯 {aiSettings.accuracyModifier > 0 ? '+' : ''}{aiSettings.accuracyModifier}%
                </span>
                <span className="stat" title="Tốc độ">
                  ⚡ {aiSettings.speedMultiplier.toFixed(1)}x
                </span>
                <span className="stat lessons" title={`Bài học ${selectedLevel}`}>
                  📚 {getSelectedLessonsInfo(aiId, selectedLevel)}
                </span>
              </div>

              {/* Expanded Settings */}
              {isSelected && (
                <div className="ai-card-settings" onClick={e => e.stopPropagation()}>
                  {/* Basic Settings */}
                  <div className="setting-row">
                    <label>🎯 Độ chính xác</label>
                    <div className="setting-control">
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="1"
                        value={aiSettings.accuracyModifier}
                        onChange={(e) => updateAISettings(aiId, { accuracyModifier: Number(e.target.value) })}
                      />
                      <span className="value">{aiSettings.accuracyModifier > 0 ? '+' : ''}{aiSettings.accuracyModifier}%</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <label>⚡ Tốc độ</label>
                    <div className="setting-control">
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={aiSettings.speedMultiplier}
                        onChange={(e) => updateAISettings(aiId, { speedMultiplier: Number(e.target.value) })}
                      />
                      <span className="value">{aiSettings.speedMultiplier.toFixed(1)}x</span>
                    </div>
                  </div>
                  <div className="setting-row">
                    <label>📊 Độ khó tối thiểu</label>
                    <div className="difficulty-buttons">
                      {DIFFICULTY_OPTIONS.map(d => (
                        <button
                          key={d.value}
                          className={`diff-btn ${aiSettings.minDifficulty === d.value ? 'active' : ''}`}
                          onClick={() => updateAISettings(aiId, { minDifficulty: d.value })}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lesson Selection for current JLPT level */}
                  <div className="lesson-selection">
                    <div className="lesson-header">
                      <label>📚 Bài học nguồn ({selectedLevel})</label>
                      <button
                        className="select-all-btn"
                        onClick={() => selectAllLessons(aiId, selectedLevel)}
                        disabled={lessonsLoading}
                      >
                        {selectedLessonIds.length === 0 ? '✓ Tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>

                    {lessonsLoading ? (
                      <p className="no-lessons">Đang tải bài học...</p>
                    ) : levelLessons.length === 0 ? (
                      <p className="no-lessons">Chưa có bài học nào trong {selectedLevel}</p>
                    ) : (
                      <div className="lesson-tree">
                        {levelLessons.map(parentLesson => {
                          const childLessons = getChildLessons(parentLesson.id);
                          const isParentSelected = selectedLessonIds.length === 0 || selectedLessonIds.includes(parentLesson.id);

                          return (
                            <div key={parentLesson.id} className="lesson-group">
                              <button
                                className={`lesson-item parent ${isParentSelected ? 'selected' : ''}`}
                                onClick={() => toggleLesson(aiId, selectedLevel, parentLesson.id)}
                              >
                                <span className="lesson-check">{isParentSelected ? '☑' : '☐'}</span>
                                <span className="lesson-name">{parentLesson.name}</span>
                              </button>

                              {childLessons.length > 0 && (
                                <div className="lesson-children">
                                  {childLessons.map(child => {
                                    const isChildSelected = selectedLessonIds.length === 0 || selectedLessonIds.includes(child.id);
                                    return (
                                      <button
                                        key={child.id}
                                        className={`lesson-item child ${isChildSelected ? 'selected' : ''}`}
                                        onClick={() => toggleLesson(aiId, selectedLevel, child.id)}
                                      >
                                        <span className="lesson-check">{isChildSelected ? '☑' : '☐'}</span>
                                        <span className="lesson-name">{child.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <p className="setting-note">
                      * Rỗng = lấy từ tất cả bài học. Nếu không đủ câu hỏi, sẽ lấy thêm từ độ khó thấp hơn.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Settings */}
      <div className="gm-global-settings">
        <h4>⚙️ Cài đặt chung</h4>
        <div className="global-settings-row">
          <div className="global-setting">
            <label>📝 Số câu hỏi</label>
            <div className="setting-control">
              <input
                type="range"
                min="5"
                max="20"
                value={settings.aiChallengeQuestionCount}
                onChange={(e) => updateSetting('aiChallengeQuestionCount', Number(e.target.value))}
              />
              <span className="value">{settings.aiChallengeQuestionCount} câu</span>
            </div>
          </div>
          <div className="global-setting">
            <label>⏱️ Thời gian/câu</label>
            <div className="setting-control">
              <input
                type="range"
                min="5"
                max="30"
                value={settings.aiChallengeTimePerQuestion}
                onChange={(e) => updateSetting('aiChallengeTimePerQuestion', Number(e.target.value))}
              />
              <span className="value">{settings.aiChallengeTimePerQuestion}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
