// Role permission management — editable matrix with per-role customization
// Super admin can toggle permissions for each role

import { useState, useCallback } from 'react';
import {
  Shield, Check, ChevronDown, Save, RotateCcw,
  BookOpen, Gamepad2, GraduationCap, Settings, Users,
} from 'lucide-react';
import type { UserRole } from '../../types/user';
import './role-permissions-page.css';

// ─── Static data definitions ──────────────────────────────────────────────────

// Ordered role list — order here determines the left-panel display sequence.
// Color is used both for the dot indicator and for the role badge.
const ROLES: { id: UserRole; label: string; description: string; color: string }[] = [
  { id: 'super_admin', label: 'Super Admin', description: 'Toàn quyền hệ thống', color: '#dc2626' },
  { id: 'director', label: 'Giám đốc', description: 'Quản lý đa chi nhánh', color: '#8b5cf6' },
  { id: 'branch_admin', label: 'Admin CN', description: 'Quản lý 1 chi nhánh', color: '#6366f1' },
  { id: 'admin', label: 'Admin', description: 'Quản lý nội dung', color: '#f59e0b' },
  { id: 'main_teacher', label: 'GV chính', description: 'Dạy & quản lý lớp', color: '#3b82f6' },
  { id: 'part_time_teacher', label: 'GV PT', description: 'Dạy lớp được giao', color: '#06b6d4' },
  { id: 'assistant', label: 'Trợ giảng', description: 'Hỗ trợ giáo viên', color: '#14b8a6' },
  { id: 'vip_user', label: 'VIP', description: 'Nội dung premium', color: '#ec4899' },
  { id: 'user', label: 'Học viên', description: 'Gói miễn phí', color: 'rgba(255,255,255,0.3)' },
];

// Permission sections with icons — each section groups related permissions in
// the collapsible accordion on the right panel.
const SECTIONS = [
  { key: 'learning', label: 'HỌC TẬP', icon: BookOpen },
  { key: 'games', label: 'TRÒ CHƠI', icon: Gamepad2 },
  { key: 'jlpt', label: 'LUYỆN THI', icon: GraduationCap },
  { key: 'management', label: 'QUẢN LÝ', icon: Users },
  { key: 'system', label: 'HỆ THỐNG', icon: Settings },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];

interface PermDef {
  id: string;
  label: string;
  section: SectionKey;
  // defaults maps each role id to its initial permission value.
  // Used to seed state on first render and when reverting unsaved edits.
  defaults: Record<string, boolean>;
}

