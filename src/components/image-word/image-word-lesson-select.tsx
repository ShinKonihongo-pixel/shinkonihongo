// Image-Word Lesson Select Component
// Displays grid of available lessons for selection

import React from 'react';
import { Image, Layers, ArrowLeft, Settings } from 'lucide-react';
import type { ImageWordLesson } from '../../types/image-word';

interface ImageWordLessonSelectProps {
  lessons: ImageWordLesson[];
  onSelectLesson: (lesson: ImageWordLesson) => void;
  onBack: () => void;
  onManage: () => void;
}

export const ImageWordLessonSelect: React.FC<ImageWordLessonSelectProps> = ({
  lessons,
  onSelectLesson,
  onBack,
  onManage,
}) => {
  return (
    <div className="image-word-lesson-select">
      <div className="lesson-select-header">
        <button className="btn-back" onClick={onBack}>
          <ArrowLeft size={20} />
          Quay Lại
        </button>
        <h2>
          <Layers size={24} />
          Chọn Bài Học
        </h2>
        <button className="btn-manage" onClick={onManage}>
          <Settings size={18} />
          Quản Lý
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="empty-lessons">
          <Image size={64} strokeWidth={1} />
          <h3>Chưa có bài học</h3>
          <p>Tạo bài học đầu tiên trong phần Quản Lý</p>
          <button className="btn-primary" onClick={onManage}>
            <Settings size={18} />
            Tạo Bài Học Mới
          </button>
        </div>
      ) : (
        <div className="lessons-grid">
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              className="lesson-card"
              onClick={() => onSelectLesson(lesson)}
            >
              <div className="lesson-thumbnail">
                {lesson.pairs[0]?.imageUrl ? (
                  <img src={lesson.pairs[0].imageUrl} alt="" />
                ) : (
                  <Image size={40} />
                )}
                <span className="pair-count">{lesson.pairs.length} cặp</span>
              </div>
              <div className="lesson-info">
                <h3>{lesson.name}</h3>
                {lesson.description && <p>{lesson.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
