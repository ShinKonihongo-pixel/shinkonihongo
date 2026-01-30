// Progress tracking dashboard page - Premium UI with glassmorphism design
// Features: XP ring animation, medal showcase, activity chart, level progress

import { useMemo } from 'react';
import type { ProgressSummary } from '../../types/progress';
import type { UserStats, UserLevel } from '../../types/user';
import { calculateUserLevel } from '../../types/user';
import {
  Flame,
  Snowflake,
  BookOpen,
  Clock,
  Target,
  CheckCircle,
  TrendingUp,
  Zap,
  Trophy,
  Star,
  Award,
  Gamepad2,
  Medal,
  Crown,
} from 'lucide-react';

interface ProgressPageProps {
  progress: ProgressSummary;
  stats?: UserStats;
  onStartStudy: () => void;
}

// XP Ring Component with animated gradient
function XPRing({ level, xp, progress, nextLevelXp }: UserLevel & { nextLevelXp: number }) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="pp-xp-ring">
      <svg viewBox="0 0 120 120" className="pp-ring-svg">
        {/* Background circle with glow */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke="url(#xpGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 60 60)"
          className="pp-ring-progress"
        />
        {/* Glowing dots at progress end */}
        <circle
          cx="60" cy="6" r="6"
          fill="url(#xpGradient)"
          transform={`rotate(${(progress / 100) * 360 - 90} 60 60)`}
          className="pp-ring-dot"
        />
        <defs>
          <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pp-ring-content">
        <span className="pp-ring-level">Lv.{level}</span>
        <span className="pp-ring-xp">{xp.toLocaleString()} XP</span>
        <span className="pp-ring-next">{nextLevelXp - (xp % nextLevelXp)} để lên cấp</span>
      </div>
      {/* Animated glow effect */}
      <div className="pp-ring-glow" />
    </div>
  );
}

