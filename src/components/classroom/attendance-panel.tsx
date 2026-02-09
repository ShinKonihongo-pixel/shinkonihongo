// Attendance panel component for tracking student attendance

import React, { useState, useMemo } from 'react';
import type { User } from '../../types/user';
import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceSummary,
} from '../../types/classroom';
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
} from '../../types/classroom';
import { Calendar, Check, Clock, X, FileText, Save, Plus } from 'lucide-react';

interface AttendancePanelProps {
  sessions: AttendanceSession[];
  currentRecords: AttendanceRecord[];
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  students: { userId: string; user?: User }[];
  loading: boolean;
  onCreateSession: (date: string) => Promise<AttendanceSession | null>;
  onMarkAttendance: (userId: string, status: AttendanceStatus, note?: string) => Promise<AttendanceRecord | null>;
  onBulkMark: (records: { userId: string; status: AttendanceStatus; note?: string }[]) => Promise<boolean>;
  hasSessionForDate: (date: string) => boolean;
  studentSummaries: StudentAttendanceSummary[];
}

const statusIcons: Record<AttendanceStatus, React.ReactElement> = {
  present: <Check size={16} />,
  late: <Clock size={16} />,
  absent: <X size={16} />,
  excused: <FileText size={16} />,
};

export function AttendancePanel({
  sessions,
  currentRecords,
  selectedDate,
  setSelectedDate,
  students,
  loading,
  onCreateSession,
  onBulkMark,
  hasSessionForDate,
  studentSummaries,
}: AttendancePanelProps) {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [pendingChanges, setPendingChanges] = useState<Record<string, { status: AttendanceStatus; note?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'attendance' | 'summary'>('attendance');

  // Get current status for a student
  const getStudentStatus = (userId: string): AttendanceStatus | null => {
    if (pendingChanges[userId]) return pendingChanges[userId].status;
    const record = currentRecords.find(r => r.userId === userId);
    return record?.status ?? null;
  };

  // Get note for a student
  const getStudentNote = (userId: string): string => {
    if (pendingChanges[userId]) return pendingChanges[userId].note || '';
    const record = currentRecords.find(r => r.userId === userId);
    return record?.note || '';
  };

  // Handle status change
  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: { ...prev[userId], status },
    }));
  };

  // Handle note change
  const handleNoteChange = (userId: string, note: string) => {
    const currentStatus = getStudentStatus(userId);
    if (!currentStatus) return;
    setPendingChanges(prev => ({
      ...prev,
      [userId]: { status: currentStatus, note },
    }));
  };

  // Create new session
  const handleCreateSession = async () => {
    if (hasSessionForDate(newDate)) {
      setSelectedDate(newDate);
      return;
    }
    const session = await onCreateSession(newDate);
    if (session) {
      setSelectedDate(newDate);
    }
  };

  // Save all changes
  const handleSaveAll = async () => {
    const changes = Object.entries(pendingChanges).map(([userId, data]) => ({
      userId,
      status: data.status,
      note: data.note,
    }));
    if (changes.length === 0) return;

    setSaving(true);
    const success = await onBulkMark(changes);
    if (success) {
      setPendingChanges({});
    }
    setSaving(false);
  };

  // Mark all students with a status
  const handleMarkAll = (status: AttendanceStatus) => {
    const changes: Record<string, { status: AttendanceStatus; note?: string }> = {};
    students.forEach(s => {
      changes[s.userId] = { status };
    });
    setPendingChanges(changes);
  };

  // Calculate stats for current session
  const sessionStats = useMemo(() => {
    const statuses = students.map(s => getStudentStatus(s.userId));
    return {
      present: statuses.filter(s => s === 'present').length,
      late: statuses.filter(s => s === 'late').length,
      absent: statuses.filter(s => s === 'absent').length,
      excused: statuses.filter(s => s === 'excused').length,
      unmarked: statuses.filter(s => s === null).length,
    };
  }, [students, currentRecords, pendingChanges]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  if (loading) {
    return <div className="attendance-loading">Đang tải...</div>;
  }

  return (
    <div className="attendance-panel">
      {/* View mode tabs */}
      <div className="attendance-tabs">
        <button
          className={`tab-btn ${viewMode === 'attendance' ? 'active' : ''}`}
          onClick={() => setViewMode('attendance')}
        >
          <Calendar size={16} />
          <span>Điểm danh</span>
        </button>
        <button
          className={`tab-btn ${viewMode === 'summary' ? 'active' : ''}`}
          onClick={() => setViewMode('summary')}
        >
          <FileText size={16} />
          <span>Thống kê</span>
        </button>
      </div>

      {viewMode === 'attendance' ? (
        <>
          {/* Date selector */}
          <div className="attendance-date-section">
            <div className="date-picker">
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="form-input"
              />
              <button
                className="btn btn-primary"
                onClick={handleCreateSession}
              >
                <Plus size={16} />
                {hasSessionForDate(newDate) ? 'Xem' : 'Tạo buổi học'}
              </button>
            </div>

            {/* Recent sessions */}
            <div className="recent-sessions">
              <span className="label">Gần đây:</span>
              {sessions.slice(0, 5).map(session => (
                <button
                  key={session.id}
                  className={`session-chip ${selectedDate === session.sessionDate ? 'active' : ''}`}
                  onClick={() => setSelectedDate(session.sessionDate)}
                >
                  {new Date(session.sessionDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <>
              {/* Stats */}
              <div className="attendance-stats">
                <div className="stat-item present">
                  <span className="stat-value">{sessionStats.present}</span>
                  <span className="stat-label">Có mặt</span>
                </div>
                <div className="stat-item late">
                  <span className="stat-value">{sessionStats.late}</span>
                  <span className="stat-label">Đi muộn</span>
                </div>
                <div className="stat-item absent">
                  <span className="stat-value">{sessionStats.absent}</span>
                  <span className="stat-label">Vắng</span>
                </div>
                <div className="stat-item excused">
                  <span className="stat-value">{sessionStats.excused}</span>
                  <span className="stat-label">Có phép</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="attendance-quick-actions">
                <span className="label">Đánh dấu tất cả:</span>
                <button className="btn btn-sm btn-success" onClick={() => handleMarkAll('present')}>
                  Có mặt
                </button>
                <button className="btn btn-sm btn-warning" onClick={() => handleMarkAll('late')}>
                  Đi muộn
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleMarkAll('absent')}>
                  Vắng
                </button>
              </div>

              {/* Student list */}
              <div className="attendance-list">
                {students.length === 0 ? (
                  <p className="empty-text">Chưa có học viên trong lớp</p>
                ) : (
                  students.map(({ userId, user }) => {
                    const status = getStudentStatus(userId);
                    const note = getStudentNote(userId);
                    const hasChange = !!pendingChanges[userId];

                    return (
                      <div key={userId} className={`attendance-row ${hasChange ? 'modified' : ''}`}>
                        <div className="student-info">
                          <div className="student-avatar">
                            {user?.displayName?.charAt(0) || user?.username?.charAt(0) || '?'}
                          </div>
                          <span className="student-name">
                            {user?.displayName || user?.username || 'Unknown'}
                          </span>
                        </div>

                        <div className="status-buttons">
                          {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(s => (
                            <button
                              key={s}
                              className={`status-btn ${status === s ? 'active' : ''}`}
                              style={status === s ? { backgroundColor: ATTENDANCE_STATUS_COLORS[s], color: 'white' } : {}}
                              onClick={() => handleStatusChange(userId, s)}
                              title={ATTENDANCE_STATUS_LABELS[s]}
                            >
                              {statusIcons[s]}
                            </button>
                          ))}
                        </div>

                        <input
                          type="text"
                          className="note-input"
                          placeholder="Ghi chú..."
                          value={note}
                          onChange={e => handleNoteChange(userId, e.target.value)}
                          disabled={!status}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* Save button */}
              {hasPendingChanges && (
                <div className="attendance-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPendingChanges({})}
                    disabled={saving}
                  >
                    Hủy thay đổi
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveAll}
                    disabled={saving}
                  >
                    <Save size={16} />
                    {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        /* Summary view */
        <div className="attendance-summary">
          <h3>Thống kê chuyên cần</h3>
          {studentSummaries.length === 0 ? (
            <p className="empty-text">Chưa có dữ liệu điểm danh</p>
          ) : (
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>Có mặt</th>
                  <th>Đi muộn</th>
                  <th>Vắng</th>
                  <th>Có phép</th>
                  <th>Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {studentSummaries.map(summary => (
                  <tr key={summary.userId}>
                    <td>{summary.userName}</td>
                    <td className="center">{summary.present}</td>
                    <td className="center">{summary.late}</td>
                    <td className="center">{summary.absent}</td>
                    <td className="center">{summary.excused}</td>
                    <td className={`center rate ${summary.attendanceRate >= 80 ? 'good' : summary.attendanceRate >= 50 ? 'warning' : 'bad'}`}>
                      {summary.attendanceRate.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
