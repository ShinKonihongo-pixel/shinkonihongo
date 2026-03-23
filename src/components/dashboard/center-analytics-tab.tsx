// Center analytics tab — engagement metrics, trends, per-class performance, top students

import {
  TrendingUp, Users, Clock, Gamepad2, Award, BarChart3, Trophy,
  Activity, Target, Zap,
} from 'lucide-react';
import type { CenterAnalytics } from '../../hooks/use-center-analytics';
import { isImageAvatar } from '../../utils/avatar-icons';
import './center-analytics-tab.css';

interface CenterAnalyticsTabProps {
  analytics: CenterAnalytics;
  totalStudents: number;
}

// Simple CSS bar chart
function BarChart({ data, labelKey, valueKey, maxValue, color }: {
  data: Array<Record<string, any>>;
  labelKey: string;
  valueKey: string;
  maxValue?: number;
  color: string;
}) {
  const max = maxValue || Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="ca-bar-chart">
      {data.map((d, i) => (
        <div key={i} className="ca-bar-row">
          <span className="ca-bar-label">{d[labelKey]}</span>
          <div className="ca-bar-track">
            <div
              className="ca-bar-fill"
              style={{ width: `${(d[valueKey] / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="ca-bar-value">{d[valueKey]}</span>
        </div>
      ))}
    </div>
  );
}

export function CenterAnalyticsTab({ analytics, totalStudents }: CenterAnalyticsTabProps) {
  const { engagement, weeklyTrends, topStudents, classPerformance, loading } = analytics;

  if (loading) {
    return (
      <div className="ca-loading">
        <div className="app-loading-spinner" />
        <span>Đang phân tích dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="ca">
      {/* ===== ENGAGEMENT OVERVIEW ===== */}
      <div className="ca-section-title">
        <Activity size={16} /> Tương tác tuần này
      </div>

      <div className="ca-metrics-grid">
        <div className="ca-metric-card highlight">
          <div className="ca-metric-icon purple"><Target size={20} /></div>
          <div className="ca-metric-value">{engagement.engagementRate}%</div>
          <div className="ca-metric-label">Tỷ lệ hoạt động</div>
          <div className="ca-metric-detail">{engagement.activeThisWeek}/{totalStudents} học viên</div>
        </div>
        <div className="ca-metric-card">
          <div className="ca-metric-icon green"><Clock size={18} /></div>
          <div className="ca-metric-value">{engagement.avgStudyMinutes}</div>
          <div className="ca-metric-label">Phút/học viên</div>
        </div>
        <div className="ca-metric-card">
          <div className="ca-metric-icon blue"><TrendingUp size={18} /></div>
          <div className="ca-metric-value">{engagement.totalStudySessions}</div>
          <div className="ca-metric-label">Buổi học</div>
        </div>
        <div className="ca-metric-card">
          <div className="ca-metric-icon pink"><Gamepad2 size={18} /></div>
          <div className="ca-metric-value">{engagement.totalGameSessions}</div>
          <div className="ca-metric-label">Lượt chơi</div>
        </div>
        <div className="ca-metric-card">
          <div className="ca-metric-icon amber"><Award size={18} /></div>
          <div className="ca-metric-value">{engagement.totalJlptSessions}</div>
          <div className="ca-metric-label">Lượt JLPT</div>
        </div>
        <div className="ca-metric-card">
          <div className="ca-metric-icon cyan"><Users size={18} /></div>
          <div className="ca-metric-value">{engagement.activeThisMonth}</div>
          <div className="ca-metric-label">Hoạt động tháng</div>
        </div>
      </div>

      {/* ===== WEEKLY TRENDS ===== */}
      <div className="ca-section-title">
        <BarChart3 size={16} /> Xu hướng 4 tuần
      </div>

      <div className="ca-trends-grid">
        <div className="ca-trend-card">
          <div className="ca-trend-header">Phiên học</div>
          <BarChart
            data={weeklyTrends}
            labelKey="week"
            valueKey="sessions"
            color="#8b5cf6"
          />
        </div>
        <div className="ca-trend-card">
          <div className="ca-trend-header">Người dùng hoạt động</div>
          <BarChart
            data={weeklyTrends}
            labelKey="week"
            valueKey="activeUsers"
            color="#22c55e"
          />
        </div>
      </div>

      {/* ===== CLASS PERFORMANCE ===== */}
      {classPerformance.length > 0 && (
        <>
          <div className="ca-section-title">
            <Zap size={16} /> Hiệu suất lớp học
          </div>

          <div className="ca-class-table">
            <div className="ca-class-row ca-class-header">
              <span className="ca-class-name">Lớp</span>
              <span className="ca-class-stat">HV</span>
              <span className="ca-class-stat">Active</span>
              <span className="ca-class-stat">%</span>
            </div>
            {classPerformance.map(cp => (
              <div key={cp.classId} className="ca-class-row">
                <span className="ca-class-name">
                  <span className={`ca-level-dot ${cp.level}`} />
                  {cp.className}
                </span>
                <span className="ca-class-stat">{cp.studentCount}</span>
                <span className="ca-class-stat">{cp.activeStudents}</span>
                <span className={`ca-class-stat ca-engagement ${
                  cp.engagementPercent >= 70 ? 'high' : cp.engagementPercent >= 40 ? 'medium' : 'low'
                }`}>
                  {cp.engagementPercent}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== TOP STUDENTS ===== */}
      {topStudents.length > 0 && (
        <>
          <div className="ca-section-title">
            <Trophy size={16} /> Top học viên tháng này
          </div>

          <div className="ca-top-list">
            {topStudents.map((student, i) => (
              <div key={student.userId} className="ca-top-item">
                <span className={`ca-top-rank ${i < 3 ? `rank-${i + 1}` : ''}`}>
                  {i + 1}
                </span>
                <div className="ca-top-avatar">
                  {student.avatar && isImageAvatar(student.avatar) ? (
                    <img src={student.avatar} alt="" />
                  ) : (
                    <span>{student.displayName.charAt(0)}</span>
                  )}
                </div>
                <div className="ca-top-info">
                  <span className="ca-top-name">{student.displayName}</span>
                  <span className="ca-top-stats">
                    {student.totalSessions} buổi · {student.totalMinutes}p · {student.totalGames} game
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {totalStudents === 0 && (
        <div className="ca-empty">
          <Users size={32} />
          <p>Chưa có dữ liệu</p>
          <span>Thêm học viên vào trung tâm để bắt đầu theo dõi</span>
        </div>
      )}
    </div>
  );
}
