// Modal component for editing salary adjustments (bonus/deduction)

import { useState } from 'react';
import type { SalaryWithUser } from './types';
import { formatCurrency } from '../../../types/teacher';

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
