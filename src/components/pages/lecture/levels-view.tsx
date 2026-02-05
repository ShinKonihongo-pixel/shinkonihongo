// Levels view - Select JLPT Level

import type { JLPTLevel } from '../../../types/flashcard';
import type { Lecture, LectureFolder } from '../../../types/lecture';
import { LEVEL_CONFIG } from './constants';

interface LevelsViewProps {
  isAdmin: boolean;
  onNavigateToEditor?: (lectureId?: string) => void;
  onSelectLevel: (level: JLPTLevel) => void;
  visibleLectures: Lecture[];
  lectureFolders: LectureFolder[];
}

export function LevelsView({
  isAdmin,
  onNavigateToEditor,
  onSelectLevel,
  visibleLectures,
  lectureFolders,
}: LevelsViewProps) {
  const getFolderCountByLevel = (level: JLPTLevel) => {
    return lectureFolders.filter(f => f.jlptLevel === level).length;
  };

  const getLectureCountByLevel = (level: JLPTLevel) => {
    return visibleLectures.filter(l => l.jlptLevel === level).length;
  };

  return (
    <div className="lecture-page">
      <div className="lecture-header">
        <h1>Bài giảng</h1>
        {isAdmin && onNavigateToEditor && (
          <button className="btn btn-primary" onClick={() => onNavigateToEditor()}>
            + Tạo bài giảng
          </button>
        )}
      </div>

      <div className="lecture-nav-breadcrumb">
        <span className="breadcrumb-current">Chọn cấp độ</span>
      </div>

      <div className="lecture-levels-grid">
        {LEVEL_CONFIG.levels.map((level) => {
          const folderCount = getFolderCountByLevel(level);
          const lectureCount = getLectureCountByLevel(level);

          return (
            <div
              key={level}
              className="lecture-level-card"
              style={{ borderColor: LEVEL_CONFIG.colors[level] }}
              onClick={() => onSelectLevel(level)}
            >
              <div className="level-card-header" style={{ backgroundColor: LEVEL_CONFIG.colors[level] }}>
                <h2>{level}</h2>
              </div>
              <div className="level-card-body">
                <p className="level-description">{LEVEL_CONFIG.descriptions[level]}</p>
                <div className="level-stats">
                  <span>{folderCount} bài học</span>
                  <span>{lectureCount} bài giảng</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
