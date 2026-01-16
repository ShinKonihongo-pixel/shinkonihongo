// Salary calculator component - Calculate and manage teacher salaries

import { useState, useMemo } from 'react';
import type { Salary, MonthlySalarySummary } from '../../types/teacher';
import type { User } from '../../types/user';
import {
  SALARY_STATUS_LABELS,
  SALARY_STATUS_COLORS,
  formatCurrency,
} from '../../types/teacher';

interface SalaryWithUser extends Salary {
  teacher?: User;
}

interface SalaryCalculatorProps {
  salaries: SalaryWithUser[];
  summary?: MonthlySalarySummary;
  month: string;
  onMonthChange: (month: string) => void;
  onApprove?: (salary: SalaryWithUser) => void;
  onMarkPaid?: (salary: SalaryWithUser) => void;
  onEdit?: (salary: SalaryWithUser) => void;
  onRecalculate?: (salary: SalaryWithUser) => void;
  onGenerateAll?: () => void;
  loading?: boolean;
}

export function SalaryCalculator({
  salaries,
  summary,
  month,
  onMonthChange,
  onApprove,
  onMarkPaid,
  onEdit,
  onRecalculate,
  onGenerateAll,
  loading,
}: SalaryCalculatorProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'status'>('name');

  // Filter salaries
  const filteredSalaries = useMemo(() => {
    let result = [...salaries];

    // Filter by status
    if (filter !== 'all') {
      result = result.filter(s => s.status === filter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.teacher?.displayName || '').localeCompare(b.teacher?.displayName || '');
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'status':
          const statusOrder = { draft: 0, approved: 1, paid: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return result;
  }, [salaries, filter, sortBy]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
        Đang tải dữ liệu lương...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0 }}>Bảng lương</h3>
          <input
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '14px',
            }}
          />
        </div>
        {onGenerateAll && (
          <button
            onClick={onGenerateAll}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Tạo lương cho tất cả
          </button>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <SummaryCard
            label="Tổng giáo viên"
            value={summary.totalTeachers}
            icon="👥"
          />
          <SummaryCard
            label="Tổng giờ dạy"
            value={`${summary.totalHours.toFixed(1)}h`}
            icon="⏱"
          />
          <SummaryCard
            label="Tổng lương"
            value={formatCurrency(summary.totalAmount)}
            icon="💰"
            highlight
          />
          <SummaryCard
            label="Đã trả"
            value={`${summary.paidCount}/${summary.totalTeachers}`}
            icon="✓"
            color="#27ae60"
          />
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <FilterBtn label="Tất cả" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterBtn label="Nháp" active={filter === 'draft'} onClick={() => setFilter('draft')} color={SALARY_STATUS_COLORS.draft} />
          <FilterBtn label="Đã duyệt" active={filter === 'approved'} onClick={() => setFilter('approved')} color={SALARY_STATUS_COLORS.approved} />
          <FilterBtn label="Đã trả" active={filter === 'paid'} onClick={() => setFilter('paid')} color={SALARY_STATUS_COLORS.paid} />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '13px',
          }}
        >
          <option value="name">Sắp xếp: Tên</option>
          <option value="amount">Sắp xếp: Số tiền</option>
          <option value="status">Sắp xếp: Trạng thái</option>
        </select>
      </div>

      {/* Salary table */}
      {filteredSalaries.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '12px',
          color: '#999',
        }}>
          {salaries.length === 0
            ? 'Chưa có dữ liệu lương. Bấm "Tạo lương cho tất cả" để bắt đầu.'
            : 'Không có kết quả phù hợp'}
        </div>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
            padding: '12px 16px',
            background: '#f5f5f5',
            fontWeight: 600,
            fontSize: '13px',
            color: '#666',
          }}>
            <div>Giáo viên</div>
            <div style={{ textAlign: 'center' }}>Số giờ</div>
            <div style={{ textAlign: 'right' }}>Lương cơ bản</div>
            <div style={{ textAlign: 'right' }}>Thưởng/Trừ</div>
            <div style={{ textAlign: 'right' }}>Tổng</div>
            <div style={{ textAlign: 'center' }}>Trạng thái</div>
            <div></div>
          </div>

          {/* Table rows */}
          {filteredSalaries.map(salary => (
            <SalaryRow
              key={salary.id}
              salary={salary}
              onApprove={onApprove}
              onMarkPaid={onMarkPaid}
              onEdit={onEdit}
              onRecalculate={onRecalculate}
            />
          ))}

          {/* Table footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
            padding: '12px 16px',
            background: '#f9f9f9',
            fontWeight: 600,
            fontSize: '14px',
            borderTop: '2px solid #eee',
          }}>
            <div>Tổng cộng</div>
            <div style={{ textAlign: 'center' }}>
              {filteredSalaries.reduce((sum, s) => sum + s.totalHours, 0).toFixed(1)}h
            </div>
            <div style={{ textAlign: 'right' }}>
              {formatCurrency(filteredSalaries.reduce((sum, s) => sum + s.baseSalary, 0))}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#27ae60' }}>
                +{formatCurrency(filteredSalaries.reduce((sum, s) => sum + s.bonus, 0))}
              </span>
              {' / '}
              <span style={{ color: '#e74c3c' }}>
                -{formatCurrency(filteredSalaries.reduce((sum, s) => sum + s.deduction, 0))}
              </span>
            </div>
            <div style={{ textAlign: 'right', color: '#667eea' }}>
              {formatCurrency(filteredSalaries.reduce((sum, s) => sum + s.totalAmount, 0))}
            </div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  highlight?: boolean;
}

function SummaryCard({ label, value, icon, color, highlight }: SummaryCardProps) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      background: highlight
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : '#fff',
      color: highlight ? '#fff' : '#333',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>{label}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color }}>
        {value}
      </div>
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

interface SalaryRowProps {
  salary: SalaryWithUser;
  onApprove?: (salary: SalaryWithUser) => void;
  onMarkPaid?: (salary: SalaryWithUser) => void;
  onEdit?: (salary: SalaryWithUser) => void;
  onRecalculate?: (salary: SalaryWithUser) => void;
}

function SalaryRow({ salary, onApprove, onMarkPaid, onEdit, onRecalculate }: SalaryRowProps) {
  const [showActions, setShowActions] = useState(false);
  const statusColor = SALARY_STATUS_COLORS[salary.status];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto',
        padding: '14px 16px',
        borderBottom: '1px solid #eee',
        alignItems: 'center',
        fontSize: '14px',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Teacher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#667eea',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          fontSize: '14px',
        }}>
          {salary.teacher?.avatar || (salary.teacher?.displayName || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 500 }}>
            {salary.teacher?.displayName || salary.teacher?.username || 'Giáo viên'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {salary.totalSessions} tiết
          </div>
        </div>
      </div>

      {/* Hours */}
      <div style={{ textAlign: 'center' }}>
        {salary.totalHours.toFixed(1)}h
      </div>

      {/* Base salary */}
      <div style={{ textAlign: 'right' }}>
        {formatCurrency(salary.baseSalary)}
      </div>

      {/* Bonus/Deduction */}
      <div style={{ textAlign: 'right' }}>
        {salary.bonus > 0 && (
          <span style={{ color: '#27ae60', display: 'block', fontSize: '12px' }}>
            +{formatCurrency(salary.bonus)}
          </span>
        )}
        {salary.deduction > 0 && (
          <span style={{ color: '#e74c3c', display: 'block', fontSize: '12px' }}>
            -{formatCurrency(salary.deduction)}
          </span>
        )}
        {salary.bonus === 0 && salary.deduction === 0 && (
          <span style={{ color: '#999' }}>-</span>
        )}
      </div>

      {/* Total */}
      <div style={{ textAlign: 'right', fontWeight: 600 }}>
        {formatCurrency(salary.totalAmount)}
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 500,
          background: `${statusColor}20`,
          color: statusColor,
        }}>
          {SALARY_STATUS_LABELS[salary.status]}
        </span>
      </div>

      {/* Actions */}
      <div style={{ minWidth: '100px', textAlign: 'right' }}>
        {showActions && (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            {salary.status === 'draft' && onApprove && (
              <ActionBtn icon="✓" title="Duyệt" onClick={() => onApprove(salary)} />
            )}
            {salary.status === 'approved' && onMarkPaid && (
              <ActionBtn icon="💰" title="Đánh dấu đã trả" onClick={() => onMarkPaid(salary)} />
            )}
            {onEdit && (
              <ActionBtn icon="✏️" title="Sửa" onClick={() => onEdit(salary)} />
            )}
            {onRecalculate && (
              <ActionBtn icon="🔄" title="Tính lại" onClick={() => onRecalculate(salary)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionBtnProps {
  icon: string;
  title: string;
  onClick: () => void;
}

function ActionBtn({ icon, title, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        background: '#f5f5f5',
        cursor: 'pointer',
        fontSize: '12px',
      }}
    >
      {icon}
    </button>
  );
}

// Salary edit modal
interface SalaryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bonus: number;
    bonusNote?: string;
    deduction: number;
    deductionNote?: string;
    note?: string;
  }) => Promise<void>;
  salary?: SalaryWithUser;
  loading?: boolean;
}

