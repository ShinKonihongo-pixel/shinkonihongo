// Folder management section for ListeningAudioView
import React from 'react';
import { FolderPlus, Edit2, Save, X, Trash2 } from 'lucide-react';
import type { ListeningFolder } from '../../../types/listening';

interface ListeningFolderListProps {
  typeFolders: ListeningFolder[];
  getAudiosByFolder: (folderId: string) => { length: number };
  showAddFolder: boolean;
  setShowAddFolder: (show: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  editingFolder: { id: string; name: string } | null;
  setEditingFolder: (folder: { id: string; name: string } | null) => void;
  onAddFolder: () => void;
  onUpdateFolder: () => void;
  onDeleteFolder: (id: string) => void;
}

export function ListeningFolderList({
  typeFolders,
  getAudiosByFolder,
  showAddFolder,
  setShowAddFolder,
  newFolderName,
  setNewFolderName,
  editingFolder,
  setEditingFolder,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
}: ListeningFolderListProps) {
  return (
    <>
      <div className="section-title">
        <h4>Thư mục</h4>
        <button
          className="add-btn"
          onClick={() => setShowAddFolder(true)}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
        >
          <FolderPlus size={14} /> Thêm
        </button>
      </div>

      {showAddFolder && (
        <div className="add-form">
          <input
            type="text"
            placeholder="Tên thư mục mới..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            autoFocus
          />
          <button className="btn-save" onClick={onAddFolder}><Save size={16} /></button>
          <button className="btn-cancel" onClick={() => { setShowAddFolder(false); setNewFolderName(''); }}>
            <X size={16} />
          </button>
        </div>
      )}

      {typeFolders.length > 0 && (
        <div className="folder-list">
          {typeFolders.map((folder, idx) => (
            <div
              key={folder.id}
              className="folder-item"
              style={{ '--item-delay': `${idx * 0.05}s` } as React.CSSProperties}
            >
              {editingFolder?.id === folder.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editingFolder.name}
                    onChange={e => setEditingFolder({ ...editingFolder, name: e.target.value })}
                    autoFocus
                  />
                  <button className="btn-save" onClick={onUpdateFolder}><Save size={16} /></button>
                  <button className="btn-cancel" onClick={() => setEditingFolder(null)}><X size={16} /></button>
                </div>
              ) : (
                <>
                  <div className="folder-btn">
                    <span className="folder-name">{folder.name}</span>
                    <span className="folder-count">{getAudiosByFolder(folder.id).length}</span>
                  </div>
                  <div className="folder-actions">
                    <button onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}>
                      <Edit2 size={16} />
                    </button>
                    <button className="delete-btn" onClick={() => onDeleteFolder(folder.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
