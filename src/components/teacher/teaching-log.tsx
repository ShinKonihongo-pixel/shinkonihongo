// Teaching log component - Record and view teaching sessions

import { useState, useMemo } from 'react';
import type { TeachingSession } from '../../types/teacher';
import type { Classroom } from '../../types/classroom';
import type { User } from '../../types/user';
import {
  TEACHING_SESSION_STATUS_LABELS,
  TEACHING_SESSION_STATUS_COLORS,
  formatDuration,
} from '../../types/teacher';

interface SessionWithDetails extends TeachingSession {
  classroom?: Classroom;
  teacher?: User;
}

interface TeachingLogProps {
  sessions: SessionWithDetails[];
  classrooms: Classroom[];
  teachers: User[];
  onComplete?: (session: SessionWithDetails) => void;
  onCancel?: (session: SessionWithDetails) => void;
  onApprove?: (session: SessionWithDetails) => void;
  onAdd?: () => void;
  isAdmin?: boolean;
  loading?: boolean;
}

export function TeachingLog({
  sessions,
  classrooms,
  teachers,
  onComplete,
  onCancel,
  onApprove,
  onAdd,
  isAdmin,
  loading,
}: TeachingLogProps) {
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Enrich sessions with details
  const enrichedSessions = useMemo(() => {
    return sessions.map(s => ({
      ...s,
      classroom: classrooms.find(c => c.id === s.classroomId),
      teacher: teachers.find(t => t.id === s.teacherId),
    }));
  }, [sessions, classrooms, teachers]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return enrichedSessions.filter(s => {
      if (filter !== 'all' && s.status !== filter) return false;
      if (dateFilter && !s.date.startsWith(dateFilter)) return false;
      return true;
    });
  }, [enrichedSessions, filter, dateFilter]);

  // Stats
  const stats = useMemo(() => {
    const completed = enrichedSessions.filter(s => s.status === 'completed');
    return {
      total: enrichedSessions.length,
      completed: completed.length,
      scheduled: enrichedSessions.filter(s => s.status === 'scheduled').length,
      cancelled: enrichedSessions.filter(s => s.status === 'cancelled').length,
      totalHours: completed.reduce((sum, s) => sum + s.duration, 0) / 60,
    };
  }, [enrichedSessions]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <StatCard label="Tổng tiết" value={stats.total} color="#667eea" />
        <StatCard label="Hoàn thành" value={stats.completed} color="#27ae60" />
        <StatCard label="Chờ dạy" value={stats.scheduled} color="#3498db" />
        <StatCard label="Tổng giờ" value={`${stats.totalHours.toFixed(1)}h`} color="#9b59b6" />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <FilterBtn
            label="Tất cả"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterBtn
            label="Chờ dạy"
            active={filter === 'scheduled'}
            onClick={() => setFilter('scheduled')}
            color={TEACHING_SESSION_STATUS_COLORS.scheduled}
          />
          <FilterBtn
            label="Hoàn thành"
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
            color={TEACHING_SESSION_STATUS_COLORS.completed}
          />
          <FilterBtn
            label="Đã hủy"
            active={filter === 'cancelled'}
            onClick={() => setFilter('cancelled')}
            color={TEACHING_SESSION_STATUS_COLORS.cancelled}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
          {onAdd && (
            <button
              onClick={onAdd}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              + Ghi nhận giờ dạy
            </button>
          )}
        </div>
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '12px',
          color: '#999',
        }}>
          Không có tiết học nào
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredSessions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(session => (
              <SessionCard
                key={session.id}
                session={session}
                onComplete={onComplete}
                onCancel={onCancel}
                onApprove={onApprove}
                isAdmin={isAdmin}
              />
            ))}
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

function FilterBtn({ label, active, onClick, color }: FilterBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: '20px',
        border: active ? 'none' : '1px solid #ddd',
        background: active ? (color || '#667eea') : '#fff',
        color: active ? '#fff' : '#666',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

interface SessionCardProps {
  session: SessionWithDetails;
  onComplete?: (session: SessionWithDetails) => void;
  onCancel?: (session: SessionWithDetails) => void;
  onApprove?: (session: SessionWithDetails) => void;
  isAdmin?: boolean;
}

function SessionCard({ session, onComplete, onCancel, onApprove, isAdmin }: SessionCardProps) {
  const statusColor = TEACHING_SESSION_STATUS_COLORS[session.status];
  const dateObj = new Date(session.date);
  const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dateObj.getDay()];

  return (
    <div style={{
      padding: '14px',
      borderRadius: '10px',
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      gap: '14px',
      alignItems: 'center',
    }}>
      {/* Date */}
      <div style={{
        padding: '10px 14px',
        background: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'center',
        minWidth: '65px',
      }}>
        <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{dayName}</div>
        <div style={{ fontSize: '18px', fontWeight: 700 }}>
          {dateObj.getDate()}
        </div>
        <div style={{ fontSize: '11px', color: '#999' }}>
          {dateObj.toLocaleDateString('vi-VN', { month: 'short' })}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontWeight: 600 }}>{session.classroom?.name || 'Lớp học'}</span>
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 500,
            background: `${statusColor}20`,
            color: statusColor,
          }}>
            {TEACHING_SESSION_STATUS_LABELS[session.status]}
          </span>
          {session.approvedBy && (
            <span style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              background: '#e8f5e9',
              color: '#27ae60',
            }}>
              ✓ Đã duyệt
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
          <span>👤 {session.teacher?.displayName || session.teacher?.username || 'Giáo viên'}</span>
          <span>🕐 {session.startTime} - {session.endTime}</span>
          <span>⏱ {formatDuration(session.duration)}</span>
        </div>
        {session.note && (
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            📝 {session.note}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {session.status === 'scheduled' && onComplete && (
          <ActionBtn
            icon="✓"
            label="Hoàn thành"
            color="#27ae60"
            onClick={() => onComplete(session)}
          />
        )}
        {session.status === 'scheduled' && onCancel && (
          <ActionBtn
            icon="✕"
            label="Hủy"
            color="#e74c3c"
            onClick={() => onCancel(session)}
          />
        )}
        {isAdmin && session.status === 'completed' && !session.approvedBy && onApprove && (
          <ActionBtn
            icon="✓"
            label="Duyệt"
            color="#3498db"
            onClick={() => onApprove(session)}
          />
        )}
      </div>
    </div>
  );
}

interface ActionBtnProps {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}

function ActionBtn({ icon, label, color, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: 'none',
        background: `${color}15`,
        color,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {icon} {label}
    </button>
  );
}

// Session add modal
interface SessionAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    classroomId: string;
    date: string;
    startTime: string;
    endTime: string;
    note?: string;
  }) => Promise<void>;
  classrooms: Classroom[];
  loading?: boolean;
}

export function SessionAddModal({
  isOpen,
  onClose,
  onSubmit,
  classrooms,
  loading,
}: SessionAddModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [classroomId, setClassroomId] = useState('');
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId) return;

    await onSubmit({ classroomId, date, startTime, endTime, note: note || undefined });
    setClassroomId('');
    setNote('');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Ghi nhận giờ dạy</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Lớp học</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">-- Chọn lớp học --</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Ngày</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Giờ bắt đầu</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Giờ kết thúc</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Dạy bù, học sinh nghỉ..."
              rows={2}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang lưu...' : 'Ghi nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export aliases for backward compatibility
export { SessionAddModal as TeachingSessionModal };
