import { ArrowLeft, ChevronRight, FolderOpen } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ReadingFolder } from '../../../types/reading';

interface FolderListViewProps {
  selectedLevel: JLPTLevel;
  levelFolders: ReadingFolder[];
  theme: { gradient: string; glow: string };
  getPassageCount: (folderId: string) => number;
  onSelectFolder: (folder: ReadingFolder) => void;
  onGoBack: () => void;
}

export function FolderListView({
  selectedLevel,
  levelFolders,
  theme,
  getPassageCount,
  onSelectFolder,
  onGoBack,
}: FolderListViewProps) {
  return (
    <div className="folder-view">
      <div className="folder-view-header">
        <button className="btn-back" onClick={onGoBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="folder-view-title">
          <span className="level-badge" style={{ background: theme.gradient }}>
            {selectedLevel}
          </span>
          <div className="title-text">
            <h1>Chọn bài học</h1>
            <p>{levelFolders.length} bài • Luyện đọc hiểu</p>
          </div>
        </div>
      </div>

      {levelFolders.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={48} />
          <h3>Chưa có thư mục nào</h3>
          <p>Vui lòng thêm thư mục ở tab Quản Lí</p>
        </div>
      ) : (
        <div className="lesson-grid">
          {levelFolders.map((folder, idx) => {
            const pCount = getPassageCount(folder.id);
            const lessonNum = folder.name.replace(/\D/g, '') || String(idx + 1);
            const hasContent = pCount > 0;
            return (
              <button
                key={folder.id}
                className={`lesson-card ${hasContent ? 'has-content' : ''}`}
                onClick={() => onSelectFolder(folder)}
                style={{
                  '--card-delay': `${idx * 0.03}s`,
                  '--level-gradient': theme.gradient,
                  '--level-glow': theme.glow,
                } as React.CSSProperties}
              >
                <div className="lesson-number">{lessonNum}</div>
                <div className="lesson-content">
                  <span className="lesson-label">Bài</span>
                  <span className="lesson-name">{folder.name}</span>
                </div>
                <div className="lesson-meta">
                  <span className={`lesson-count ${hasContent ? 'active' : ''}`}>
                    {pCount > 0 ? `${pCount} bài đọc` : 'Trống'}
                  </span>
                  <ChevronRight size={18} className="lesson-arrow" />
                </div>
                {hasContent && <div className="lesson-indicator" />}
                <div className="lesson-shine" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
