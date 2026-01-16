// My Teaching Page - Self-service page for teachers to view their schedule and salary

import { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useCurrentBranch } from '../../hooks/use-branches';
import { useTeacherSchedules, useTeachingSessions, useTeacherSalary } from '../../hooks/use-teachers';
import { DAY_OF_WEEK_LABELS } from '../../types/classroom';
import { BRANCH_MEMBER_ROLE_LABELS, BRANCH_MEMBER_ROLE_COLORS } from '../../types/branch';
import { formatCurrency } from '../../types/teacher';
import type { TeacherSchedule, TeachingSession } from '../../types/teacher';

type ViewMode = 'overview' | 'schedule' | 'sessions' | 'salary';

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
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  // Get today's schedule
  const today = new Date().getDay();
  const todaySchedules = schedulesByDay.get(today) || [];

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
        {/* Overview */}
        {viewMode === 'overview' && (
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
        )}

        {/* Schedule View */}
        {viewMode === 'schedule' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0' }}>Lịch dạy trong tuần</h3>

            {schedulesLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
            ) : schedules.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có lịch dạy</p>
                <p className="hint">Liên hệ Admin để được phân công lịch dạy</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '12px',
              }}>
                {[1, 2, 3, 4, 5, 6, 0].map(day => {
                  const daySchedules = schedulesByDay.get(day) || [];
                  const isToday = today === day;

                  return (
                    <div
                      key={day}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: isToday ? '#f5f0ff' : '#fff',
                        border: isToday ? '2px solid #667eea' : '1px solid #eee',
                        minHeight: '120px',
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '12px',
                        color: isToday ? '#667eea' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        {DAY_OF_WEEK_LABELS[day]}
                        {isToday && <span style={{ fontSize: '10px', background: '#667eea', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Hôm nay</span>}
                      </div>

                      {daySchedules.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#ccc', textAlign: 'center', padding: '20px 0' }}>
                          Nghỉ
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {daySchedules.map(s => (
                            <div
                              key={s.id}
                              style={{
                                padding: '8px',
                                background: `${BRANCH_MEMBER_ROLE_COLORS[s.role]}15`,
                                borderRadius: '6px',
                                borderLeft: `3px solid ${BRANCH_MEMBER_ROLE_COLORS[s.role]}`,
                              }}
                            >
                              <div style={{ fontSize: '13px', fontWeight: 600, color: BRANCH_MEMBER_ROLE_COLORS[s.role] }}>
                                {s.startTime} - {s.endTime}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                {s.classroomId ? 'Lớp học' : 'Chưa xác định'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sessions View */}
        {viewMode === 'sessions' && (
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
        )}

        {/* Salary View */}
        {viewMode === 'salary' && (
          <div>
            {/* Current month salary */}
            {currentSalary && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>Lương tháng {selectedMonth}</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                }}>
                  <SalaryDetail label="Lương cơ bản" value={currentSalary.baseSalary} />
                  <SalaryDetail label="Giờ dạy" value={`${currentSalary.totalHours}h`} isText />
                  <SalaryDetail label="Thưởng" value={currentSalary.bonus} color="#27ae60" />
                  <SalaryDetail label="Khấu trừ" value={currentSalary.deduction} color="#e74c3c" negative />
                  <SalaryDetail
                    label="Tổng cộng"
                    value={currentSalary.totalAmount}
                    highlight
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#999' }}>Trạng thái</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: getSalaryStatusColor(currentSalary.status).bg,
                      color: getSalaryStatusColor(currentSalary.status).text,
                      width: 'fit-content',
                    }}>
                      {getSalaryStatusIcon(currentSalary.status)}
                      {getSalaryStatusLabel(currentSalary.status)}
                    </span>
                  </div>
                </div>

                {currentSalary.note && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#666',
                  }}>
                    <strong>Ghi chú:</strong> {currentSalary.note}
                  </div>
                )}
              </div>
            )}

            {/* Salary history */}
            <div className="card">
              <h3 style={{ margin: '0 0 16px 0' }}>Lịch sử lương</h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}>
                <div style={{
                  padding: '16px',
                  background: '#e8f5e9',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Tổng đã nhận</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#27ae60' }}>
                    {formatCurrency(totalEarned)}
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  background: '#fff3e0',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Chưa thanh toán</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#f39c12' }}>
                    {formatCurrency(totalPending)}
                  </div>
                </div>
              </div>

              {salaryLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Đang tải...</div>
              ) : salaries.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', background: '#f9f9f9', borderRadius: '8px' }}>
                  Chưa có dữ liệu lương
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '13px' }}>Tháng</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>Số giờ</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>Tổng lương</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '13px' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries
                      .sort((a, b) => b.month.localeCompare(a.month))
                      .map(salary => (
                        <tr key={salary.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            {formatMonth(salary.month)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                            {salary.totalHours}h
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, fontSize: '14px' }}>
                            {formatCurrency(salary.totalAmount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: getSalaryStatusColor(salary.status).bg,
                              color: getSalaryStatusColor(salary.status).text,
                            }}>
                              {getSalaryStatusLabel(salary.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components
function SummaryCard({ label, value, icon, color, subtitle }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div style={{
      padding: '20px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: '#999' }}>{label}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{subtitle}</div>
      )}
    </div>
  );
}

function ScheduleItem({ schedule }: { schedule: TeacherSchedule }) {
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

function SessionItem({ session }: { session: TeachingSession }) {
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

function SessionCard({ session }: { session: TeachingSession }) {
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

function SalaryDetail({
  label,
  value,
  color,
  negative,
  highlight,
  isText
}: {
  label: string;
  value: number | string;
  color?: string;
  negative?: boolean;
  highlight?: boolean;
  isText?: boolean;
}) {
  return (
    <div style={{
      padding: highlight ? '12px' : '0',
      background: highlight ? '#f5f0ff' : 'transparent',
      borderRadius: highlight ? '8px' : '0',
    }}>
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{label}</div>
      <div style={{
        fontSize: highlight ? '20px' : '16px',
        fontWeight: highlight ? 700 : 500,
        color: color || (highlight ? '#667eea' : '#333'),
      }}>
        {negative && value !== 0 ? '-' : ''}
        {isText ? value : formatCurrency(typeof value === 'number' ? value : 0)}
      </div>
    </div>
  );
}

// Helper functions
function getSalaryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Nháp',
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    paid: 'Đã thanh toán',
  };
  return labels[status] || status;
}

function getSalaryStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#f5f5f5', text: '#999' },
    pending: { bg: '#fff3e0', text: '#f39c12' },
    approved: { bg: '#e3f2fd', text: '#1976d2' },
    paid: { bg: '#e8f5e9', text: '#27ae60' },
  };
  return colors[status] || colors.draft;
}

function getSalaryStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    draft: '📝',
    pending: '⏳',
    approved: '✅',
    paid: '💰',
  };
  return icons[status] || '📝';
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  return `${monthNames[parseInt(month)]} ${year}`;
}
