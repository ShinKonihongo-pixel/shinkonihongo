// Report Settings Modal - Configure school info, logo, and EmailJS for reports
// Settings are saved to localStorage

import { useState, useEffect, useRef } from 'react';
import type { StudentReportConfig } from '../../types/student-report';
import { DEFAULT_REPORT_CONFIG, REPORT_SETTINGS_STORAGE_KEY } from '../../types/student-report';
import {
  X,
  Settings,
  Building,
  Mail,
  Image,
  Save,
  RotateCcw,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

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
      alert('Logo qua lon. Vui long chon anh nho hon 100KB.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Vui long chon file anh (PNG, JPG, GIF).');
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
      alert('Loi khi luu cai dat. Vui long thu lai.');
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (confirm('Ban co chac muon khoi phuc cai dat mac dinh?')) {
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content report-settings-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '550px', maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem' }}>
            <Settings size={24} />
            Cai dat bao cao
          </h2>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* School Info Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--jp-ai)' }}>
            <Building size={18} />
            Thong tin truong
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Ten truong / Trung tam *
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              placeholder="Trung tam Nhat ngu ABC"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Dia chi
            </label>
            <input
              type="text"
              value={schoolAddress}
              onChange={e => setSchoolAddress(e.target.value)}
              placeholder="123 Duong ABC, Quan XYZ, TP.HCM"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Dien thoai
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
              Tieu de bao cao
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              placeholder="PHIEU DANH GIA HOC VIEN"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
            />
          </div>
        </div>

        {/* Logo Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--jp-ai)' }}>
            <Image size={18} />
            Logo truong
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {schoolLogo ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={schoolLogo}
                  alt="School Logo"
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
                {schoolLogo ? 'Doi logo' : 'Tai len logo'}
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
              Cau hinh EmailJS
            </h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowHelp(!showHelp)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
            >
              <HelpCircle size={14} />
              Huong dan
            </button>
          </div>

          {showHelp && (
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--jp-washi-cool)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Buoc 1:</strong> Dang ky tai khoan tai{' '}
                <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--jp-ai)' }}>
                  emailjs.com <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
                </a>
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Buoc 2:</strong> Tao Email Service (chon Gmail, Outlook, v.v.)
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Buoc 3:</strong> Tao Email Template voi cac bien: to_email, to_name, from_name, school_name, report_period, message, pdf_url
              </p>
              <p style={{ marginBottom: '0' }}>
                <strong>Buoc 4:</strong> Copy Service ID, Template ID va Public Key vao day
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
            Mac dinh
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>
            Huy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving || !schoolName.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={16} />
            {isSaving ? 'Dang luu...' : 'Luu cai dat'}
          </button>
        </div>
      </div>
    </div>
  );
}
