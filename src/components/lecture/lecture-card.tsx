// Lecture card component for displaying lecture in list

import type { Lecture } from '../../types/lecture';

interface LectureCardProps {
  lecture: Lecture;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  showActions?: boolean;
  canHide?: boolean; // Only show hide button for creator/super_admin
}

export function LectureCard({
  lecture,
  onClick,
  onEdit,
  onDelete,
  onHide,
  showActions = false,
  canHide = false,
}: LectureCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="lecture-card" onClick={onClick}>
      <div className="lecture-card-cover">
        {lecture.coverImage ? (
          <img src={lecture.coverImage} alt={lecture.title} loading="lazy" />
        ) : (
          <div className="lecture-card-placeholder">
            <span>📚</span>
          </div>
        )}
        <span className="lecture-level-badge">{lecture.jlptLevel}</span>
        {!lecture.isPublished && (
          <span className="lecture-draft-badge">Nháp</span>
        )}
        {lecture.isHidden && (
          <span className="lecture-hidden-badge">Đã ẩn</span>
        )}
      </div>
      <div className="lecture-card-content">
        <h3 className="lecture-card-title">{lecture.title}</h3>
        {lecture.description && (
          <p className="lecture-card-description">{lecture.description}</p>
        )}
        <div className="lecture-card-meta">
          <span className="lecture-author">{lecture.authorName}</span>
          <span className="lecture-stats">
            {lecture.slideCount} slides | {lecture.viewCount} views
          </span>
        </div>
        <div className="lecture-card-date">
          {formatDate(lecture.createdAt)}
        </div>
      </div>
      {showActions && (
        <div className="lecture-card-actions" onClick={(e) => e.stopPropagation()}>
          {canHide && onHide && (
            <button className="btn btn-hide" onClick={onHide} title={lecture.isHidden ? 'Hiện' : 'Ẩn'}>
              {lecture.isHidden ? '👁️‍🗨️' : '👁️'}
            </button>
          )}
          <button className="btn btn-edit" onClick={onEdit}>
            Sửa
          </button>
          <button className="btn btn-delete" onClick={onDelete}>
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}
