// Grades Tab - Student grades table

import { BarChart2 } from 'lucide-react';
import type { GradesTabProps } from './classroom-types';
import { EmptyState } from '../ui/empty-state';

export function GradesTab({ studentGrades, loading }: GradesTabProps) {
  return (
    <div className="classroom-grades">
      <div className="grades-header">
        <h3>Bảng điểm</h3>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : studentGrades.length === 0 ? (
        <EmptyState icon={<BarChart2 size={48} strokeWidth={1.5} />} title="Chưa có dữ liệu điểm" />
      ) : (
        <div className="grades-table-wrapper">
          <table className="grades-table">
            <thead>
              <tr>
                <th>Học viên</th>
                <th>Bài KT</th>
                <th>Bài tập</th>
                <th>Tổng điểm</th>
                <th>Trung bình</th>
              </tr>
            </thead>
            <tbody>
              {studentGrades.map(grade => (
                <tr key={grade.userId}>
                  <td>{grade.userName}</td>
                  <td>{grade.testsCompleted}</td>
                  <td>{grade.assignmentsCompleted}</td>
                  <td>{grade.totalScore}/{grade.totalPoints}</td>
                  <td>
                    <span className={`grade-percent ${grade.averagePercent >= 50 ? 'pass' : 'fail'}`}>
                      {grade.averagePercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
