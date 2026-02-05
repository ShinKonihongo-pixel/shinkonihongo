// My Teaching Page - Self-service page for teachers to view their schedule and salary

import { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import { useCurrentBranch } from '../../../hooks/use-branches';
import { useTeacherSchedules, useTeachingSessions, useTeacherSalary } from '../../../hooks/use-teachers';
import type { TeacherSchedule } from '../../../types/teacher';
import type { ViewMode } from './types';
import { OverviewView } from './overview-view';
import { ScheduleView } from './schedule-view';
import { SessionsView } from './sessions-view';
import { SalaryView } from './salary-view';

export function MyTeachingPage() {
  const { currentUser } = useAuth();
  const { currentBranch } = useCurrentBranch();

  // Current month for sessions/salary
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Get teacher's schedules
  const { schedules, loading: schedulesLoading } = useTeacherSchedules(
    currentBranch?.id || null,
    currentUser?.id
  );

  // Get teacher's sessions for selected month
  const { sessions, totalHours, loading: sessionsLoading } = useTeachingSessions(
    currentBranch?.id || null,
    currentUser?.id,
    selectedMonth
  );

  // Get teacher's salary history
  const { salaries, totalEarned, totalPending, loading: salaryLoading } = useTeacherSalary(
    currentUser?.id || null
  );

  // Get current month salary
  const currentSalary = useMemo(() => {
    return salaries.find(s => s.month === selectedMonth);
  }, [salaries, selectedMonth]);

  // Group schedules by day
  const schedulesByDay = useMemo(() => {
    const grouped = new Map<number, TeacherSchedule[]>();
    for (let i = 0; i < 7; i++) {
      grouped.set(i, schedules.filter(s => s.dayOfWeek === i).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      ));
    }
    return grouped;
  }, [schedules]);

  // Stats
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Check if teacher
  const isTeacher = currentUser?.role === 'main_teacher' ||
                    currentUser?.role === 'part_time_teacher' ||
                    currentUser?.role === 'assistant';

  if (!isTeacher) {
    return (
      <div className="my-teaching-page">
        <div className="empty-state">
          <p>Trang này chỉ dành cho giáo viên</p>
        </div>
      </div>
    );
  }

  if (!currentBranch) {
    return (
      <div className="my-teaching-page">
        <div className="empty-state">
          <p>Bạn chưa được phân công vào chi nhánh nào</p>
          <p className="hint">Vui lòng liên hệ Admin để được thêm vào chi nhánh</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-teaching-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Bảng tin Giáo viên</h1>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
            Chi nhánh: <strong>{currentBranch.name}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button
          className={`tab-btn ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
        >
          Tổng quan
        </button>
        <button
          className={`tab-btn ${viewMode === 'schedule' ? 'active' : ''}`}
          onClick={() => setViewMode('schedule')}
        >
          Lịch dạy
        </button>
        <button
          className={`tab-btn ${viewMode === 'sessions' ? 'active' : ''}`}
          onClick={() => setViewMode('sessions')}
        >
          Giờ dạy ({completedSessions.length})
        </button>
        <button
          className={`tab-btn ${viewMode === 'salary' ? 'active' : ''}`}
          onClick={() => setViewMode('salary')}
        >
          Lương
        </button>
      </div>

      {/* Tab content */}
      <div className="page-content">
        {viewMode === 'overview' && (
          <OverviewView
            schedules={schedules}
            sessions={sessions}
            totalHours={totalHours}
            currentSalary={currentSalary}
            schedulesByDay={schedulesByDay}
          />
        )}

        {viewMode === 'schedule' && (
          <ScheduleView
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            schedulesByDay={schedulesByDay}
          />
        )}

        {viewMode === 'sessions' && (
          <SessionsView
            sessions={sessions}
            totalHours={totalHours}
            selectedMonth={selectedMonth}
            sessionsLoading={sessionsLoading}
          />
        )}

        {viewMode === 'salary' && (
          <SalaryView
            currentSalary={currentSalary}
            salaries={salaries}
            totalEarned={totalEarned}
            totalPending={totalPending}
            selectedMonth={selectedMonth}
            salaryLoading={salaryLoading}
          />
        )}
      </div>
    </div>
  );
}
