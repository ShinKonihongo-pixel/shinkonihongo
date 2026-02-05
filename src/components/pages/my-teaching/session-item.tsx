import type { TeachingSession } from '../../../types/teacher';

export function SessionItem({ session }: { session: TeachingSession }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      background: '#f9f9f9',
      borderRadius: '6px',
      fontSize: '13px',
    }}>
      <div>
        <span style={{ fontWeight: 500 }}>{session.date}</span>
        <span style={{ color: '#999', marginLeft: '8px' }}>
          {session.startTime} - {session.endTime}
        </span>
      </div>
      <div style={{ color: '#27ae60', fontWeight: 500 }}>
        {session.duration}m
      </div>
    </div>
  );
}