// Medal Card Component with shine effect
function MedalCard({
  type,
  count,
  label,
  icon: Icon,
}: {
  type: 'gold' | 'silver' | 'bronze' | 'total';
  count: number;
  label: string;
  icon: typeof Trophy;
}) {
  const colors = {
    gold: { bg: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)', glow: 'rgba(252,211,77,0.4)' },
    silver: { bg: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)', glow: 'rgba(148,163,184,0.4)' },
    bronze: { bg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)', glow: 'rgba(180,83,9,0.4)' },
    total: { bg: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', glow: 'rgba(168,85,247,0.4)' },
  };

  return (
    <div className={`pp-medal-card pp-medal-${type}`}>
      <div className="pp-medal-shine" />
      <div className="pp-medal-icon-wrap" style={{ background: colors[type].bg }}>
        <Icon size={24} />
      </div>
      <span className="pp-medal-count">{count}</span>
      <span className="pp-medal-label">{label}</span>
    </div>
  );
}

// Stat Card Component with gradient background
function StatCard({
  icon: Icon,
  value,
  label,
  color,
  subValue,
}: {
  icon: typeof BookOpen;
  value: string | number;
  label: string;
  color: string;
  subValue?: string;
}) {
  return (
    <div className="pp-stat-card">
      <div className="pp-stat-icon" style={{ background: color }}>
        <Icon size={20} />
      </div>
      <div className="pp-stat-info">
        <span className="pp-stat-value">{value}</span>
        <span className="pp-stat-label">{label}</span>
        {subValue && <span className="pp-stat-sub">{subValue}</span>}
      </div>
    </div>
  );
}

export function ProgressPage({ progress, stats, onStartStudy }: ProgressPageProps) {
  const { dailyActivity, streak, levelProgress, weeklyGoal, cardsDueToday, totalXP, currentLevel, levelTitle } = progress;

  // Calculate user level from stats
  const userLevel = useMemo(() => {
    if (!stats) {
      return { level: currentLevel, title: levelTitle, xp: totalXP, nextLevelXp: 100, progress: 50 };
    }
    return calculateUserLevel(stats);
  }, [stats, currentLevel, levelTitle, totalXP]);

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

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}p`;
    return `${minutes} phút`;
  };

  // Calculate totals
  const totalCards = levelProgress.reduce((s, l) => s + l.totalCards, 0);
  const totalMemorized = levelProgress.reduce((s, l) => s + l.memorized, 0);
  const totalLearning = levelProgress.reduce((s, l) => s + l.learning, 0);
  const masteryPercent = totalCards > 0 ? Math.round((totalMemorized / totalCards) * 100) : 0;

  return (
    <div className="pp">
      {/* ===== PREMIUM HERO SECTION ===== */}
      <div className="pp-hero">
        {/* Animated background */}
        <div className="pp-hero-bg">
          <div className="pp-orb pp-orb-1" />
          <div className="pp-orb pp-orb-2" />
          <div className="pp-orb pp-orb-3" />
        </div>
        <div className="pp-wave" />

        {/* Hero Header */}
        <div className="pp-hero-header">
          <div className="pp-logo">
            <span className="pp-logo-icon">進</span>
            <span className="pp-logo-text">Tiến độ</span>
          </div>
          <div className="pp-hero-title">
            <h1>
              <span className="pp-title-jp">進捗</span>
              <span className="pp-title-vn">Tiến độ học tập</span>
            </h1>
            <p className="pp-subtitle">Theo dõi hành trình chinh phục tiếng Nhật của bạn</p>
          </div>
        </div>

        {/* Main Stats Row */}
        <div className="pp-hero-main">
          {/* XP Ring */}
          <div className="pp-xp-section">
            <XPRing {...userLevel} nextLevelXp={userLevel.nextLevelXp} />
            <div className="pp-level-title">
              <Crown size={16} />
              <span>{userLevel.title}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pp-quick-stats">
            <div className="pp-quick-stat">
              <div className="pp-quick-icon streak">
                {streak.isActiveToday ? <Flame size={24} /> : <Snowflake size={24} />}
              </div>
              <div className="pp-quick-info">
                <span className="pp-quick-value">{streak.currentStreak}</span>
                <span className="pp-quick-label">ngày liên tiếp</span>
              </div>
              <span className="pp-quick-sub">Kỷ lục: {streak.longestStreak}</span>
            </div>

            <div className="pp-quick-stat clickable" onClick={onStartStudy}>
              <div className="pp-quick-icon due">
                <BookOpen size={24} />
              </div>
              <div className="pp-quick-info">
                <span className="pp-quick-value">{cardsDueToday}</span>
                <span className="pp-quick-label">thẻ cần ôn</span>
              </div>
              {cardsDueToday > 0 && (
                <button className="pp-quick-btn">Ôn ngay</button>
              )}
            </div>

            <div className="pp-quick-stat">
              <div className="pp-quick-icon mastery">
                <Target size={24} />
              </div>
              <div className="pp-quick-info">
                <span className="pp-quick-value">{masteryPercent}%</span>
                <span className="pp-quick-label">tỷ lệ thuộc</span>
              </div>
              <span className="pp-quick-sub">{totalMemorized}/{totalCards} từ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CONTENT SECTIONS ===== */}
      <div className="pp-content">
        {/* Medal Showcase */}
        {stats && (
          <section className="pp-section pp-medals-section">
            <div className="pp-section-header">
              <div className="pp-section-icon"><Trophy size={20} /></div>
              <h2>Thành tích Game</h2>
              <span className="pp-section-jp">ゲーム実績</span>
            </div>
            <div className="pp-medals-grid">
              <MedalCard type="gold" count={stats.goldMedals} label="Hạng 1" icon={Crown} />
              <MedalCard type="silver" count={stats.silverMedals} label="Hạng 2" icon={Medal} />
              <MedalCard type="bronze" count={stats.bronzeMedals} label="Hạng 3" icon={Award} />
              <MedalCard type="total" count={stats.totalMedals} label="Tổng huy chương" icon={Star} />
            </div>
          </section>
        )}

        {/* Activity Stats Grid */}
        {stats && (
          <section className="pp-section pp-stats-section">
            <div className="pp-section-header">
              <div className="pp-section-icon"><TrendingUp size={20} /></div>
              <h2>Thống kê hoạt động</h2>
              <span className="pp-section-jp">活動統計</span>
            </div>
            <div className="pp-stats-grid">
              <StatCard
                icon={BookOpen}
                value={stats.totalStudySessions}
                label="Phiên học"
                color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                subValue={`${stats.totalCardsStudied} thẻ đã học`}
              />
              <StatCard
                icon={Clock}
                value={formatDuration(stats.totalStudyTime)}
                label="Thời gian học"
                color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              />
              <StatCard
                icon={Gamepad2}
                value={stats.totalGamesPlayed}
                label="Game đã chơi"
                color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                subValue={`${stats.totalGameWins} chiến thắng`}
              />
              <StatCard
                icon={Award}
                value={stats.totalJLPTSessions}
                label="Phiên luyện JLPT"
                color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                subValue={`${stats.totalJLPTCorrect}/${stats.totalJLPTQuestions} đúng`}
              />
            </div>
          </section>
        )}

        {/* Weekly Goals */}
        <section className="pp-section pp-goals-section">
          <div className="pp-section-header">
            <div className="pp-section-icon"><Target size={20} /></div>
            <h2>Mục tiêu tuần</h2>
            <span className="pp-section-jp">週間目標</span>
          </div>
          <div className="pp-goals">
            <div className="pp-goal">
              <div className="pp-goal-header">
                <div className="pp-goal-icon cards">
                  <BookOpen size={18} />
                </div>
                <div className="pp-goal-info">
                  <span className="pp-goal-title">Thẻ đã học</span>
                  <span className="pp-goal-count">
                    <strong>{weeklyGoal.cardsCompleted}</strong>/{weeklyGoal.cardsTarget}
                  </span>
                </div>
                <span className="pp-goal-percent">
                  {Math.round((weeklyGoal.cardsCompleted / weeklyGoal.cardsTarget) * 100)}%
                </span>
              </div>
              <div className="pp-goal-bar">
                <div
                  className="pp-goal-fill cards"
                  style={{ width: `${Math.min(100, (weeklyGoal.cardsCompleted / weeklyGoal.cardsTarget) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pp-goal">
              <div className="pp-goal-header">
                <div className="pp-goal-icon time">
                  <Clock size={18} />
                </div>
                <div className="pp-goal-info">
                  <span className="pp-goal-title">Thời gian học</span>
                  <span className="pp-goal-count">
                    <strong>{weeklyGoal.minutesCompleted}</strong>/{weeklyGoal.minutesTarget} phút
                  </span>
                </div>
                <span className="pp-goal-percent">
                  {Math.round((weeklyGoal.minutesCompleted / weeklyGoal.minutesTarget) * 100)}%
                </span>
              </div>
              <div className="pp-goal-bar">
                <div
                  className="pp-goal-fill time"
                  style={{ width: `${Math.min(100, (weeklyGoal.minutesCompleted / weeklyGoal.minutesTarget) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Activity Chart */}
        <section className="pp-section pp-chart-section">
          <div className="pp-section-header">
            <div className="pp-section-icon"><TrendingUp size={20} /></div>
            <h2>Hoạt động 2 tuần</h2>
            <span className="pp-section-jp">活動履歴</span>
          </div>
          <div className="pp-activity-chart">
            {dailyActivity.map((day, i) => {
              const total = day.cardsStudied + day.jlptPracticed + day.gamesPlayed * 5;
              const height = (total / maxActivity) * 100;
              const isToday = i === dailyActivity.length - 1;

              return (
                <div key={day.date} className={`pp-chart-bar ${isToday ? 'today' : ''}`}>
                  <div className="pp-chart-bar-wrap">
                    <div
                      className="pp-chart-fill"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    >
                      {height > 25 && (
                        <span className="pp-chart-value">{total}</span>
                      )}
                    </div>
                  </div>
                  <span className="pp-chart-label">{formatDate(day.date)}</span>
                </div>
              );
            })}
          </div>
          <div className="pp-chart-legend">
            <span className="pp-legend-item">
              <span className="pp-legend-dot cards" />
              Thẻ học
            </span>
            <span className="pp-legend-item">
              <span className="pp-legend-dot jlpt" />
              JLPT
            </span>
            <span className="pp-legend-item">
              <span className="pp-legend-dot games" />
              Game
            </span>
          </div>
        </section>

        {/* Level Progress */}
        <section className="pp-section pp-levels-section">
          <div className="pp-section-header">
            <div className="pp-section-icon"><Zap size={20} /></div>
            <h2>Tiến độ theo cấp độ</h2>
            <span className="pp-section-jp">レベル進捗</span>
          </div>
          <div className="pp-levels-list">
            {levelProgress.map(lp => {
              const memorizedPercent = lp.totalCards > 0 ? (lp.memorized / lp.totalCards) * 100 : 0;
              const learningPercent = lp.totalCards > 0 ? (lp.learning / lp.totalCards) * 100 : 0;

              return (
                <div key={lp.level} className="pp-level-item">
                  <div className="pp-level-header">
                    <span className={`pp-level-badge level-${lp.level.toLowerCase()}`}>{lp.level}</span>
                    <div className="pp-level-stats">
                      <span className="pp-level-memorized">{lp.memorized} thuộc</span>
                      <span className="pp-level-total">/ {lp.totalCards}</span>
                      {lp.dueForReview > 0 && (
                        <span className="pp-level-due">{lp.dueForReview} cần ôn</span>
                      )}
                    </div>
                    <span className="pp-level-percent">{lp.masteryPercent}%</span>
                  </div>
                  <div className="pp-level-bar">
                    <div
                      className="pp-level-fill memorized"
                      style={{ width: `${memorizedPercent}%` }}
                    />
                    <div
                      className="pp-level-fill learning"
                      style={{ width: `${learningPercent}%`, left: `${memorizedPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pp-levels-legend">
            <span className="pp-legend-item">
              <span className="pp-legend-box memorized" />
              Đã thuộc
            </span>
            <span className="pp-legend-item">
              <span className="pp-legend-box learning" />
              Đang học
            </span>
          </div>
        </section>

        {/* Summary Stats */}
        <section className="pp-section pp-summary-section">
          <div className="pp-summary-grid">
            <div className="pp-summary-card">
              <BookOpen size={24} />
              <span className="pp-summary-value">{totalCards.toLocaleString()}</span>
              <span className="pp-summary-label">Tổng số thẻ</span>
            </div>
            <div className="pp-summary-card">
              <CheckCircle size={24} />
              <span className="pp-summary-value">{totalMemorized.toLocaleString()}</span>
              <span className="pp-summary-label">Đã thuộc</span>
            </div>
            <div className="pp-summary-card">
              <TrendingUp size={24} />
              <span className="pp-summary-value">{totalLearning.toLocaleString()}</span>
              <span className="pp-summary-label">Đang học</span>
            </div>
            <div className="pp-summary-card highlight">
              <Zap size={24} />
              <span className="pp-summary-value">{userLevel.xp.toLocaleString()}</span>
              <span className="pp-summary-label">Tổng XP</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
