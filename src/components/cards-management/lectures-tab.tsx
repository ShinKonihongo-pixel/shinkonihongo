// Lectures Management Tab - Lecture folder navigation and management

import { useState } from 'react';
import { FolderOpen, FileText } from 'lucide-react';
import { LectureCard } from '../lecture/lecture-card';
import { ConfirmModal } from '../ui/confirm-modal';
import { EmptyState } from '../ui/empty-state';
import type { LecturesTabProps, LectureNavState, Lecture, LectureFolder } from './cards-management-types';
import { JLPT_LEVELS } from './cards-management-types';

export function LecturesTab({
  lectures,
  loading,
  onDeleteLecture,
  onToggleHide,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevel,
  getLecturesByFolder,
  onNavigateToEditor,
  currentUser,
  isSuperAdmin,
}: LecturesTabProps) {
  const [navState, setNavState] = useState<LectureNavState>({ type: 'root' });
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [deleteLectureTarget, setDeleteLectureTarget] = useState<Lecture | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<LectureFolder | null>(null);

  const breadcrumb = (() => {
    const crumbs = ['Bài giảng'];
    if (navState.type === 'level' || navState.type === 'folder') crumbs.push(navState.level);
    if (navState.type === 'folder') crumbs.push(navState.folderName);
    return crumbs;
  })();

  const goBack = () => {
    if (navState.type === 'folder') setNavState({ type: 'level', level: navState.level });
    else if (navState.type === 'level') setNavState({ type: 'root' });
  };

  const getLectureCountByLevel = (level: string) => lectures.filter(l => l.jlptLevel === level).length;
  const getLectureCountByFolder = (folderId: string) => lectures.filter(l => l.folderId === folderId).length;

  const canModifyFolder = (folder: LectureFolder) => isSuperAdmin || folder.createdBy === currentUser.id;
  const canHideLecture = (lecture: Lecture) => isSuperAdmin || lecture.authorId === currentUser.id;

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'level') return;
    await onAddFolder(newFolderName.trim(), navState.level, currentUser.id);
    setNewFolderName('');
    setAddingFolder(false);
  };

  const handleUpdateFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) return;
    await onUpdateFolder(folderId, { name: editingFolderName.trim() });
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  return (
    <>
      <div className="breadcrumb">
        {breadcrumb.map((crumb, idx) => (
          <span key={idx}>
            {idx > 0 && ' / '}
            <span className={idx === breadcrumb.length - 1 ? 'current' : 'clickable'} onClick={() => idx === 0 && setNavState({ type: 'root' })}>{crumb}</span>
          </span>
        ))}
      </div>

      {navState.type !== 'root' && <button className="btn btn-back" onClick={goBack}>← Quay lại</button>}

      {!addingFolder && (
        <div className="folder-actions">
          {navState.type === 'folder' && (
            <button className="btn btn-primary" onClick={() => onNavigateToEditor?.(undefined, navState.folderId, navState.level)}>+ Tạo bài giảng</button>
          )}
          {navState.type === 'level' && (
            <button className="btn btn-secondary" onClick={() => setAddingFolder(true)}>+ Tạo thư mục</button>
          )}
        </div>
      )}

      {addingFolder && (
        <div className="add-category-inline">
          <input
            type="text"
            className="category-input"
            placeholder="Tên thư mục..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
            }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleAddFolder}>Lưu</button>
          <button className="btn btn-cancel" onClick={() => { setAddingFolder(false); setNewFolderName(''); }}>Hủy</button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Đang tải...</div>
      ) : (
        <div className="folder-content">
          {navState.type === 'root' && (
            <div className="folder-list">
              {JLPT_LEVELS.map(level => (
                <div key={level} className="folder-item" onClick={() => setNavState({ type: 'level', level })}>
                  <span className="folder-icon">📁</span>
                  <span className="folder-name">{level}</span>
                  <span className="folder-count">({getLectureCountByLevel(level)} bài giảng)</span>
                </div>
              ))}
            </div>
          )}

          {navState.type === 'level' && (
            <div className="folder-list">
              {getFoldersByLevel(navState.level).map(folder => (
                <div key={folder.id} className="folder-item" onClick={() => setNavState({ type: 'folder', level: navState.level, folderId: folder.id, folderName: folder.name })}>
                  <span className="folder-icon">📂</span>
                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      className="edit-input inline"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => handleUpdateFolder(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateFolder(folder.id);
                        if (e.key === 'Escape') { setEditingFolderId(null); setEditingFolderName(''); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="folder-name" onDoubleClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>{folder.name}</span>
                  )}
                  <span className="folder-count">({getLectureCountByFolder(folder.id)} bài giảng)</span>
                  {canModifyFolder(folder) && (
                    <>
                      <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} title="Sửa tên">✎</button>
                      <button className="delete-btn" onClick={(e) => { e.stopPropagation(); setDeleteFolderTarget(folder); }} title="Xóa">×</button>
                    </>
                  )}
                </div>
              ))}
              {getFoldersByLevel(navState.level).length === 0 && <EmptyState compact icon={<FolderOpen size={36} strokeWidth={1.5} />} title="Chưa có thư mục nào" description='Nhấn "+ Tạo thư mục" để thêm' />}
            </div>
          )}

          {navState.type === 'folder' && (
            <div className="lecture-grid" style={{ marginTop: '1rem' }}>
              {getLecturesByFolder(navState.folderId).length === 0 ? (
                <EmptyState compact icon={<FileText size={36} strokeWidth={1.5} />} title="Chưa có bài giảng nào" description='Nhấn "+ Tạo bài giảng" để thêm' />
              ) : (
                getLecturesByFolder(navState.folderId).map(lecture => (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    onClick={() => onNavigateToEditor?.(lecture.id)}
                    onEdit={() => onNavigateToEditor?.(lecture.id)}
                    onDelete={() => setDeleteLectureTarget(lecture)}
                    onHide={() => onToggleHide(lecture.id)}
                    showActions={true}
                    canHide={canHideLecture(lecture)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteLectureTarget !== null}
        title="Xác nhận xóa bài giảng"
        message={`Bạn có chắc muốn xóa bài giảng "${deleteLectureTarget?.title || ''}"?`}
        confirmText="Xóa"
        onConfirm={async () => { if (deleteLectureTarget) { await onDeleteLecture(deleteLectureTarget.id); setDeleteLectureTarget(null); } }}
        onCancel={() => setDeleteLectureTarget(null)}
      />

      <ConfirmModal
        isOpen={deleteFolderTarget !== null}
        title="Xác nhận xóa thư mục"
        message={`Bạn có chắc muốn xóa thư mục "${deleteFolderTarget?.name || ''}"?`}
        confirmText="Xóa"
        onConfirm={async () => { if (deleteFolderTarget) { await onDeleteFolder(deleteFolderTarget.id); setDeleteFolderTarget(null); } }}
        onCancel={() => setDeleteFolderTarget(null)}
      />
    </>
  );
}
