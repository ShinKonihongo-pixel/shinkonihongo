import { ArrowLeft, BookOpen, FolderOpen } from 'lucide-react';
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
    <div className="rv-folder">
      {/* Header */}
      <header className="rv-folder-header" style={{
        '--rv-gradient': theme.gradient,
        '--rv-glow': theme.glow,
      } as React.CSSProperties}>
        <div className="rv-folder-header-inner">
          <button className="rv-back" onClick={onGoBack}>
            <ArrowLeft size={18} />
          </button>
          <div className="rv-badge" style={{ background: theme.gradient }}>
            {selectedLevel}
          </div>
          <div className="rv-header-text">
            <h1>Chọn bài học</h1>
            <p>{levelFolders.length} bài • Luyện đọc hiểu</p>
          </div>
        </div>
        <div className="rv-folder-header-glow" />
      </header>

      {/* Grid */}
      {levelFolders.length === 0 ? (
        <div className="rv-empty">
          <FolderOpen size={48} />
          <h3>Chưa có thư mục nào</h3>
          <p>Vui lòng thêm thư mục ở tab Quản Lí</p>
        </div>
      ) : (
        <div className="rv-folder-grid">
          {levelFolders.map((folder, idx) => {
            const pCount = getPassageCount(folder.id);
            const lessonNum = folder.name.replace(/\D/g, '') || String(idx + 1);
            const hasContent = pCount > 0;
            return (
              <button
                key={folder.id}
                className={`rv-folder-card ${hasContent ? 'has-content' : ''}`}
                onClick={() => onSelectFolder(folder)}
                style={{
                  '--card-delay': `${idx * 0.03}s`,
                  '--rv-gradient': theme.gradient,
                  '--rv-glow': theme.glow,
                } as React.CSSProperties}
              >
                {/* Left accent bar */}
                {hasContent && <div className="rv-card-accent" />}

                {/* Big number */}
                <div className="rv-card-num">{lessonNum}</div>

                {/* Info */}
                <div className="rv-card-info">
                  <span className="rv-card-name">{folder.name}</span>
                  <span className={`rv-card-count ${hasContent ? 'active' : ''}`}>
                    {hasContent ? (
                      <><BookOpen size={12} /> {pCount} bài đọc</>
                    ) : 'Trống'}
                  </span>
                </div>

                {/* Hover shine */}
                <div className="rv-card-shine" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