export function SalaryEditModal({
  isOpen,
  onClose,
  onSubmit,
  salary,
  loading,
}: SalaryEditModalProps) {
  const [bonus, setBonus] = useState(salary?.bonus?.toString() || '0');
  const [bonusNote, setBonusNote] = useState(salary?.bonusNote || '');
  const [deduction, setDeduction] = useState(salary?.deduction?.toString() || '0');
  const [deductionNote, setDeductionNote] = useState(salary?.deductionNote || '');
  const [note, setNote] = useState(salary?.note || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      bonus: Number(bonus) || 0,
      bonusNote: bonusNote || undefined,
      deduction: Number(deduction) || 0,
      deductionNote: deductionNote || undefined,
      note: note || undefined,
    });
  };

  if (!isOpen || !salary) return null;

  const newTotal = salary.baseSalary + (Number(bonus) || 0) - (Number(deduction) || 0);

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
        maxWidth: '480px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Điều chỉnh lương</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Teacher info */}
        <div style={{
          padding: '12px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>{salary.teacher?.displayName || salary.teacher?.username}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>
              {salary.totalHours.toFixed(1)} giờ • {salary.totalSessions} tiết
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#999' }}>Lương cơ bản</div>
            <div style={{ fontWeight: 600 }}>{formatCurrency(salary.baseSalary)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bonus */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#27ae60' }}>
              Thưởng (+)
            </label>
            <input
              type="text"
              value={bonus}
              onChange={(e) => setBonus(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              value={bonusNote}
              onChange={(e) => setBonusNote(e.target.value)}
              placeholder="Lý do thưởng (VD: Dạy bù, KPI...)"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #eee',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Deduction */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, color: '#e74c3c' }}>
              Khấu trừ (-)
            </label>
            <input
              type="text"
              value={deduction}
              onChange={(e) => setDeduction(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              value={deductionNote}
              onChange={(e) => setDeductionNote(e.target.value)}
              placeholder="Lý do trừ (VD: Đi muộn, vắng...)"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #eee',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Note */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
              Ghi chú chung
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm..."
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Total preview */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            color: '#fff',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Tổng lương mới:</span>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>
              {formatCurrency(newTotal)}
            </span>
          </div>

          {/* Actions */}
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
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
