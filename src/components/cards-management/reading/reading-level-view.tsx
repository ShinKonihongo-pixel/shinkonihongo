// Reading Tab - Level View (Folder Listing)

import { useState } from 'react';
import { Edit2, Trash2, ChevronRight, FolderOpen } from 'lucide-react';
import { LEVEL_THEMES } from './reading-tab-types';
import type { LevelViewProps } from './reading-tab-types';
import { EmptyState } from '../../ui/empty-state';

export function ReadingLevelView({
  level,
  folders,
  onSelectFolder,
  onEditFolder,
  onDeleteFolder,
  canModify,
  getPassageCountByFolder,
}: LevelViewProps) {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const currentTheme = LEVEL_THEMES[level];

  const handleUpdateFolder = (id: string) => {
    if (!editingFolderName.trim()) return;
    onEditFolder(id, editingFolderName.trim());
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  return (
    <div className="rt-content">
      <div className="rt-folders-list">
        {folders.map((folder, idx) => (
          <div
            key={folder.id}
            className="rt-folder-card"
            style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': currentTheme?.gradient } as React.CSSProperties}
          >
            {editingFolderId === folder.id ? (
              <div className="rt-folder-edit">
                <input
                  type="text"
                  className="rt-input"
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
              </div>
            ) : (
              <>
                <div className="rt-folder-main" onClick={() => onSelectFolder(folder.id, folder.name)}>
                  <div className="rt-folder-icon-wrap">
                    <FolderOpen size={22} />
                  </div>
                  <div className="rt-folder-info">
                    <h4>{folder.name}</h4>
                    <span>{getPassageCountByFolder(folder.id)} bài đọc</span>
                  </div>
                  <ChevronRight size={18} className="rt-folder-arrow" />
                </div>
                {canModify(folder.createdBy) && (
                  <div className="rt-folder-actions">
                    <button className="rt-action-btn" onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="rt-action-btn rt-action-danger" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id, folder.name); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {folders.length === 0 && (
          <EmptyState icon={<FolderOpen size={48} />} title="Chưa có thư mục" description='Nhấn "Tạo thư mục" để bắt đầu' />
        )}
      </div>
    </div>
  );
}
