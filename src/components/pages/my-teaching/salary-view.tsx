import { formatCurrency } from '../../../types/teacher';
import type { Salary } from '../../../types/teacher';
import { SalaryDetail } from './salary-detail';
import { getSalaryStatusLabel, getSalaryStatusColor, getSalaryStatusIcon, formatMonth } from './utils';

interface SalaryViewProps {
  currentSalary: Salary | undefined;
  salaries: Salary[];
  totalEarned: number;
  totalPending: number;
  selectedMonth: string;
  salaryLoading: boolean;
}

export function SalaryView({
  currentSalary,
  salaries,
  totalEarned,
  totalPending,
  selectedMonth,
  salaryLoading,
}: SalaryViewProps) {
  return (
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
  );
}
