import type { TeachingSession } from '../../../types/teacher';
import { formatMonth } from './utils';

export function SessionCard({ session }: { session: TeachingSession }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    scheduled: { bg: '#e3f2fd', text: '#1976d2' },
    completed: { bg: '#e8f5e9', text: '#27ae60' },
    cancelled: { bg: '#ffebee', text: '#e74c3c' },
    absent: { bg: '#fff3e0', text: '#f39c12' },
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Đã lên lịch',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    absent: 'Vắng mặt',
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      background: '#fff',
      borderRadius: '8px',
      border: '1px solid #eee',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          padding: '8px 12px',
          background: '#f5f5f5',
          borderRadius: '6px',
          textAlign: 'center',
          minWidth: '60px',
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{session.date.split('-')[2]}</div>
          <div style={{ fontSize: '10px', color: '#999' }}>
            {formatMonth(session.date.slice(0, 7)).split(' ')[0]}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 500, marginBottom: '2px' }}>
            {session.startTime} - {session.endTime}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {session.duration} phút
          </div>
        </div>
      </div>
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 500,
        background: statusColors[session.status].bg,
        color: statusColors[session.status].text,
      }}>
        {statusLabels[session.status]}
      </span>
    </div>
  );
}
