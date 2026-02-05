import { BRANCH_MEMBER_ROLE_COLORS, BRANCH_MEMBER_ROLE_LABELS } from '../../../types/branch';
import type { TeacherSchedule } from '../../../types/teacher';

export function ScheduleItem({ schedule }: { schedule: TeacherSchedule }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: '#f9f9f9',
      borderRadius: '8px',
    }}>
      <div style={{
        padding: '8px 12px',
        background: `${BRANCH_MEMBER_ROLE_COLORS[schedule.role]}15`,
        borderRadius: '6px',
        minWidth: '90px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: BRANCH_MEMBER_ROLE_COLORS[schedule.role] }}>
          {schedule.startTime}
        </div>
        <div style={{ fontSize: '11px', color: '#999' }}>
          - {schedule.endTime}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 500 }}>Lớp học</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {BRANCH_MEMBER_ROLE_LABELS[schedule.role]}
        </div>
      </div>
    </div>
  );
}
