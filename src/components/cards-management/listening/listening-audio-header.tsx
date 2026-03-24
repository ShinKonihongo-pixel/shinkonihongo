// Navigation header for ListeningAudioView
import React from 'react';
import { ChevronLeft, Upload, Type } from 'lucide-react';
import { LEVEL_THEMES } from '../../../constants/themes';
import { LESSON_TYPES, LESSON_TYPE_THEMES } from './listening-tab-types';
import type { JLPTLevel } from '../../../types/flashcard';
import type { ListeningLessonType } from '../../../types/listening';

interface ListeningAudioHeaderProps {
  level: JLPTLevel;
  lessonNumber: number;
  lessonType: ListeningLessonType;
  audioCount: number;
  onBack: () => void;
  onShowUpload: () => void;
  onShowTts: () => void;
}

export function ListeningAudioHeader({
  level,
  lessonNumber,
  lessonType,
  audioCount,
  onBack,
  onShowUpload,
  onShowTts,
}: ListeningAudioHeaderProps) {
  const theme = LEVEL_THEMES[level];
  const typeTheme = LESSON_TYPE_THEMES[lessonType];
  const typeLabel = LESSON_TYPES.find(t => t.value === lessonType)?.label || '';

  return (
    <div className="nav-header">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={18} /> Bài {lessonNumber}
      </button>
      <span className="current-level" style={{ background: theme.gradient }}>
        {level}
      </span>
      <span className="current-type" style={{ background: typeTheme.gradient }}>
        {typeLabel}
      </span>
      <h3>{audioCount} file</h3>
      <button className="add-btn" onClick={onShowUpload}>
        <Upload size={18} /> Tải file
      </button>
      <button
        className="add-btn"
        onClick={onShowTts}
        style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
      >
        <Type size={18} /> Tạo từ text
      </button>
    </div>
  );
}
