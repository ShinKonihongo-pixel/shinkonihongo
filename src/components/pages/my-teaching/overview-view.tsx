import { DAY_OF_WEEK_LABELS } from '../../../types/classroom';
import { formatCurrency } from '../../../types/teacher';
import type { TeacherSchedule, TeachingSession, Salary } from '../../../types/teacher';
import { SummaryCard } from './summary-card';
import { ScheduleItem } from './schedule-item';
import { SessionItem } from './session-item';
import { getSalaryStatusLabel } from './utils';

interface OverviewViewProps {
  schedules: TeacherSchedule[];
  sessions: TeachingSession[];
  totalHours: number;
  currentSalary: Salary | undefined;
  schedulesByDay: Map<number, TeacherSchedule[]>;
}

export function OverviewView({
  schedules,
  sessions,
  totalHours,
  currentSalary,
  schedulesByDay,
}: OverviewViewProps) {
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const today = new Date().getDay();
  const todaySchedules = schedulesByDay.get(today) || [];

  return (
    <div>
      {/* Summary cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <SummaryCard
          label="Tiết học tuần này"
          value={schedules.length}
          icon="📅"
          color="#667eea"
        />
        <SummaryCard
          label="Giờ đã dạy tháng này"
          value={`${totalHours.toFixed(1)}h`}
          icon="⏱️"
          color="#27ae60"
        />
        <SummaryCard
          label="Buổi sắp tới"
          value={upcomingSessions.length}
          icon="📚"
          color="#f39c12"
        />
        <SummaryCard
          label="Lương tháng này"
          value={currentSalary ? formatCurrency(currentSalary.totalAmount) : '—'}
          icon="💰"
          color={currentSalary?.status === 'paid' ? '#27ae60' : '#667eea'}
          subtitle={currentSalary ? getSalaryStatusLabel(currentSalary.status) : 'Chưa tính'}
        />
      </div>

      {/* Today's schedule */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📅</span>
          Lịch dạy hôm nay ({DAY_OF_WEEK_LABELS[today]})
        </h3>
        {todaySchedules.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
            Không có tiết học nào hôm nay
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todaySchedules.map(schedule => (
              <ScheduleItem key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋</span>
          Buổi dạy gần đây
        </h3>
        {completedSessions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
            Chưa có buổi dạy nào trong tháng này
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {completedSessions.slice(0, 5).map(session => (
              <SessionItem key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
