// Folders view - Select Lesson/Folder

import type { JLPTLevel } from '../../../types/flashcard';
import type { LectureFolder } from '../../../types/lecture';
import { LEVEL_CONFIG } from './constants';

interface FoldersViewProps {
  isAdmin: boolean;
  selectedLevel: JLPTLevel;
  currentFolders: LectureFolder[];
  onNavigateToEditor?: (lectureId?: string) => void;
  onBack: () => void;
  onSelectFolder: (folder: LectureFolder) => void;
  getLecturesByFolder: (folderId: string) => number;
}

export function FoldersView({
  isAdmin,
  selectedLevel,
  currentFolders,
  onNavigateToEditor,
  onBack,
  onSelectFolder,
  getLecturesByFolder,
}: FoldersViewProps) {
  return (
    <div className="lecture-page">
      <div className="lecture-header">
        <h1>Bài giảng - {selectedLevel}</h1>
        {isAdmin && onNavigateToEditor && (
          <button className="btn btn-primary" onClick={() => onNavigateToEditor()}>
            + Tạo bài giảng
          </button>
        )}
      </div>

      <div className="lecture-nav-breadcrumb">
        <button className="breadcrumb-link" onClick={onBack}>
          Cấp độ
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current" style={{ color: LEVEL_CONFIG.colors[selectedLevel] }}>
          {selectedLevel}
        </span>
      </div>

      {currentFolders.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có bài học nào cho cấp độ {selectedLevel}</p>
          {isAdmin && <p className="hint">Tạo bài học trong trang quản lý bài giảng</p>}
        </div>
      ) : (
        <div className="lecture-folders-grid">
          {currentFolders.map((folder, index) => {
            const lectureCount = getLecturesByFolder(folder.id);
            return (
              <div
                key={folder.id}
                className="lecture-folder-card"
                onClick={() => onSelectFolder(folder)}
              >
                <div className="folder-card-icon">📚</div>
                <div className="folder-card-content">
                  <h3>Bài {index + 1}: {folder.name}</h3>
                  <span className="folder-lecture-count">{lectureCount} bài giảng</span>
                </div>
                <div className="folder-card-arrow">›</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
