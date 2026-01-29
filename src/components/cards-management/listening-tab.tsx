// Listening Tab - Manage listening practice content and audio files

import { useState, useRef } from 'react';
import {
  Trash2, Edit2, Save, X, ChevronRight, ChevronLeft,
  Upload, Music, FolderPlus, Folder, Play, Pause
} from 'lucide-react';
import type { JLPTLevel } from '../../types/flashcard';
import type { CurrentUser } from '../../types/user';
import type { ListeningAudio, ListeningFolder } from '../../types/listening';

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

type NavState =
  | { type: 'root' }
  | { type: 'level'; level: JLPTLevel }
  | { type: 'folder'; level: JLPTLevel; folderId: string; folderName: string };

interface ListeningTabProps {
  audios: ListeningAudio[];
  folders: ListeningFolder[];
  onAddAudio: (data: Omit<ListeningAudio, 'id' | 'createdAt' | 'createdBy'>, file: File) => Promise<void>;
  onUpdateAudio: (id: string, data: Partial<ListeningAudio>) => Promise<void>;
  onDeleteAudio: (id: string) => Promise<void>;
  onAddFolder: (name: string, level: JLPTLevel) => Promise<void>;
  onUpdateFolder: (id: string, data: Partial<ListeningFolder>) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  getFoldersByLevel: (level: JLPTLevel) => ListeningFolder[];
  getAudiosByFolder: (folderId: string) => ListeningAudio[];
  currentUser: CurrentUser;
  isSuperAdmin: boolean;
}

