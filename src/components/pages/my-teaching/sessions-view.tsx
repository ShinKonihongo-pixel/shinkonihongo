import type { TeachingSession } from '../../../types/teacher';
import { SessionCard } from './session-card';

interface SessionsViewProps {
  sessions: TeachingSession[];
  totalHours: number;
  selectedMonth: string;
  sessionsLoading: boolean;
}

export function SessionsView({ sessions, totalHours, selectedMonth, sessionsLoading }: SessionsViewProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Giờ dạy tháng {selectedMonth}</h3>
        <div style={{
          padding: '8px 16px',
          background: '#f5f5f5',
          borderRadius: '8px',
          fontSize: '14px',
        }}>
          Tổng: <strong>{totalHours.toFixed(1)}</strong> giờ
        </div>
      </div>

      {sessionsLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có buổi dạy nào trong tháng này</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {sessions
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
        </div>
      )}
    </div>
  );
}
