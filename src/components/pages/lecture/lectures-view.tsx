// Lectures view - Select Lecture in Folder

import { BookOpen, Plus, Search } from 'lucide-react';
import { LectureCard } from '../../lecture/lecture-card';
import type { JLPTLevel } from '../../../types/flashcard';
import type { Lecture, LectureFolder } from '../../../types/lecture';
import { LEVEL_CONFIG } from './constants';

interface LecturesViewProps {
  isAdmin: boolean;
  selectedLevel: JLPTLevel;
  selectedFolder: LectureFolder;
  filteredLectures: Lecture[];
  searchQuery: string;
  onNavigateToEditor?: (lectureId?: string) => void;
  onBackToLevels: () => void;
  onBackToFolders: () => void;
  onSelectLecture: (lecture: Lecture) => void;
  onSearchChange: (query: string) => void;
}

export function LecturesView({
  isAdmin,
  selectedLevel,
  selectedFolder,
  filteredLectures,
  searchQuery,
  onNavigateToEditor,
  onBackToLevels,
  onBackToFolders,
  onSelectLecture,
  onSearchChange,
}: LecturesViewProps) {
  return (
    <div className="lecture-page">
      <div className="lecture-header">
        <h1>{selectedFolder.name}</h1>
        {isAdmin && onNavigateToEditor && (
          <button className="btn btn-primary" onClick={() => onNavigateToEditor()}>
            + Tạo bài giảng
          </button>
        )}
      </div>

      <div className="lecture-nav-breadcrumb">
        <button className="breadcrumb-link" onClick={onBackToLevels}>
          Cấp độ
        </button>
        <span className="breadcrumb-separator">›</span>
        <button
          className="breadcrumb-link"
          style={{ color: LEVEL_CONFIG.colors[selectedLevel] }}
          onClick={onBackToFolders}
        >
          {selectedLevel}
        </button>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{selectedFolder.name}</span>
      </div>

      <div className="lecture-filters">
        <input
          type="text"
          placeholder="Tìm kiếm bài giảng..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredLectures.length === 0 ? (
        <div className="empty-state">
          {searchQuery ? <Search size={48} strokeWidth={1.2} /> : <BookOpen size={48} strokeWidth={1.2} />}
          <h3>{searchQuery ? 'Không tìm thấy bài giảng' : 'Chưa có bài giảng nào'}</h3>
          <p>{searchQuery ? `Không có bài giảng nào khớp với "${searchQuery}"` : 'Bài giảng sẽ xuất hiện ở đây sau khi được tạo'}</p>
          {isAdmin && !searchQuery && onNavigateToEditor && (
            <button className="btn btn-primary" onClick={() => onNavigateToEditor()} style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Tạo bài giảng
            </button>
          )}
        </div>
      ) : (
        <div className="lecture-grid">
          {filteredLectures.map((lecture) => (
            <LectureCard
              key={lecture.id}
              lecture={lecture}
              onClick={() => onSelectLecture(lecture)}
              showActions={isAdmin}
              onEdit={isAdmin && onNavigateToEditor ? () => onNavigateToEditor(lecture.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
