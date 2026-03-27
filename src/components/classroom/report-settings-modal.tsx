// Report Settings Modal - Configure school info, logo, and EmailJS for reports
// Settings are saved to localStorage

import { useState, useEffect, useRef } from 'react';
import type { StudentReportConfig } from '../../types/student-report';
import { DEFAULT_REPORT_CONFIG, REPORT_SETTINGS_STORAGE_KEY } from '../../types/student-report';
import {
  X,
  Building,
  Mail,
  Image,
  Save,
  RotateCcw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { ModalShell } from '../ui/modal-shell';

interface ReportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: StudentReportConfig) => void;
}

export function ReportSettingsModal({
  isOpen,
  onClose,
  onSave,
}: ReportSettingsModalProps) {
  // State for form fields
  const [schoolName, setSchoolName] = useState(DEFAULT_REPORT_CONFIG.schoolName);
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolLogo, setSchoolLogo] = useState<string | undefined>();
  const [reportTitle, setReportTitle] = useState(DEFAULT_REPORT_CONFIG.reportTitle);
  const [emailServiceId, setEmailServiceId] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailPublicKey, setEmailPublicKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved settings on mount
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(REPORT_SETTINGS_STORAGE_KEY);
        if (saved) {
          const config: StudentReportConfig = JSON.parse(saved);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSchoolName(config.schoolName || DEFAULT_REPORT_CONFIG.schoolName);
          setSchoolAddress(config.schoolAddress || '');
          setSchoolPhone(config.schoolPhone || '');
          setSchoolEmail(config.schoolEmail || '');
          setSchoolLogo(config.schoolLogo);
          setReportTitle(config.reportTitle || DEFAULT_REPORT_CONFIG.reportTitle);
          setEmailServiceId(config.emailServiceId || '');
          setEmailTemplateId(config.emailTemplateId || '');
          setEmailPublicKey(config.emailPublicKey || '');
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [isOpen]);

  // Handle logo file upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 100KB for base64)
    if (file.size > 100 * 1024) {
      alert('Logo quá lớn. Vui lòng chọn ảnh nhỏ hơn 100KB.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh (PNG, JPG, GIF).');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setSchoolLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const removeLogo = () => {
    setSchoolLogo(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save settings
  const handleSave = () => {
    setIsSaving(true);

    const config: StudentReportConfig = {
      schoolName,
      schoolAddress: schoolAddress || undefined,
      schoolPhone: schoolPhone || undefined,
      schoolEmail: schoolEmail || undefined,
      schoolLogo: schoolLogo || undefined,
      reportTitle,
      showAttendance: true,
      showGrades: true,
      showEvaluation: true,
      showSignatures: true,
      emailServiceId: emailServiceId || undefined,
      emailTemplateId: emailTemplateId || undefined,
      emailPublicKey: emailPublicKey || undefined,
    };

    try {
      localStorage.setItem(REPORT_SETTINGS_STORAGE_KEY, JSON.stringify(config));
      onSave?.(config);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error saving settings:', error);
      setIsSaving(false);
      alert('Lỗi khi lưu cài đặt. Vui lòng thử lại.');
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (confirm('Bạn có chắc muốn khôi phục cài đặt mặc định?')) {
      setSchoolName(DEFAULT_REPORT_CONFIG.schoolName);
      setSchoolAddress('');
      setSchoolPhone('');
      setSchoolEmail('');
      setSchoolLogo(undefined);
      setReportTitle(DEFAULT_REPORT_CONFIG.reportTitle);
      setEmailServiceId('');
      setEmailTemplateId('');
      setEmailPublicKey('');
      localStorage.removeItem(REPORT_SETTINGS_STORAGE_KEY);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Cài đặt báo cáo" maxWidth={550}>
        {/* School Info Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--jp-ai)' }}>
            <Building size={18} />
            Thông tin trường
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Tên trường / Trung tâm *
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="Trung tâm Nhật ngữ ABC"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Địa chỉ
            </label>
            <input
              type="text"
              value={schoolAddress}
              onChange={e => setSchoolAddress(e.target.value)}
              placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Điện thoại
              </label>
              <input
                type="tel"
                value={schoolPhone}
                onChange={e => setSchoolPhone(e.target.value)}
                placeholder="0123 456 789"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Email
              </label>
              <input
                type="email"
                value={schoolEmail}
                onChange={e => setSchoolEmail(e.target.value)}
                placeholder="info@trungtam.com"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Tiêu đề báo cáo
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              placeholder="PHIẾU ĐÁNH GIÁ HỌC VIÊN"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        </div>

        {/* Logo Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--jp-ai)' }}>
            <Image size={18} />
            Logo trường
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {schoolLogo ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  loading="lazy"
                  style={{ width: '80px', height: '80px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px' }}
                />
                <button
                  onClick={removeLogo}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '80px',
                  height: '80px',
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--gray)',
                }}
              >
                <Image size={32} />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
                style={{ marginBottom: '0.5rem' }}
              >
                {schoolLogo ? 'Đổi logo' : 'Tải lên logo'}
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                PNG, JPG - Toi da 100KB
              </div>
            </div>
          </div>
        </div>

        {/* EmailJS Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem', color: 'var(--jp-ai)' }}>
              <Mail size={18} />
              Cấu hình EmailJS
            </h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowHelp(!showHelp)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
            >
              <HelpCircle size={14} />
              Hướng dẫn
            </button>
          </div>

          {showHelp && (
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--jp-washi-cool)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Bước 1:</strong> Đăng ký tài khoản tại{' '}
                <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--jp-ai)' }}>
                  emailjs.com <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
                </a>
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Bước 2:</strong> Tạo Email Service (chọn Gmail, Outlook, v.v.)
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Bước 3:</strong> Tạo Email Template với các biến: to_email, to_name, from_name, school_name, report_period, message, pdf_url
              </p>
              <p style={{ marginBottom: '0' }}>
                <strong>Bước 4:</strong> Copy Service ID, Template ID và Public Key vào đây
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Service ID
            </label>
            <input
              type="text"
              value={emailServiceId}
              onChange={e => setEmailServiceId(e.target.value)}
              placeholder="service_xxxxxxx"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Template ID
            </label>
            <input
              type="text"
              value={emailTemplateId}
              onChange={e => setEmailTemplateId(e.target.value)}
              placeholder="template_xxxxxxx"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Public Key
            </label>
            <input
              type="text"
              value={emailPublicKey}
              onChange={e => setEmailPublicKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxx"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RotateCcw size={16} />
            Mặc định
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !schoolName.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={16} />
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
    </ModalShell>
  );
}
