// Badge statistics display component with radar chart and shield-shaped badges

import { useMemo } from 'react';
import type { UserBadgeStats, BadgeGift } from '../../types/friendship';
import { BADGE_DEFINITIONS, getBadgeDefinition } from '../../types/friendship';
import { BadgeRadarChart } from './badge-radar-chart';
import { BadgeShape, MiniBadge } from './badge-shape';
import { Award, Gift, TrendingUp, Star, Crown } from 'lucide-react';

interface BadgeStatsDisplayProps {
  stats: UserBadgeStats | null;
  recentBadges?: Array<BadgeGift & { fromUserName: string }>;
  compact?: boolean;
}

export function BadgeStatsDisplay({
  stats,
  recentBadges = [],
  compact = false,
}: BadgeStatsDisplayProps) {
  // Calculate top badges and analytics
  const analytics = useMemo(() => {
    if (!stats) return null;

    const sortedBadges = [...BADGE_DEFINITIONS]
      .map(badge => ({
        ...badge,
        count: stats.receivedCounts[badge.type] || 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topBadge = sortedBadges[0]?.count > 0 ? sortedBadges[0] : null;
    const earnedBadges = sortedBadges.filter(b => b.count > 0);
    const totalBadgeTypes = BADGE_DEFINITIONS.length;
    const completionRate = Math.round((earnedBadges.length / totalBadgeTypes) * 100);

    return {
      sortedBadges,
      topBadge,
      earnedBadges,
      completionRate,
    };
  }, [stats]);

  if (!stats) {
    return (
      <div className="badge-stats-empty-pro">
        <div className="empty-icon-wrapper">
          <Award size={48} strokeWidth={1.5} />
        </div>
        <h4>Chưa có huy hiệu</h4>
        <p>Hãy tương tác với bạn bè để nhận huy hiệu đầu tiên!</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="badge-stats-compact-pro">
        <div className="compact-summary">
          <Crown size={18} className="icon-gold" />
          <span className="compact-total">{stats.totalReceived}</span>
          <span className="compact-label">huy hiệu</span>
        </div>
        <div className="compact-badges">
          {analytics?.sortedBadges.slice(0, 5).map(badge => {
            if (badge.count === 0) return null;
            return (
              <MiniBadge
                key={badge.type}
                icon={badge.icon}
                color={badge.color}
                count={badge.count}
                name={badge.name}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="badge-stats-pro">
      {/* Header Section */}
      <div className="badge-header-section">
        <div className="header-title">
          <Award size={24} />
          <div>
            <h3>Huy hiệu của tôi</h3>
            <p className="header-subtitle">Thành tích được bạn bè ghi nhận</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-pill received">
            <Gift size={16} />
            <span>{stats.totalReceived}</span>
            <span className="label">nhận</span>
          </div>
          <div className="stat-pill sent">
            <TrendingUp size={16} />
            <span>{stats.totalSent}</span>
            <span className="label">tặng</span>
          </div>
        </div>
      </div>

      {/* Main Content: Radar Chart + Stats */}
      <div className="badge-main-content">
        {/* Radar Chart */}
        <div className="radar-section">
          <BadgeRadarChart stats={stats} size={280} />
          <p className="radar-description">Biểu đồ phân bố huy hiệu</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-section">
          {/* Top Badge Card */}
          {analytics?.topBadge && (
            <div className="top-badge-card">
              <div className="card-header">
                <Star size={16} className="icon-gold" />
                <span>Huy hiệu nổi bật</span>
              </div>
              <div className="top-badge-content">
                <BadgeShape
                  icon={analytics.topBadge.icon}
                  color={analytics.topBadge.color}
                  size={64}
                  showTooltip={false}
                />
                <div className="top-badge-info">
                  <span className="top-badge-name" title={analytics.topBadge.name}>
                    {analytics.topBadge.name}
                  </span>
                  <span className="top-badge-count">×{analytics.topBadge.count}</span>
                </div>
              </div>
            </div>
          )}

          {/* Completion Progress */}
          <div className="completion-card">
            <div className="card-header">
              <Crown size={16} />
              <span>Tiến độ sưu tập</span>
            </div>
            <div className="completion-content">
              <div className="completion-bar">
                <div
                  className="completion-fill"
                  style={{ width: `${analytics?.completionRate || 0}%` }}
                />
              </div>
              <div className="completion-text">
                <span className="completion-count">
                  {analytics?.earnedBadges.length}/{BADGE_DEFINITIONS.length}
                </span>
                <span className="completion-percent">{analytics?.completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Collection Grid */}
      <div className="badge-collection">
        <h4>Bộ sưu tập huy hiệu</h4>
        <div className="collection-grid-shields">
          {analytics?.sortedBadges.map(badge => (
            <div
              key={badge.type}
              className={`collection-shield-item ${badge.count > 0 ? 'earned' : 'locked'}`}
            >
              <BadgeShape
                icon={badge.icon}
                color={badge.color}
                size={52}
                count={badge.count}
                name={badge.name}
                description={badge.description}
                locked={badge.count === 0}
                showTooltip={true}
              />
              <div className="shield-item-details">
                <span className="shield-item-name" title={badge.name}>
                  {badge.name}
                </span>
                <span className="shield-item-count">
                  {badge.count > 0 ? `×${badge.count}` : 'Chưa có'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div className="recent-badges-section">
          <h4>
            <Gift size={16} />
            Nhận gần đây
          </h4>
          <div className="recent-list">
            {recentBadges.slice(0, 5).map(gift => {
              const badgeDef = getBadgeDefinition(gift.badgeType);
              if (!badgeDef) return null;
              return (
                <div key={gift.id} className="recent-item">
                  <BadgeShape
                    icon={badgeDef.icon}
                    color={badgeDef.color}
                    size={40}
                    showTooltip={false}
                  />
                  <div className="recent-content">
                    <span className="recent-name" title={badgeDef.name}>
                      {badgeDef.name}
                    </span>
                    <span className="recent-from">từ {gift.fromUserName}</span>
                    {gift.message && (
                      <span className="recent-message">"{gift.message}"</span>
                    )}
                  </div>
                  <span className="recent-time">
                    {formatRelativeTime(gift.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Format relative time (e.g., "2 giờ trước")
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return new Date(dateStr).toLocaleDateString('vi-VN');
}
