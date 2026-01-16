// Salary slip component - Individual salary slip for print/PDF export

import { useRef } from 'react';
import type { Salary } from '../../types/teacher';
import type { User } from '../../types/user';
import type { Branch } from '../../types/branch';
import {
  SALARY_STATUS_LABELS,
  formatCurrency,
} from '../../types/teacher';
import { BRANCH_MEMBER_ROLE_LABELS } from '../../types/branch';

interface SalaryWithDetails extends Salary {
  teacher?: User;
  branch?: Branch;
}

interface SalarySlipProps {
  salary: SalaryWithDetails;
  onClose?: () => void;
  onPrint?: () => void;
}

export function SalarySlip({ salary, onClose, onPrint }: SalarySlipProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const monthDisplay = salary.month
    ? new Date(salary.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : '';

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
        background: '#f5f5f5',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }} className="no-print">
          <h3 style={{ margin: 0 }}>Phiếu lương</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🖨</span> In phiếu
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Printable salary slip */}
        <div
          ref={printRef}
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Company header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #667eea',
          }}>
            <h2 style={{
              margin: '0 0 4px 0',
              color: '#667eea',
              fontSize: '20px',
            }}>
              {salary.branch?.name || 'Trung Tâm Nhật Ngữ'}
            </h2>
            {salary.branch?.address && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                {salary.branch.address}
              </div>
            )}
            {salary.branch?.phone && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                ĐT: {salary.branch.phone}
              </div>
            )}
          </div>

          {/* Slip title */}
          <h3 style={{
            textAlign: 'center',
            margin: '0 0 24px 0',
            fontSize: '18px',
            fontWeight: 600,
          }}>
            PHIẾU LƯƠNG
            <div style={{ fontSize: '14px', fontWeight: 400, color: '#666', marginTop: '4px' }}>
              {monthDisplay}
            </div>
          </h3>

          {/* Teacher info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            background: '#f9f9f9',
            borderRadius: '8px',
          }}>
            <InfoRow label="Họ tên" value={salary.teacher?.displayName || salary.teacher?.username || '-'} />
            <InfoRow label="Vai trò" value={salary.teacher?.role ? BRANCH_MEMBER_ROLE_LABELS[salary.teacher.role as keyof typeof BRANCH_MEMBER_ROLE_LABELS] || salary.teacher.role : '-'} />
            <InfoRow label="Email" value={salary.teacher?.email || '-'} />
            <InfoRow label="Mã nhân viên" value={salary.teacherId.slice(0, 8).toUpperCase()} />
          </div>

          {/* Work summary */}
          <div style={{
            marginBottom: '24px',
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              Tổng hợp công việc
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              <SummaryBox
                label="Tổng số tiết"
                value={salary.totalSessions.toString()}
                unit="tiết"
              />
              <SummaryBox
                label="Tổng số giờ"
                value={salary.totalHours.toFixed(1)}
                unit="giờ"
              />
            </div>
          </div>

          {/* Salary breakdown */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              Chi tiết lương
            </h4>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <tbody>
                <SalaryLine
                  label="Lương cơ bản"
                  amount={salary.baseSalary}
                />
                {salary.bonus > 0 && (
                  <SalaryLine
                    label={`Thưởng${salary.bonusNote ? ` (${salary.bonusNote})` : ''}`}
                    amount={salary.bonus}
                    type="add"
                  />
                )}
                {salary.deduction > 0 && (
                  <SalaryLine
                    label={`Khấu trừ${salary.deductionNote ? ` (${salary.deductionNote})` : ''}`}
                    amount={salary.deduction}
                    type="subtract"
                  />
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{
                    padding: '12px 0',
                    fontWeight: 700,
                    fontSize: '16px',
                    borderTop: '2px solid #333',
                  }}>
                    TỔNG CỘNG
                  </td>
                  <td style={{
                    padding: '12px 0',
                    fontWeight: 700,
                    fontSize: '18px',
                    textAlign: 'right',
                    borderTop: '2px solid #333',
                    color: '#667eea',
                  }}>
                    {formatCurrency(salary.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Note */}
          {salary.note && (
            <div style={{
              marginBottom: '24px',
              padding: '12px',
              background: '#fff8e6',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#856404',
            }}>
              <strong>Ghi chú:</strong> {salary.note}
            </div>
          )}

          {/* Status and payment info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: salary.status === 'paid' ? '#e8f5e9' : '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <div>
              <span style={{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                background: salary.status === 'paid' ? '#27ae60' : salary.status === 'approved' ? '#3498db' : '#95a5a6',
                color: '#fff',
              }}>
                {SALARY_STATUS_LABELS[salary.status]}
              </span>
            </div>
            {salary.paidAt && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Ngày thanh toán: {new Date(salary.paidAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            marginTop: '32px',
          }}>
            <SignatureBox label="Người lập phiếu" />
            <SignatureBox label="Người nhận" />
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #eee',
            textAlign: 'center',
            fontSize: '11px',
            color: '#999',
          }}>
            Phiếu lương được tạo ngày {new Date(salary.createdAt).toLocaleDateString('vi-VN')}
            {salary.approvedAt && ` • Duyệt ngày ${new Date(salary.approvedAt).toLocaleDateString('vi-VN')}`}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .no-print {
            display: none !important;
          }
          [ref="printRef"], [ref="printRef"] * {
            visibility: visible;
          }
          [ref="printRef"] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Preview mode - inline display without modal
interface SalarySlipPreviewProps {
  salary: SalaryWithDetails;
}

export function SalarySlipPreview({ salary }: SalarySlipPreviewProps) {
  const monthDisplay = salary.month
    ? new Date(salary.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #eee',
      }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#667eea' }}>
            {salary.branch?.name || 'Chi nhánh'}
          </h4>
          <div style={{ fontSize: '12px', color: '#999' }}>{monthDisplay}</div>
        </div>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          background: salary.status === 'paid' ? '#27ae6020' : salary.status === 'approved' ? '#3498db20' : '#95a5a620',
          color: salary.status === 'paid' ? '#27ae60' : salary.status === 'approved' ? '#3498db' : '#95a5a6',
        }}>
          {SALARY_STATUS_LABELS[salary.status]}
        </span>
      </div>

      {/* Teacher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#667eea',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
        }}>
          {(salary.teacher?.displayName || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 500 }}>
            {salary.teacher?.displayName || salary.teacher?.username || '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {salary.totalHours.toFixed(1)} giờ • {salary.totalSessions} tiết
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
          <span style={{ color: '#666' }}>Lương cơ bản</span>
          <span>{formatCurrency(salary.baseSalary)}</span>
        </div>
        {salary.bonus > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#27ae60' }}>Thưởng</span>
            <span style={{ color: '#27ae60' }}>+{formatCurrency(salary.bonus)}</span>
          </div>
        )}
        {salary.deduction > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
            <span style={{ color: '#e74c3c' }}>Khấu trừ</span>
            <span style={{ color: '#e74c3c' }}>-{formatCurrency(salary.deduction)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        color: '#fff',
      }}>
        <span style={{ fontSize: '13px' }}>Tổng cộng</span>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>
          {formatCurrency(salary.totalAmount)}
        </span>
      </div>
    </div>
  );
}

// Helper components
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

interface SummaryBoxProps {
  label: string;
  value: string;
  unit: string;
}

function SummaryBox({ label, value, unit }: SummaryBoxProps) {
  return (
    <div style={{
      padding: '16px',
      background: '#f5f5f5',
      borderRadius: '8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>
        {value}
        <span style={{ fontSize: '14px', fontWeight: 400, color: '#666', marginLeft: '4px' }}>{unit}</span>
      </div>
    </div>
  );
}

interface SalaryLineProps {
  label: string;
  amount: number;
  type?: 'add' | 'subtract';
}

function SalaryLine({ label, amount, type }: SalaryLineProps) {
  return (
    <tr>
      <td style={{
        padding: '10px 0',
        borderBottom: '1px solid #eee',
        color: type === 'add' ? '#27ae60' : type === 'subtract' ? '#e74c3c' : '#333',
      }}>
        {type === 'add' && '+ '}
        {type === 'subtract' && '- '}
        {label}
      </td>
      <td style={{
        padding: '10px 0',
        textAlign: 'right',
        borderBottom: '1px solid #eee',
        fontWeight: 500,
        color: type === 'add' ? '#27ae60' : type === 'subtract' ? '#e74c3c' : '#333',
      }}>
        {type === 'add' && '+'}
        {type === 'subtract' && '-'}
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}

interface SignatureBoxProps {
  label: string;
}

function SignatureBox({ label }: SignatureBoxProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '40px' }}>{label}</div>
      <div style={{ borderTop: '1px solid #ccc', paddingTop: '8px', fontSize: '11px', color: '#999' }}>
        (Ký và ghi rõ họ tên)
      </div>
    </div>
  );
}
