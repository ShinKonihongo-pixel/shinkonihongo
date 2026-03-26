// Report history tab — shows previously generated PDF reports for a student
// Extracted from student-detail-modal.tsx

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { getStudentReports } from '../../../services/report-storage-service';
import type { ReportMetadata } from '../../../types/student-report';

interface ReportHistoryTabProps {
  userId: string;
  classroomId?: string;
}

export function ReportHistoryTab({ userId, classroomId }: ReportHistoryTabProps) {
  const [reports, setReports] = useState<ReportMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomId) { setLoading(false); return; }
    getStudentReports(classroomId, userId)
      .then(setReports)
      .catch(err => setError(err instanceof Error ? err.message : 'Lỗi tải báo cáo'))
      .finally(() => setLoading(false));
  }, [classroomId, userId]);

  if (!classroomId) return <p className="empty-text">Không có thông tin lớp học.</p>;
  if (loading) return <p className="empty-text">Đang tải báo cáo...</p>;
  if (error) return <p className="empty-text" style={{ color: '#ef4444' }}>{error}</p>;
  if (reports.length === 0) return <p className="empty-text">Chưa có báo cáo nào</p>;

  return (
    <div className="report-history-list">
      {reports.map(report => (
        <div key={report.id} className="report-history-item">
          <div className="report-history-info">
            <span className="report-history-date">
              {new Date(report.generatedAt).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
            <span className="report-history-period">
              {new Date(report.periodStart).toLocaleDateString('vi-VN')} – {new Date(report.periodEnd).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <a href={report.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary report-history-download">
            <Download size={13} /> Tải xuống
          </a>
        </div>
      ))}
    </div>
  );
}
