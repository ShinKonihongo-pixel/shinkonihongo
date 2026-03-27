// Analytics Dashboard Page — comprehensive learning analytics with pure SVG charts
// Dark glassmorphism design, Vietnamese labels, real session data

import { BarChart3, TrendingUp, Target, Gamepad2, BookOpen, Brain, Calendar } from 'lucide-react';
import { useAnalyticsData } from '../../hooks/use-analytics-data';
import { useUserData } from '../../contexts/user-data-context';
import { useFlashcardData } from '../../contexts/flashcard-data-context';
import {
  HorizontalBarChart,
  AreaChart,
  ConcentricRings,
  MultiLineChart,
  LineAreaChart,
  DonutChart,
  GroupedBarChart,
  CHART_COLORS,
} from '../analytics/svg-charts';
import './analytics-dashboard-page.css';

export function AnalyticsDashboardPage() {
  const { studySessions, gameSessions, jlptSessions, userStats } = useUserData();
  const { cards, grammarCards, kanjiCards } = useFlashcardData();
  const data = useAnalyticsData({
    studySessions,
    gameSessions,
    jlptSessions,
    userStats,
    cards,
    grammarCards,
    kanjiCards,
  });

  // Summary stats for header row
  const totalSessions = userStats.totalStudySessions + userStats.totalGamesPlayed + userStats.totalJLPTSessions;
  const totalMinutes = Math.round(userStats.totalStudyTime / 60);

  // Empty state: no activity at all
  if (totalSessions === 0 && userStats.totalCardsStudied === 0) {
    return (
      <div className="ad-page">
        <div className="ad-header">
          <div className="ad-header-icon">
            <BarChart3 size={24} />
          </div>
          <div className="ad-header-text">
            <h1 className="ad-title">Phân tích học tập</h1>
            <span className="ad-title-jp">学習分析</span>
          </div>
        </div>
        <div className="ad-empty-state">
          <div className="ad-empty-icon">
            <BarChart3 size={32} />
          </div>
          <h2 className="ad-empty-title">Chưa có dữ liệu học tập</h2>
          <p className="ad-empty-desc">
            Bắt đầu học flashcard, luyện JLPT hoặc chơi game để xem thống kê chi tiết tại đây.
          </p>
          <button className="ad-empty-cta" onClick={() => window.history.back()}>
            <BookOpen size={16} />
            Bắt đầu học ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-page">
      {/* Header */}
      <div className="ad-header">
        <div className="ad-header-icon">
          <BarChart3 size={24} />
        </div>
        <div className="ad-header-text">
          <h1 className="ad-title">Phân tích học tập</h1>
          <span className="ad-title-jp">学習分析</span>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="ad-kpi-row">
        <div className="ad-kpi">
          <span className="ad-kpi-icon"><BookOpen size={18} /></span>
          <div>
            <div className="ad-kpi-value">{userStats.totalCardsStudied.toLocaleString()}</div>
            <div className="ad-kpi-label">Thẻ đã học</div>
          </div>
        </div>
        <div className="ad-kpi">
          <span className="ad-kpi-icon"><Calendar size={18} /></span>
          <div>
            <div className="ad-kpi-value">{totalSessions.toLocaleString()}</div>
            <div className="ad-kpi-label">Phiên học</div>
          </div>
        </div>
        <div className="ad-kpi">
          <span className="ad-kpi-icon"><TrendingUp size={18} /></span>
          <div>
            <div className="ad-kpi-value">{totalMinutes.toLocaleString()} ph</div>
            <div className="ad-kpi-label">Tổng thời gian</div>
          </div>
        </div>
        <div className="ad-kpi">
          <span className="ad-kpi-icon"><Target size={18} /></span>
          <div>
            <div className="ad-kpi-value">{data.jlptAccuracy}%</div>
            <div className="ad-kpi-label">Độ chính xác JLPT</div>
          </div>
        </div>
        <div className="ad-kpi">
          <span className="ad-kpi-icon"><Gamepad2 size={18} /></span>
          <div>
            <div className="ad-kpi-value">{userStats.totalGameWins}</div>
            <div className="ad-kpi-label">Lần thắng game</div>
          </div>
        </div>
        <div className="ad-kpi">
          <span className="ad-kpi-icon"><Brain size={18} /></span>
          <div>
            <div className="ad-kpi-value">
              {cards.filter(c => c.memorizationStatus === 'memorized').length}
            </div>
            <div className="ad-kpi-label">Từ đã thuộc</div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="ad-grid">

        {/* Row 1: JLPT Progress */}
        <div className="ad-card ad-card--jlpt">
          <div className="ad-card-header">
            <h3 className="ad-card-title">Tiến độ JLPT</h3>
            <span className="ad-card-jp">JLPT進捗</span>
          </div>
          <div className="ad-chart-wrap">
            <HorizontalBarChart data={data.levelProgress} />
          </div>
          <div className="ad-level-stats">
            {data.levelProgress.map(lp => (
              <div key={lp.level} className="ad-level-pill">
                <span className="ad-level-name">{lp.level}</span>
                <span className="ad-level-count">{lp.mastered}/{lp.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 1: 30-day Activity */}
        <div className="ad-card ad-card--activity">
          <div className="ad-card-header">
            <h3 className="ad-card-title">Hoạt động 30 ngày</h3>
            <span className="ad-card-jp">30日間の活動</span>
          </div>
          <div className="ad-chart-wrap">
            <AreaChart
              data={data.dailyActivity}
              colors={[CHART_COLORS.cyan, CHART_COLORS.purple, CHART_COLORS.amber]}
              labels={['Từ vựng', 'JLPT', 'Game']}
            />
          </div>
        </div>

        {/* Row 1: Skill Distribution */}
        <div className="ad-card ad-card--skills">
          <div className="ad-card-header">
            <h3 className="ad-card-title">Phân bố kỹ năng</h3>
            <span className="ad-card-jp">スキル分布</span>
          </div>
          <div className="ad-chart-wrap ad-chart-wrap--center">
            <ConcentricRings data={data.skillDistribution} />
          </div>
        </div>

        {/* Row 2: Weekly Trends */}
        <div className="ad-card ad-card--weekly">
          <div className="ad-card-header">
            <h3 className="ad-card-title">Xu hướng tuần</h3>
            <span className="ad-card-jp">週間トレンド</span>
          </div>
          <div className="ad-chart-wrap">
            <MultiLineChart
              data={data.weeklyTrends}
              lines={[
                { key: 'studyMinutes', color: CHART_COLORS.cyan, label: 'Học (phút)' },
                { key: 'gameMinutes', color: CHART_COLORS.amber, label: 'Game (phút)' },
                { key: 'jlptMinutes', color: CHART_COLORS.purple, label: 'JLPT (phút)' },
              ]}
            />
          </div>
        </div>

        {/* Row 2: XP & Streak */}
        <div className="ad-card ad-card--xp">
          <div className="ad-card-header">
            <h3 className="ad-card-title">XP & Streak</h3>
            <span className="ad-card-jp">経験値と連続日</span>
          </div>
          <div className="ad-chart-wrap">
            <LineAreaChart
              data={data.xpProgression}
              color={CHART_COLORS.cyan}
            />
          </div>
        </div>

        {/* Row 3: Completion rates */}
        <div className="ad-card ad-card--donuts">
          <div className="ad-card-header">
            <h3 className="ad-card-title">Tỷ lệ hoàn thành</h3>
            <span className="ad-card-jp">完了率</span>
          </div>
          <div className="ad-donuts-row">
            <div className="ad-donut-item">
              <DonutChart
                percent={data.gameWinRate}
                label="Thắng Game"
                color={CHART_COLORS.amber}
                size={120}
                subtitle={`${userStats.totalGameWins} lần thắng`}
              />
              <span className="ad-donut-subtitle" style={{ color: CHART_COLORS.amber }}>
                {userStats.totalGameWins} lần thắng
              </span>
            </div>
            <div className="ad-donut-item">
              <DonutChart
                percent={data.studyCompletionRate}
                label="Học đúng"
                color={CHART_COLORS.cyan}
                size={120}
                subtitle={`${userStats.totalCardsStudied} thẻ`}
              />
              <span className="ad-donut-subtitle" style={{ color: CHART_COLORS.cyan }}>
                {userStats.totalCardsStudied} thẻ
              </span>
            </div>
            <div className="ad-donut-item">
              <DonutChart
                percent={data.jlptAccuracy}
                label="JLPT"
                color={CHART_COLORS.teal}
                size={120}
                subtitle={`${userStats.totalJLPTSessions} phiên`}
              />
              <span className="ad-donut-subtitle" style={{ color: CHART_COLORS.teal }}>
                {userStats.totalJLPTSessions} phiên
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Monthly comparison */}
        <div className="ad-card ad-card--monthly">
          <div className="ad-card-header">
            <h3 className="ad-card-title">So sánh tháng</h3>
            <span className="ad-card-jp">月間比較</span>
          </div>
          <div className="ad-chart-wrap">
            <GroupedBarChart
              data={data.monthlyComparison}
              colors={[CHART_COLORS.cyan, CHART_COLORS.purple]}
              legends={['Tháng này', 'Tháng trước']}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
