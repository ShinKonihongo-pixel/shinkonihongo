// Progress tracking dashboard page

import type { ProgressSummary } from '../../types/progress';
import { Flame, Snowflake, BookOpen, Clock, Target, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';

interface ProgressPageProps {
  progress: ProgressSummary;
  onStartStudy: () => void;
}

export function ProgressPage({ progress, onStartStudy }: ProgressPageProps) {
  const { dailyActivity, streak, levelProgress, weeklyGoal, cardsDueToday, totalXP, currentLevel, levelTitle } = progress;

  // Get max value for activity chart scaling
  const maxActivity = Math.max(
    ...dailyActivity.map(d => d.cardsStudied + d.jlptPracticed + d.gamesPlayed * 5),
    1
  );

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  return (
    <div className="progress-page">
      {/* Header Stats */}
      <div className="progress-header">
        <div className="progress-level-card">
          <div className="level-circle">
            <span className="level-number">{currentLevel}</span>
          </div>
          <div className="level-info">
            <span className="level-title">{levelTitle}</span>
            <span className="level-xp">{totalXP.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="progress-streak-card">
          <div className="streak-flame">{streak.isActiveToday ? <Flame size={32} color="#ff6b35" /> : <Snowflake size={32} color="#74b9ff" />}</div>
          <div className="streak-info">
            <span className="streak-count">{streak.currentStreak}</span>
            <span className="streak-label">ngày liên tiếp</span>
          </div>
          <div className="streak-best">
            Kỷ lục: {streak.longestStreak} ngày
          </div>
        </div>

        <div className="progress-due-card" onClick={onStartStudy}>
          <div className="due-count">{cardsDueToday}</div>
          <div className="due-label">thẻ cần ôn hôm nay</div>
          {cardsDueToday > 0 && (
            <button className="btn btn-primary btn-small">Ôn ngay</button>
          )}
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="progress-section">
        <h3>Mục tiêu tuần này</h3>
        <div className="weekly-goals">
          <div className="goal-item">
            <div className="goal-header">
              <span className="goal-icon"><BookOpen size={18} /></span>
              <span className="goal-title">Thẻ đã học</span>
              <span className="goal-count">
                {weeklyGoal.cardsCompleted}/{weeklyGoal.cardsTarget}
              </span>
            </div>
            <div className="goal-bar">
              <div
                className="goal-fill"
                style={{ width: `${Math.min(100, (weeklyGoal.cardsCompleted / weeklyGoal.cardsTarget) * 100)}%` }}
              />
            </div>
          </div>

          <div className="goal-item">
            <div className="goal-header">
              <span className="goal-icon"><Clock size={18} /></span>
              <span className="goal-title">Thời gian học</span>
              <span className="goal-count">
                {weeklyGoal.minutesCompleted}/{weeklyGoal.minutesTarget} phút
              </span>
            </div>
            <div className="goal-bar">
              <div
                className="goal-fill time"
                style={{ width: `${Math.min(100, (weeklyGoal.minutesCompleted / weeklyGoal.minutesTarget) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="progress-section">
        <h3>Hoạt động 2 tuần qua</h3>
        <div className="activity-chart">
          {dailyActivity.map((day, i) => {
            const height = ((day.cardsStudied + day.jlptPracticed + day.gamesPlayed * 5) / maxActivity) * 100;
            const isToday = i === dailyActivity.length - 1;

            return (
              <div key={day.date} className={`activity-bar-container ${isToday ? 'today' : ''}`}>
                <div className="activity-bar-wrapper">
                  <div
                    className="activity-bar"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.cardsStudied} thẻ, ${day.jlptPracticed} JLPT, ${day.gamesPlayed} game`}
                  >
                    {height > 20 && (
                      <span className="activity-value">{day.cardsStudied + day.jlptPracticed}</span>
                    )}
                  </div>
                </div>
                <span className="activity-label">{formatDate(day.date)}</span>
              </div>
            );
          })}
        </div>
        <div className="activity-legend">
          <span><BarChart3 size={14} /> Tổng hoạt động (thẻ + JLPT + game)</span>
        </div>
      </div>

      {/* Level Progress */}
      <div className="progress-section">
        <h3>Tiến độ theo cấp độ</h3>
        <div className="level-progress-list">
          {levelProgress.map(lp => (
            <div key={lp.level} className="level-progress-item">
              <div className="level-progress-header">
                <span className="level-badge">{lp.level}</span>
                <span className="level-stats">
                  {lp.memorized}/{lp.totalCards} thuộc
                  {lp.dueForReview > 0 && (
                    <span className="due-badge">{lp.dueForReview} cần ôn</span>
                  )}
                </span>
              </div>
              <div className="level-progress-bar">
                <div
                  className="level-fill memorized"
                  style={{ width: `${lp.totalCards > 0 ? (lp.memorized / lp.totalCards) * 100 : 0}%` }}
                />
                <div
                  className="level-fill learning"
                  style={{
                    width: `${lp.totalCards > 0 ? (lp.learning / lp.totalCards) * 100 : 0}%`,
                    marginLeft: `${lp.totalCards > 0 ? (lp.memorized / lp.totalCards) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="level-progress-labels">
                <span className="mastery-percent">{lp.masteryPercent}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="level-legend">
          <span className="legend-item">
            <span className="legend-color memorized"></span> Đã thuộc
          </span>
          <span className="legend-item">
            <span className="legend-color learning"></span> Đang học
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="progress-section">
        <h3>Thống kê nhanh</h3>
        <div className="quick-stats">
          <div className="stat-card">
            <span className="stat-icon"><BookOpen size={20} /></span>
            <span className="stat-value">{levelProgress.reduce((s, l) => s + l.totalCards, 0)}</span>
            <span className="stat-label">Tổng số thẻ</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><CheckCircle size={20} /></span>
            <span className="stat-value">{levelProgress.reduce((s, l) => s + l.memorized, 0)}</span>
            <span className="stat-label">Đã thuộc</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><Target size={20} /></span>
            <span className="stat-value">
              {Math.round(
                (levelProgress.reduce((s, l) => s + l.memorized, 0) /
                  Math.max(levelProgress.reduce((s, l) => s + l.totalCards, 0), 1)) * 100
              )}%
            </span>
            <span className="stat-label">Tỷ lệ thuộc</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon"><TrendingUp size={20} /></span>
            <span className="stat-value">{levelProgress.reduce((s, l) => s + l.learning, 0)}</span>
            <span className="stat-label">Đang học</span>
          </div>
        </div>
      </div>
    </div>
  );
}