export function ListeningTab({
  audios,
  folders: _folders,
  onAddAudio,
  onUpdateAudio: _onUpdateAudio,
  onDeleteAudio,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  getFoldersByLevel,
  getAudiosByFolder,
  currentUser: _currentUser,
}: ListeningTabProps) {
  const [navState, setNavState] = useState<NavState>({ type: 'root' });
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddAudio, setShowAddAudio] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<{ id: string; name: string } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Audio form state
  const [audioTitle, setAudioTitle] = useState('');
  const [audioDescription, setAudioDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get count by level
  const getCountByLevel = (level: JLPTLevel) => {
    return audios.filter(a => a.jlptLevel === level).length;
  };

  // Navigation handlers
  const goToLevel = (level: JLPTLevel) => {
    setNavState({ type: 'level', level });
  };

  const goToFolder = (folderId: string, folderName: string) => {
    if (navState.type !== 'level') return;
    setNavState({ type: 'folder', level: navState.level, folderId, folderName });
  };

  const goBack = () => {
    if (navState.type === 'folder') {
      setNavState({ type: 'level', level: navState.level });
    } else if (navState.type === 'level') {
      setNavState({ type: 'root' });
    }
  };

  // Folder handlers
  const handleAddFolder = async () => {
    if (!newFolderName.trim() || navState.type !== 'level') return;
    await onAddFolder(newFolderName.trim(), navState.level);
    setNewFolderName('');
    setShowAddFolder(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editingFolder.name.trim()) return;
    await onUpdateFolder(editingFolder.id, { name: editingFolder.name.trim() });
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Xóa thư mục này và tất cả nội dung bên trong?')) return;
    await onDeleteFolder(id);
  };

  // Audio handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!audioTitle) {
        setAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleAddAudio = async () => {
    if (!audioTitle.trim() || !selectedFile || navState.type !== 'folder') return;

    await onAddAudio({
      title: audioTitle.trim(),
      description: audioDescription.trim(),
      jlptLevel: navState.level,
      folderId: navState.folderId,
      audioUrl: '', // Will be set by upload handler
      duration: 0,
    }, selectedFile);

    // Reset form
    setAudioTitle('');
    setAudioDescription('');
    setSelectedFile(null);
    setShowAddAudio(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Xóa file nghe này?')) return;
    await onDeleteAudio(id);
  };

  const togglePlayAudio = (audioId: string, audioUrl: string) => {
    if (playingAudioId === audioId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      setPlayingAudioId(audioId);
    }
  };

  // Root view - Level selection
  if (navState.type === 'root') {
    return (
      <div className="listening-tab">
        <div className="tab-header">
          <h3>Quản lí Nghe Hiểu</h3>
          <p className="tab-subtitle">Chọn cấp độ để quản lí nội dung luyện nghe</p>
        </div>

        <div className="level-grid">
          {JLPT_LEVELS.map(level => (
            <button key={level} className="level-card" onClick={() => goToLevel(level)}>
              <span className="level-name">{level}</span>
              <span className="level-count">{getCountByLevel(level)} file</span>
              <ChevronRight size={18} className="level-arrow" />
            </button>
          ))}
        </div>

        <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

        <style>{`
          .listening-tab {
            padding: 1.5rem;
          }

          .tab-header {
            margin-bottom: 1.5rem;
          }

          .tab-header h3 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--dark);
            margin: 0 0 0.25rem;
          }

          .tab-subtitle {
            font-size: 0.9rem;
            color: var(--gray);
            margin: 0;
          }

          .level-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
          }

          .level-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            padding: 1.5rem;
            background: white;
            border: 2px solid var(--border);
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
          }

          .level-card:hover {
            border-color: var(--primary);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .level-name {
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--primary);
          }

          .level-count {
            font-size: 0.85rem;
            color: var(--gray);
          }

          .level-arrow {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--gray-light);
            transition: color 0.2s;
          }

          .level-card:hover .level-arrow {
            color: var(--primary);
          }
        `}</style>
      </div>
    );
  }

  // Level view - Folder list
  if (navState.type === 'level') {
    const levelFolders = getFoldersByLevel(navState.level);

    return (
      <div className="listening-tab">
        <div className="nav-header">
          <button className="back-btn" onClick={goBack}>
            <ChevronLeft size={18} /> Quay lại
          </button>
          <h3>{navState.level} - Thư mục</h3>
          <button className="add-btn" onClick={() => setShowAddFolder(true)}>
            <FolderPlus size={18} /> Thêm thư mục
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
            <button className="btn-save" onClick={handleAddFolder}><Save size={16} /></button>
            <button className="btn-cancel" onClick={() => { setShowAddFolder(false); setNewFolderName(''); }}><X size={16} /></button>
          </div>
        )}

        <div className="folder-list">
          {levelFolders.length === 0 ? (
            <div className="empty-state">
              <Folder size={48} strokeWidth={1} />
              <p>Chưa có thư mục nào</p>
            </div>
          ) : (
            levelFolders.map(folder => (
              <div key={folder.id} className="folder-item">
                {editingFolder?.id === folder.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editingFolder.name}
                      onChange={e => setEditingFolder({ ...editingFolder, name: e.target.value })}
                      autoFocus
                    />
                    <button className="btn-save" onClick={handleUpdateFolder}><Save size={16} /></button>
                    <button className="btn-cancel" onClick={() => setEditingFolder(null)}><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <button className="folder-btn" onClick={() => goToFolder(folder.id, folder.name)}>
                      <Folder size={20} />
                      <span className="folder-name">{folder.name}</span>
                      <span className="folder-count">{getAudiosByFolder(folder.id).length}</span>
                      <ChevronRight size={18} />
                    </button>
                    <div className="folder-actions">
                      <button onClick={() => setEditingFolder({ id: folder.id, name: folder.name })}><Edit2 size={16} /></button>
                      <button onClick={() => handleDeleteFolder(folder.id)}><Trash2 size={16} /></button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

        <style>{`
          .listening-tab {
            padding: 1.5rem;
          }

          .nav-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .nav-header h3 {
            flex: 1;
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0;
          }

          .back-btn, .add-btn {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.5rem 1rem;
            background: white;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .back-btn:hover, .add-btn:hover {
            background: var(--gray-light);
          }

          .add-btn {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
          }

          .add-btn:hover {
            background: var(--primary-dark);
          }

          .add-form, .edit-form {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: var(--light);
            border-radius: 8px;
          }

          .add-form input, .edit-form input {
            flex: 1;
            padding: 0.5rem 1rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 0.9rem;
          }

          .btn-save, .btn-cancel {
            padding: 0.5rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-save {
            background: var(--success);
            color: white;
          }

          .btn-cancel {
            background: var(--gray-light);
          }

          .folder-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .folder-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: white;
            border: 1px solid var(--border);
            border-radius: 10px;
            overflow: hidden;
          }

          .folder-btn {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem;
            background: none;
            border: none;
            cursor: pointer;
            text-align: left;
            transition: background 0.2s;
          }

          .folder-btn:hover {
            background: var(--light);
          }

          .folder-name {
            flex: 1;
            font-weight: 600;
          }

          .folder-count {
            font-size: 0.8rem;
            color: var(--gray);
            background: var(--light);
            padding: 0.2rem 0.6rem;
            border-radius: 10px;
          }

          .folder-actions {
            display: flex;
            gap: 0.25rem;
            padding-right: 0.5rem;
          }

          .folder-actions button {
            padding: 0.5rem;
            background: none;
            border: none;
            cursor: pointer;
            color: var(--gray);
            border-radius: 6px;
            transition: all 0.2s;
          }

          .folder-actions button:hover {
            background: var(--light);
            color: var(--dark);
          }

          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 3rem;
            color: var(--gray);
          }
        `}</style>
      </div>
    );
  }

  // Folder view - Audio list
  const folderAudios = getAudiosByFolder(navState.folderId);

  return (
    <div className="listening-tab">
      <div className="nav-header">
        <button className="back-btn" onClick={goBack}>
          <ChevronLeft size={18} /> {navState.level}
        </button>
        <h3>{navState.folderName}</h3>
        <button className="add-btn" onClick={() => setShowAddAudio(true)}>
          <Upload size={18} /> Tải file nghe
        </button>
      </div>

      {showAddAudio && (
        <div className="upload-form">
          <div className="form-row">
            <label>File nghe:</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
            />
          </div>
          {selectedFile && (
            <>
              <div className="form-row">
                <label>Tiêu đề:</label>
                <input
                  type="text"
                  placeholder="Nhập tiêu đề..."
                  value={audioTitle}
                  onChange={e => setAudioTitle(e.target.value)}
                />
              </div>
              <div className="form-row">
                <label>Mô tả:</label>
                <textarea
                  placeholder="Mô tả (tuỳ chọn)..."
                  value={audioDescription}
                  onChange={e => setAudioDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => {
                  setShowAddAudio(false);
                  setSelectedFile(null);
                  setAudioTitle('');
                  setAudioDescription('');
                }}><X size={16} /> Huỷ</button>
                <button className="btn-save" onClick={handleAddAudio}>
                  <Upload size={16} /> Tải lên
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="audio-list">
        {folderAudios.length === 0 ? (
          <div className="empty-state">
            <Music size={48} strokeWidth={1} />
            <p>Chưa có file nghe nào</p>
          </div>
        ) : (
          folderAudios.map(audio => (
            <div key={audio.id} className="audio-item">
              <button
                className={`play-btn ${playingAudioId === audio.id ? 'playing' : ''}`}
                onClick={() => togglePlayAudio(audio.id, audio.audioUrl)}
              >
                {playingAudioId === audio.id ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="audio-info">
                <span className="audio-title">{audio.title}</span>
                {audio.description && <span className="audio-desc">{audio.description}</span>}
              </div>
              <div className="audio-actions">
                <button onClick={() => handleDeleteAudio(audio.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

      <style>{`
        .listening-tab {
          padding: 1.5rem;
        }

        .nav-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .nav-header h3 {
          flex: 1;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }

        .back-btn, .add-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .back-btn:hover, .add-btn:hover {
          background: var(--gray-light);
        }

        .add-btn {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .add-btn:hover {
          background: var(--primary-dark);
        }

        .upload-form {
          margin-bottom: 1.5rem;
          padding: 1.25rem;
          background: var(--light);
          border-radius: 12px;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-bottom: 1rem;
        }

        .form-row label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--dark);
        }

        .form-row input, .form-row textarea {
          padding: 0.65rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .form-actions .btn-save, .form-actions .btn-cancel {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .audio-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .audio-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        .play-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--light);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-btn:hover {
          background: var(--primary);
          color: white;
        }

        .play-btn.playing {
          background: var(--primary);
          color: white;
        }

        .audio-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .audio-title {
          font-weight: 600;
          color: var(--dark);
        }

        .audio-desc {
          font-size: 0.8rem;
          color: var(--gray);
        }

        .audio-actions button {
          padding: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .audio-actions button:hover {
          background: var(--danger-light);
          color: var(--danger);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
          color: var(--gray);
        }
      `}</style>
    </div>
  );
}
