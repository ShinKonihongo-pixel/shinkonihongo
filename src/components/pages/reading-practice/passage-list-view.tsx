import { ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ReadingPassage, ReadingFolder } from '../../../types/reading';

interface PassageListViewProps {
  selectedLevel: JLPTLevel;
  selectedFolder: ReadingFolder;
  folderPassages: ReadingPassage[];
  theme: { gradient: string; glow: string };
  onStartPractice: (passage: ReadingPassage) => void;
  onGoBack: () => void;
}

export function PassageListView({
  selectedLevel,
  selectedFolder,
  folderPassages,
  theme,
  onStartPractice,
  onGoBack,
}: PassageListViewProps) {
  return (
    <div className="passage-list-view">
      <div className="passage-list-header">
        <button className="btn-back" onClick={onGoBack}>
          <ArrowLeft size={20} />
        </button>
        <div className="passage-list-title">
          <div className="title-row">
            <h1>{selectedFolder.name}</h1>
            <span className="passage-count-inline">{folderPassages.length} bài đọc</span>
          </div>
        </div>
        <span className="level-tag-right" style={{ background: theme.gradient }}>{selectedLevel}</span>
      </div>

      {folderPassages.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <h3>Chưa có bài đọc nào</h3>
          <p>Vui lòng thêm bài đọc ở tab Quản Lí</p>
        </div>
      ) : (
        <div className="passage-grid-premium">
          {folderPassages.map((passage, idx) => (
            <button
              key={passage.id}
              className="passage-card-compact"
              onClick={() => onStartPractice(passage)}
              style={{ '--card-delay': `${idx * 0.05}s`, '--level-gradient': theme.gradient, '--level-glow': theme.glow } as React.CSSProperties}
            >
              <div className="card-main">
                <span className="card-kanji-big">読解</span>
                <h3 className="card-title-upper">{passage.title.toUpperCase()}</h3>
              </div>
              <div className="card-meta">
                <span className="meta-item">{passage.questions.length}問</span>
                <span className="meta-dot">•</span>
                <span className="meta-item">{Math.ceil(passage.content.length / 400)}分</span>
                <ChevronRight size={16} className="meta-arrow" />
              </div>
              <div className="card-shine" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
