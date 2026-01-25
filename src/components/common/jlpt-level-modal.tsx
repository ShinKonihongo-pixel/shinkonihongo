// JLPT Level Selection Modal - First login prompt
// Shows when user hasn't selected their study level

import { useState } from 'react';
import { GraduationCap, ChevronRight, Sparkles } from 'lucide-react';
import type { UserJLPTLevel } from '../../types/user';
import { USER_JLPT_LEVELS, USER_JLPT_LEVEL_LABELS } from '../../types/user';

interface JLPTLevelModalProps {
  onSelect: (level: UserJLPTLevel) => void;
  onSkip?: () => void;
}

const LEVEL_DESCRIPTIONS: Record<UserJLPTLevel, string> = {
  N5: 'Mới bắt đầu học tiếng Nhật, học Hiragana/Katakana',
  N4: 'Đã biết cơ bản, học khoảng 300 Kanji',
  N3: 'Trình độ trung cấp, giao tiếp cơ bản',
  N2: 'Đọc hiểu báo chí, làm việc tại Nhật',
  N1: 'Trình độ cao, đọc hiểu văn bản phức tạp',
};

const LEVEL_COLORS: Record<UserJLPTLevel, string> = {
  N5: '#10b981', // green
  N4: '#3b82f6', // blue
  N3: '#f59e0b', // amber
  N2: '#f97316', // orange
  N1: '#ef4444', // red
};

export function JLPTLevelModal({ onSelect, onSkip }: JLPTLevelModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<UserJLPTLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedLevel) return;
    setIsSubmitting(true);
    await onSelect(selectedLevel);
    setIsSubmitting(false);
  };

  return (
    <div className="jlpt-level-modal-overlay">
      <div className="jlpt-level-modal">
        <div className="jlpt-level-modal-header">
          <div className="jlpt-level-modal-icon">
            <GraduationCap size={32} />
          </div>
          <h2>Chào mừng bạn!</h2>
          <p>Hãy cho chúng tôi biết trình độ tiếng Nhật của bạn để đề xuất bài học phù hợp</p>
        </div>

        <div className="jlpt-level-options">
          {USER_JLPT_LEVELS.map((level) => (
            <button
              key={level}
              className={`jlpt-level-option ${selectedLevel === level ? 'selected' : ''}`}
              onClick={() => setSelectedLevel(level)}
              style={{
                '--level-color': LEVEL_COLORS[level],
              } as React.CSSProperties}
            >
              <div className="jlpt-level-option-header">
                <span className="jlpt-level-badge" style={{ background: LEVEL_COLORS[level] }}>
                  {level}
                </span>
                <span className="jlpt-level-label">{USER_JLPT_LEVEL_LABELS[level].split(' - ')[1]}</span>
                {selectedLevel === level && <Sparkles size={16} className="selected-icon" />}
              </div>
              <p className="jlpt-level-description">{LEVEL_DESCRIPTIONS[level]}</p>
            </button>
          ))}
        </div>

        <div className="jlpt-level-modal-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={!selectedLevel || isSubmitting}
          >
            {isSubmitting ? 'Đang lưu...' : 'Xác nhận'}
            {!isSubmitting && <ChevronRight size={18} />}
          </button>
          {onSkip && (
            <button className="btn btn-link" onClick={onSkip}>
              Bỏ qua lần này
            </button>
          )}
        </div>

        <p className="jlpt-level-note">
          Bạn có thể thay đổi cấp độ bất cứ lúc nào trong phần Cá nhân
        </p>
      </div>
    </div>
  );
}
