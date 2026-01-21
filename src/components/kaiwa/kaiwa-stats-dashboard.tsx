// Kaiwa Stats Dashboard - Learning progress & statistics visualization
// Shows streaks, achievements, level progress, and session history

import { useState } from 'react';
import {
  Trophy,
  Flame,
  Clock,
  MessageSquare,
  TrendingUp,
  Star,
  Calendar,
  ChevronRight,
  Award,
  X,
  BarChart3,
} from 'lucide-react';
import type { KaiwaStats, KaiwaSession, KaiwaDailyRecord } from '../../types/kaiwa-session';
import type { JLPTLevel } from '../../types/kaiwa';

interface KaiwaStatsDashboardProps {
  stats: KaiwaStats;
  recentSessions: KaiwaSession[];
  weeklyStats: {
    sessions: number;
    minutes: number;
    avgScore: number;
    activeDays: number;
  };
  dailyRecords: KaiwaDailyRecord[];
  onClose: () => void;
  onViewSession?: (session: KaiwaSession) => void;
}

type DashboardTab = 'overview' | 'achievements' | 'history' | 'levels';

const JLPT_COLORS: Record<JLPTLevel, string> = {
  N5: '#22c55e',
  N4: '#3b82f6',
  N3: '#a855f7',
  N2: '#f97316',
  N1: '#ef4444',
};

