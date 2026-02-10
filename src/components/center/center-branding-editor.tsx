// Branding editor for center customization

import { useState } from 'react';
import { updateBranch } from '../../services/branch-firestore';
import type { Branch, CenterBranding } from '../../types/branch';
import { DEFAULT_CENTER_BRANDING } from '../../types/branch';

interface CenterBrandingEditorProps {
  center: Branch;
}

export function CenterBrandingEditor({ center }: CenterBrandingEditorProps) {
  const initial = center.branding || DEFAULT_CENTER_BRANDING;
  const [branding, setBranding] = useState<CenterBranding>(initial);
  const [description, setDescription] = useState(center.description || '');
  const [isPublic, setIsPublic] = useState(center.isPublic ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateBranch(center.id, { branding, description, isPublic });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="center-branding-editor">
      {/* Colors */}
      <div className="center-branding-field">
        <label>Màu chủ đạo</label>
        <div className="center-branding-color-row">
          <input
            type="color"
            className="center-branding-color-input"
            value={branding.primaryColor}
            onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
          />
          <span className="center-branding-color-hex">{branding.primaryColor}</span>
        </div>
      </div>

      <div className="center-branding-field">
        <label>Màu phụ</label>
        <div className="center-branding-color-row">
          <input
            type="color"
            className="center-branding-color-input"
            value={branding.secondaryColor}
            onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
          />
          <span className="center-branding-color-hex">{branding.secondaryColor}</span>
        </div>
      </div>

      {/* Logo URL */}
      <div className="center-branding-field">
        <label>URL Logo</label>
        <input
          type="url"
          placeholder="https://..."
          value={branding.logo || ''}
          onChange={(e) => setBranding({ ...branding, logo: e.target.value || undefined })}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}
        />
      </div>

      {/* Cover Image URL */}
      <div className="center-branding-field">
        <label>URL Ảnh bìa</label>
        <input
          type="url"
          placeholder="https://..."
          value={branding.coverImage || ''}
          onChange={(e) => setBranding({ ...branding, coverImage: e.target.value || undefined })}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%' }}
        />
      </div>

      {/* Description */}
      <div className="center-branding-field">
        <label>Mô tả trung tâm</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Giới thiệu ngắn về trung tâm..."
          rows={3}
          style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', resize: 'vertical' }}
        />
      </div>

      {/* Public toggle */}
      <div className="center-branding-field">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Hiển thị trang công khai
        </label>
      </div>

      {/* Preview */}
      <div className="center-branding-field">
        <label>Xem trước</label>
        <div
          className="center-branding-preview"
          style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}
        >
          {center.name}
        </div>
      </div>

      {/* Save */}
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ alignSelf: 'flex-start' }}
      >
        {saving ? 'Đang lưu...' : saved ? 'Đã lưu ✓' : 'Lưu thay đổi'}
      </button>
    </div>
  );
}
