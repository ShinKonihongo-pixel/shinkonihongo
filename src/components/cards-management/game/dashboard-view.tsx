// Game Tab - Dashboard View

import { Gamepad2, Settings, ChevronRight, TrendingUp, Users, Clock, Activity, Eye, EyeOff, AlertCircle, Zap, RefreshCw, Check } from 'lucide-react';
import type { GameVisibilitySettings } from '../../../services/game-visibility-storage';
import type { GameType } from '../../../types/game-hub';
import { ALL_GAMES, type DashboardStats, type GameSection } from './game-tab-types';

interface DashboardViewProps {
  visibilitySettings: GameVisibilitySettings;
  dashboardStats: DashboardStats;
  isRefreshing: boolean;
  toastMessage: string | null;
  onSectionChange: (section: GameSection) => void;
  onToggleVisibility: (gameId: GameType, e: React.MouseEvent) => void;
  onShowAllGames: () => void;
  onRefresh: () => void;
}

export function DashboardView({
  visibilitySettings,
  dashboardStats,
  isRefreshing,
  toastMessage,
  onSectionChange,
  onToggleVisibility,
  onShowAllGames,
  onRefresh,
}: DashboardViewProps) {
  const isHidden = (gameId: GameType) => visibilitySettings.hiddenGames.includes(gameId);
  const hiddenCount = visibilitySettings.hiddenGames.length;

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
            onClick={onRefresh}
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={18} />
          </button>
          <button
            className="gm-btn-secondary"
            onClick={() => onSectionChange('global-settings')}
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
          <button className="gm-btn-text" onClick={onShowAllGames}>
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
                onClick={() => game.hasManager && onSectionChange(game.id as GameSection)}
              >
                {/* Visibility Toggle Button */}
                <button
                  className={`gm-visibility-toggle ${hidden ? 'hidden' : 'visible'}`}
                  onClick={(e) => onToggleVisibility(game.id, e)}
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