// Default permissions matrix — source of truth for initial state and resets.
// Each entry declares which roles have the permission enabled by default.
const PERM_DEFS: PermDef[] = [
  // Learning
  { id: 'vocab_n5', label: 'Từ vựng N5', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'vocab_n4n1', label: 'Từ vựng N4-N1', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: false } },
  { id: 'grammar', label: 'Ngữ pháp', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'kanji', label: 'Hán tự (Kanji)', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'reading', label: 'Đọc hiểu', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'listening', label: 'Nghe hiểu', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'exercises', label: 'Bài tập', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'locked_lessons', label: 'Bài học bị khóa', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: false, assistant: false, vip_user: true, user: false } },
  { id: 'kaiwa', label: 'Hội thoại (会話)', section: 'learning', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: false, assistant: false, vip_user: true, user: false } },
  // Games
  { id: 'basic_games', label: 'Game cơ bản', section: 'games', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'all_games', label: 'Tất cả 11 trò chơi', section: 'games', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: false } },
  { id: 'quiz_battle', label: 'Quiz Battle (ELO)', section: 'games', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  // JLPT
  { id: 'jlpt_n5', label: 'JLPT N5', section: 'jlpt', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: true } },
  { id: 'jlpt_n4n1', label: 'JLPT N4-N1', section: 'jlpt', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: true, user: false } },
  // Management
  { id: 'manage_content', label: 'Quản lý nội dung', section: 'management', defaults: { super_admin: true, director: false, branch_admin: false, admin: true, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'manage_classes', label: 'Quản lý lớp học', section: 'management', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: true, part_time_teacher: true, assistant: true, vip_user: false, user: false } },
  { id: 'manage_users', label: 'Quản lý người dùng', section: 'management', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'manage_branches', label: 'Quản lý chi nhánh', section: 'management', defaults: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'manage_teachers', label: 'Quản lý giáo viên', section: 'management', defaults: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'salary', label: 'Bảng lương', section: 'management', defaults: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'center_dashboard', label: 'Dashboard trung tâm', section: 'management', defaults: { super_admin: true, director: true, branch_admin: true, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  // System
  { id: 'theme', label: 'Theme & giao diện', section: 'system', defaults: { super_admin: true, director: false, branch_admin: false, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'permissions', label: 'Quản lý phân quyền', section: 'system', defaults: { super_admin: true, director: false, branch_admin: false, admin: false, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
  { id: 'grant_vip', label: 'Cấp VIP cho user', section: 'system', defaults: { super_admin: true, director: true, branch_admin: true, admin: true, main_teacher: false, part_time_teacher: false, assistant: false, vip_user: false, user: false } },
];

// ─── State helpers ────────────────────────────────────────────────────────────

/**
 * Build the initial permissions state object from PERM_DEFS defaults.
 * Returns a nested map: { [roleId]: { [permId]: boolean } }.
 * Called once on first render (passed as a lazy initializer to useState).
 */
function buildDefaultState(): Record<string, Record<string, boolean>> {
  const state: Record<string, Record<string, boolean>> = {};
  for (const role of ROLES) {
    state[role.id] = {};
    for (const perm of PERM_DEFS) {
      // Fall back to false for any role/perm combination not listed in defaults
      state[role.id][perm.id] = perm.defaults[role.id] ?? false;
    }
  }
  return state;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RolePermissionsPage — two-panel permission editor.
 *
 * Layout:
 *  Left panel  (rp-roles)  — scrollable list of all roles. Clicking a role
 *                            selects it and updates the right panel.
 *  Right panel (rp-editor) — collapsible accordion sections; each section lists
 *                            individual permission toggle rows for the selected role.
 *
 * Permission state management:
 *  - `permState`  holds the current (possibly unsaved) permission values.
 *  - `savedState` holds the last confirmed-saved values (deep copy on save).
 *  - `hasChanges` is derived by comparing them as JSON strings — drives the
 *    save/reset button visibility in the header.
 *  - Reset (handleReset) replaces permState with a deep copy of savedState,
 *    discarding all unsaved edits.
 *  - Save (handleSave) writes permState into savedState.
 *    TODO: also persist to Firestore via a permissions service.
 */
export function RolePermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('director');
  // permState: live editable permissions (may differ from savedState)
  const [permState, setPermState] = useState(buildDefaultState);
  // savedState: last persisted snapshot used for dirty-check and reset
  const [savedState, setSavedState] = useState(buildDefaultState);
  // Only one accordion section open at a time; null = all collapsed
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('learning');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Derived: true when permState diverges from savedState — shows save/reset buttons
  const hasChanges = JSON.stringify(permState) !== JSON.stringify(savedState);
  const role = ROLES.find(r => r.id === selectedRole)!;

  /** Count how many permissions are enabled for a given role (used in sidebar badges). */
  const getPermCount = useCallback((roleId: string) => {
    return PERM_DEFS.filter(p => permState[roleId]?.[p.id]).length;
  }, [permState]);

  /**
   * Toggle a single permission for the given role.
   *
   * Super admin lock: super_admin permissions are always-on and cannot be toggled.
   * This prevents accidental lockout of the system owner.
   */
  const togglePerm = (roleId: string, permId: string) => {
    if (roleId === 'super_admin') return; // super_admin is immutable
    setPermState(prev => ({
      ...prev,
      [roleId]: { ...prev[roleId], [permId]: !prev[roleId][permId] },
    }));
    setSaveSuccess(false);
  };

  /**
   * Section toggle — enables or disables ALL permissions in a section at once.
   *
   * If every permission in the section is already enabled → disable all (bulk off).
   * Otherwise → enable all (bulk on). This matches the standard "select all" pattern.
   * Super admin is locked and cannot be bulk-edited.
   */
  const toggleSection = (section: SectionKey) => {
    if (selectedRole === 'super_admin') return; // super_admin is immutable
    const sectionPerms = PERM_DEFS.filter(p => p.section === section);
    // Determine current state: true only when every perm in the section is on
    const allEnabled = sectionPerms.every(p => permState[selectedRole]?.[p.id]);
    setPermState(prev => {
      const updated = { ...prev, [selectedRole]: { ...prev[selectedRole] } };
      for (const perm of sectionPerms) {
        // Flip all to the opposite of the current all-on state
        updated[selectedRole][perm.id] = !allEnabled;
      }
      return updated;
    });
    setSaveSuccess(false);
  };

  /**
   * Save handler — simulates an async persist (500 ms delay).
   * Commits permState into savedState via a deep copy so they are independent
   * objects (shallow copy would cause them to share nested references).
   * TODO: Replace the setTimeout with a real Firestore write.
   */
  const handleSave = async () => {
    setSaving(true);
    // TODO: Persist to Firestore via a permissions service
    await new Promise(resolve => setTimeout(resolve, 500));
    setSavedState(JSON.parse(JSON.stringify(permState)));
    setSaving(false);
    setSaveSuccess(true);
    // Auto-hide the success indicator after 2 s
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  /** Revert all unsaved edits by restoring permState from the last saved snapshot. */
  const handleReset = () => {
    setPermState(JSON.parse(JSON.stringify(savedState)));
    setSaveSuccess(false);
  };

  return (
    <div className="rp">
      {/* Header — save/reset buttons only appear when there are unsaved changes */}
      <div className="rp-header">
        <div className="rp-header-left">
          <div className="rp-header-icon"><Shield size={20} /></div>
          <div>
            <h2 className="rp-title">Phân quyền hệ thống</h2>
            <p className="rp-subtitle">Tuỳ chỉnh quyền truy cập cho từng vai trò</p>
          </div>
        </div>
        {/* Conditionally rendered — only when hasChanges is true */}
        {hasChanges && (
          <div className="rp-header-actions">
            <button className="rp-btn-reset" onClick={handleReset}><RotateCcw size={14} /> Hoàn tác</button>
            <button className="rp-btn-save" onClick={handleSave} disabled={saving}>
              <Save size={14} />
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}
        {/* Success indicator auto-hides after 2 s */}
        {saveSuccess && <span className="rp-save-ok"><Check size={14} /> Đã lưu</span>}
      </div>

      <div className="rp-divider" />

      {/*
       * Two-panel layout:
       *  Left  (rp-roles)  — role selector list
       *  Right (rp-editor) — permission accordion for the selected role
       */}
      <div className="rp-layout">
        {/* Left panel: Role selector list */}
        <div className="rp-roles">
          <div className="rp-roles-title">Vai trò</div>
          {ROLES.map(r => {
            const count = getPermCount(r.id);
            const isActive = selectedRole === r.id;
            return (
              <button
                key={r.id}
                className={`rp-role-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedRole(r.id)}
              >
                {/* Colored dot encodes role tier at a glance */}
                <span className="rp-role-dot" style={{ background: r.color }} />
                <div className="rp-role-info">
                  <span className="rp-role-label">{r.label}</span>
                  <span className="rp-role-desc">{r.description}</span>
                </div>
                {/* Permission count badge: enabled / total */}
                <span className="rp-role-count">{count}/{PERM_DEFS.length}</span>
              </button>
            );
          })}
        </div>

        {/* Right panel: Permission editor for the selected role */}
        <div className="rp-editor">
          {/* Selected role badge + super_admin lock notice */}
          <div className="rp-editor-head">
            <span className="rp-editor-badge" style={{ background: role.color }}>{role.label}</span>
            <span className="rp-editor-desc">{role.description}</span>
            {/* Lock label signals that super_admin permissions cannot be edited */}
            {selectedRole === 'super_admin' && (
              <span className="rp-editor-lock">🔒 Không thể chỉnh sửa</span>
            )}
          </div>

          {/* Permission sections accordion */}
          {SECTIONS.map(section => {
            const SIcon = section.icon;
            const sectionPerms = PERM_DEFS.filter(p => p.section === section.key);
            const enabledCount = sectionPerms.filter(p => permState[selectedRole]?.[p.id]).length;
            const allEnabled = enabledCount === sectionPerms.length;
            // Only one section expanded at a time; clicking the header toggles it
            const isExpanded = expandedSection === section.key;

            return (
              <div key={section.key} className={`rp-section ${isExpanded ? 'expanded' : ''}`}>
                {/* Section header — clicking expands/collapses this section */}
                <div className="rp-section-head" onClick={() => setExpandedSection(isExpanded ? null : section.key)}>
                  <SIcon size={15} className="rp-section-icon" />
                  <span className="rp-section-label">{section.label}</span>
                  {/* Live count of enabled perms in this section */}
                  <span className="rp-section-count">{enabledCount}/{sectionPerms.length}</span>
                  {/* Section bulk toggle — hidden for super_admin (all perms always on) */}
                  {selectedRole !== 'super_admin' && (
                    <button
                      className={`rp-section-toggle ${allEnabled ? 'on' : ''}`}
                      onClick={e => {
                        // Stop propagation so this click doesn't also expand/collapse the section
                        e.stopPropagation();
                        toggleSection(section.key);
                      }}
                      aria-label={`Bật/tắt tất cả ${section.label}`}
                    >
                      <span className="rp-section-toggle-thumb" />
                    </button>
                  )}
                  <ChevronDown size={14} className={`rp-section-chevron ${isExpanded ? 'open' : ''}`} />
                </div>

                {/* Individual permission rows — only rendered when section is expanded */}
                {isExpanded && (
                  <div className="rp-section-perms">
                    {sectionPerms.map(perm => {
                      const enabled = permState[selectedRole]?.[perm.id] ?? false;
                      // isSuperAdmin drives the 'locked' CSS class — grays out row and
                      // prevents clicks (togglePerm also guards against super_admin edits)
                      const isSuperAdmin = selectedRole === 'super_admin';
                      return (
                        <div
                          key={perm.id}
                          className={`rp-perm-row ${enabled ? 'on' : 'off'} ${isSuperAdmin ? 'locked' : ''}`}
                          onClick={() => togglePerm(selectedRole, perm.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && togglePerm(selectedRole, perm.id)}
                        >
                          <span className="rp-perm-name">{perm.label}</span>
                          {/* Visual toggle switch — state driven by CSS classes, not native checkbox */}
                          <div className={`rp-perm-switch ${enabled ? 'on' : ''}`}>
                            <span className="rp-perm-switch-thumb" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick comparison strip — shows all other roles with their permission counts.
              Clicking any pill switches the editor to that role without leaving the page. */}
          <div className="rp-compare">
            <div className="rp-compare-title">So sánh nhanh</div>
            <div className="rp-compare-grid">
              {ROLES.filter(r => r.id !== selectedRole).map(r => {
                const count = getPermCount(r.id);
                return (
                  <button key={r.id} className="rp-compare-pill" onClick={() => setSelectedRole(r.id)}>
                    <span className="rp-compare-dot" style={{ background: r.color }} />
                    <span>{r.label}</span>
                    <span className="rp-compare-num">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