export function KaiwaStatsDashboard({
  stats,
  recentSessions,
  weeklyStats,
  dailyRecords,
  onClose,
  onViewSession,
}: KaiwaStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Calculate achievement progress
  const unlockedAchievements = stats.achievements.filter(a => a.unlockedAt);
  const achievementProgress = (unlockedAchievements.length / stats.achievements.length) * 100;

  // Generate heatmap data for last 30 days
  const generateHeatmapData = () => {
    const data: { date: string; count: number; minutes: number }[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = dailyRecords.find(d => d.date === dateStr);

      data.push({
        date: dateStr,
        count: record?.sessionsCount || 0,
        minutes: record?.totalMinutes || 0,
      });
    }

    return data;
  };

  const heatmapData = generateHeatmapData();

  // Get intensity class for heatmap
  const getHeatmapIntensity = (count: number) => {
    if (count === 0) return 'empty';
    if (count === 1) return 'low';
    if (count <= 3) return 'medium';
    return 'high';
  };

  return (
    <div className="kaiwa-stats-modal-overlay" onClick={onClose}>
      <div className="kaiwa-stats-modal" onClick={e => e.stopPropagation()}>
        <div className="stats-modal-header">
          <h2><BarChart3 size={24} /> Thống kê học tập</h2>
          <button className="stats-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="stats-tabs">
          <button
            className={`stats-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp size={16} /> Tổng quan
          </button>
          <button
            className={`stats-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <Trophy size={16} /> Thành tựu
          </button>
          <button
            className={`stats-tab ${activeTab === 'levels' ? 'active' : ''}`}
            onClick={() => setActiveTab('levels')}
          >
            <Star size={16} /> Cấp độ
          </button>
          <button
            className={`stats-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Calendar size={16} /> Lịch sử
          </button>
        </div>

        <div className="stats-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="stats-overview">
              {/* Streak Card */}
              <div className="stats-card streak-card">
                <div className="streak-icon">
                  <Flame size={32} />
                </div>
                <div className="streak-info">
                  <span className="streak-count">{stats.currentStreak}</span>
                  <span className="streak-label">Ngày liên tiếp</span>
                </div>
                <div className="streak-best">
                  Kỷ lục: {stats.longestStreak} ngày
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="stats-grid">
                <div className="stat-item">
                  <MessageSquare size={20} />
                  <span className="stat-value">{stats.totalSessions}</span>
                  <span className="stat-label">Sessions</span>
                </div>
                <div className="stat-item">
                  <Clock size={20} />
                  <span className="stat-value">{Math.round(stats.totalMinutes / 60)}h</span>
                  <span className="stat-label">Tổng thời gian</span>
                </div>
                <div className="stat-item">
                  <TrendingUp size={20} />
                  <span className="stat-value">{stats.avgScore.toFixed(1)}</span>
                  <span className="stat-label">Điểm TB</span>
                </div>
                <div className="stat-item">
                  <Award size={20} />
                  <span className="stat-value">{unlockedAchievements.length}</span>
                  <span className="stat-label">Thành tựu</span>
                </div>
              </div>

              {/* Weekly Summary */}
              <div className="stats-section">
                <h3>Tuần này</h3>
                <div className="weekly-summary">
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyStats.sessions}</span>
                    <span className="weekly-label">sessions</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyStats.minutes}m</span>
                    <span className="weekly-label">luyện tập</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyStats.avgScore.toFixed(1)}</span>
                    <span className="weekly-label">điểm TB</span>
                  </div>
                  <div className="weekly-stat">
                    <span className="weekly-value">{weeklyStats.activeDays}/7</span>
                    <span className="weekly-label">ngày</span>
                  </div>
                </div>
              </div>

              {/* Activity Heatmap */}
              <div className="stats-section">
                <h3>Hoạt động 30 ngày qua</h3>
                <div className="activity-heatmap">
                  {heatmapData.map((day) => (
                    <div
                      key={day.date}
                      className={`heatmap-cell ${getHeatmapIntensity(day.count)}`}
                      title={`${day.date}: ${day.count} sessions, ${day.minutes}m`}
                    />
                  ))}
                </div>
                <div className="heatmap-legend">
                  <span>Ít</span>
                  <div className="heatmap-cell empty" />
                  <div className="heatmap-cell low" />
                  <div className="heatmap-cell medium" />
                  <div className="heatmap-cell high" />
                  <span>Nhiều</span>
                </div>
              </div>

              {/* Pronunciation Stats */}
              {stats.pronunciationStats.totalAttempts > 0 && (
                <div className="stats-section">
                  <h3>Phát âm</h3>
                  <div className="pronunciation-stats">
                    <div className="pron-stat">
                      <span className="pron-value">{stats.pronunciationStats.totalAttempts}</span>
                      <span className="pron-label">Lần thử</span>
                    </div>
                    <div className="pron-stat">
                      <span className="pron-value">{stats.pronunciationStats.avgAccuracy.toFixed(0)}%</span>
                      <span className="pron-label">TB chính xác</span>
                    </div>
                    <div className="pron-stat">
                      <span className="pron-value">{stats.pronunciationStats.bestAccuracy.toFixed(0)}%</span>
                      <span className="pron-label">Cao nhất</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="stats-achievements">
              <div className="achievements-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${achievementProgress}%` }} />
                </div>
                <span>{unlockedAchievements.length}/{stats.achievements.length} đã mở khóa</span>
              </div>

              <div className="achievements-grid">
                {stats.achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${achievement.unlockedAt ? 'unlocked' : 'locked'}`}
                  >
                    <span className="achievement-icon">{achievement.icon}</span>
                    <div className="achievement-info">
                      <span className="achievement-name">{achievement.name}</span>
                      <span className="achievement-name-ja">{achievement.nameJa}</span>
                      <span className="achievement-desc">{achievement.description}</span>
                    </div>
                    {!achievement.unlockedAt && achievement.progress !== undefined && (
                      <div className="achievement-progress">
                        <div
                          className="achievement-progress-bar"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    )}
                    {achievement.unlockedAt && (
                      <span className="achievement-date">
                        {new Date(achievement.unlockedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Levels Tab */}
          {activeTab === 'levels' && (
            <div className="stats-levels">
              {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(level => {
                const progress = stats.levelProgress[level];
                const maxSessions = Math.max(...Object.values(stats.levelProgress).map(p => p.sessions));
                const barWidth = maxSessions > 0 ? (progress.sessions / maxSessions) * 100 : 0;

                return (
                  <div key={level} className="level-card">
                    <div className="level-header">
                      <span className="level-badge" style={{ backgroundColor: JLPT_COLORS[level] }}>
                        {level}
                      </span>
                      <span className="level-sessions">{progress.sessions} sessions</span>
                    </div>
                    <div className="level-bar-container">
                      <div
                        className="level-bar"
                        style={{ width: `${barWidth}%`, backgroundColor: JLPT_COLORS[level] }}
                      />
                    </div>
                    <div className="level-details">
                      <span className="level-score">
                        Điểm TB: {progress.avgScore > 0 ? progress.avgScore.toFixed(1) : '-'}
                      </span>
                      {progress.lastPracticed && (
                        <span className="level-last">
                          Cuối: {new Date(progress.lastPracticed).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="stats-history">
              {recentSessions.length === 0 ? (
                <div className="no-sessions">
                  <MessageSquare size={48} />
                  <p>Chưa có session nào được ghi nhận</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {recentSessions.map(session => (
                    <div
                      key={session.id}
                      className="session-card"
                      onClick={() => onViewSession?.(session)}
                    >
                      <div className="session-header">
                        <span className="session-level" style={{ backgroundColor: JLPT_COLORS[session.level] }}>
                          {session.level}
                        </span>
                        <span className="session-date">
                          {new Date(session.startTime).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="session-details">
                        <span><MessageSquare size={14} /> {session.userMessageCount} trao đổi</span>
                        <span><Clock size={14} /> {session.durationMinutes}m</span>
                        {session.evaluation && (
                          <span className="session-score">
                            <Star size={14} /> {session.evaluation.overallScore}/10
                          </span>
                        )}
                      </div>
                      {session.topicName && (
                        <span className="session-topic">{session.topicName}</span>
                      )}
                      {onViewSession && (
                        <ChevronRight size={16} className="session-arrow" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
