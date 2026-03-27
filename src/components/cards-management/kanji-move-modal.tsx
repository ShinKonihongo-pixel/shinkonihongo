// Modal to move kanji cards between lessons/levels
import { useState, useMemo } from 'react';
import { FolderOpen, FileText, ChevronRight, ArrowRightLeft } from 'lucide-react';
import type { JLPTLevel } from './cards-management-types';
import type { KanjiCard, KanjiLesson } from '../../types/kanji';
import { LEVEL_COLORS } from '../../constants/themes';
import { ModalShell } from '../ui/modal-shell';
import { LevelBadge } from '../ui/level-badge';
import './kanji-move-modal.css';

const LEVELS: JLPTLevel[] = ['BT', 'N5', 'N4', 'N3', 'N2', 'N1'];

interface KanjiMoveModalProps {
  cards: KanjiCard[];
  lessons: KanjiLesson[];
  getParentLessonsByLevel: (level: JLPTLevel) => KanjiLesson[];
  getChildLessons: (parentId: string) => KanjiLesson[];
  hasChildren: (lessonId: string) => boolean;
  onMove: (cardIds: string[], targetLevel: JLPTLevel, targetLessonId: string) => Promise<void>;
  onClose: () => void;
}

export function KanjiMoveModal({
  cards, lessons, getParentLessonsByLevel, getChildLessons, hasChildren,
  onMove, onClose,
}: KanjiMoveModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<JLPTLevel | null>(null);
  const [selectedParent, setSelectedParent] = useState<KanjiLesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<KanjiLesson | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Current location info
  const firstCard = cards[0];
  const currentLesson = lessons.find(l => l.id === firstCard?.lessonId);
  const currentLevelLabel = firstCard?.jlptLevel === 'BT' ? 'Bộ thủ' : firstCard?.jlptLevel;

  // Parent lessons for selected level
  const parentLessons = useMemo(() => {
    if (!selectedLevel) return [];
    return getParentLessonsByLevel(selectedLevel);
  }, [selectedLevel, getParentLessonsByLevel]);

  // Child lessons for selected parent
  const childLessons = useMemo(() => {
    if (!selectedParent) return [];
    return getChildLessons(selectedParent.id);
  }, [selectedParent, getChildLessons]);

  // Final target lesson ID (child if parent has children, else parent)
  const targetLessonId = selectedLesson?.id ?? (selectedParent && !hasChildren(selectedParent.id) ? selectedParent.id : null);
  const canMove = selectedLevel && targetLessonId && targetLessonId !== firstCard?.lessonId;

  const handleMove = async () => {
    if (!canMove || !selectedLevel || !targetLessonId) return;
    setIsMoving(true);
    try {
      await onMove(cards.map(c => c.id), selectedLevel, targetLessonId);
      onClose();
    } catch {
      alert('Lỗi khi chuyển kanji!');
    }
    setIsMoving(false);
  };

  const title = cards.length > 1
    ? `Chuyển ${cards.length} chữ Kanji`
    : `Chuyển "${firstCard?.character}"`;

  return (
    <ModalShell isOpen={true} onClose={onClose} title={title} maxWidth={480}>
      {/* Current location */}
      <div className="kanji-move-current">
        <span className="move-label">Vị trí hiện tại:</span>
        <LevelBadge level={firstCard?.jlptLevel ?? 'N5'} />
        <ChevronRight size={14} />
        <span className="move-location">{currentLesson?.name ?? 'Không rõ'}</span>
      </div>

      {/* Step 1: Select level */}
      <div className="move-step">
        <div className="move-step-label">1. Chọn level</div>
        <div className="move-level-grid">
          {LEVELS.map(level => (
            <button
              key={level}
              className={`move-level-btn ${selectedLevel === level ? 'active' : ''}`}
              style={{ '--level-color': LEVEL_COLORS[level] } as React.CSSProperties}
              onClick={() => { setSelectedLevel(level); setSelectedParent(null); setSelectedLesson(null); }}
            >
              {level === 'BT' ? 'Bộ thủ' : level}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select parent lesson */}
      {selectedLevel && parentLessons.length > 0 && (
        <div className="move-step">
          <div className="move-step-label">2. Chọn bài</div>
          <div className="move-lesson-list">
            {parentLessons.map(lesson => (
              <button
                key={lesson.id}
                className={`move-lesson-btn ${selectedParent?.id === lesson.id ? 'active' : ''}`}
                onClick={() => { setSelectedParent(lesson); setSelectedLesson(null); }}
              >
                <FolderOpen size={14} />
                <span>{lesson.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select child lesson (if parent has children) */}
      {selectedParent && childLessons.length > 0 && (
        <div className="move-step">
          <div className="move-step-label">3. Chọn thư mục</div>
          <div className="move-lesson-list">
            {childLessons.map(lesson => (
              <button
                key={lesson.id}
                className={`move-lesson-btn ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                onClick={() => setSelectedLesson(lesson)}
              >
                <FileText size={14} />
                <span>{lesson.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No lessons warning */}
      {selectedLevel && parentLessons.length === 0 && (
        <div className="move-empty">Chưa có bài học nào ở level này</div>
      )}

      {/* Actions */}
      <div className="kanji-move-actions">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Huỷ</button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleMove}
          disabled={!canMove || isMoving}
        >
          {isMoving ? 'Đang chuyển...' : `Chuyển ${cards.length > 1 ? `${cards.length} chữ` : ''}`}
        </button>
      </div>
    </ModalShell>
  );
}
