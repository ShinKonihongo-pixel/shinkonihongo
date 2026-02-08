// Modal to move kanji cards between lessons/levels
import { useState, useMemo } from 'react';
import { X, FolderOpen, FileText, ChevronRight, ArrowRightLeft } from 'lucide-react';
import type { JLPTLevel } from './cards-management-types';
import type { KanjiCard, KanjiLesson } from '../../types/kanji';

const LEVELS: JLPTLevel[] = ['BT', 'N5', 'N4', 'N3', 'N2', 'N1'];
const LEVEL_COLORS: Record<JLPTLevel, string> = {
  BT: '#8b5cf6', N5: '#22c55e', N4: '#3b82f6', N3: '#f59e0b', N2: '#a855f7', N1: '#ef4444',
};

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

  return (
    <div className="kanji-move-overlay" onClick={onClose}>
      <div className="kanji-move-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="kanji-move-header">
          <ArrowRightLeft size={20} />
          <h3>Chuyển {cards.length > 1 ? `${cards.length} chữ Kanji` : `"${firstCard?.character}"`}</h3>
          <button className="btn-close-move" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Current location */}
        <div className="kanji-move-current">
          <span className="move-label">Vị trí hiện tại:</span>
          <span className="move-badge" style={{ background: LEVEL_COLORS[firstCard?.jlptLevel ?? 'N5'] }}>
            {currentLevelLabel}
          </span>
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
      </div>

      <style>{moveModalStyles}</style>
    </div>
  );
}

const moveModalStyles = `
  .kanji-move-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
  }
  .kanji-move-modal {
    background: #1e1e2f; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
    width: 100%; max-width: 420px; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .kanji-move-header {
    display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.08); color: white;
  }
  .kanji-move-header h3 { margin: 0; font-size: 1rem; flex: 1; }
  .btn-close-move {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); border-radius: 8px; width: 32px; height: 32px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .btn-close-move:hover { background: rgba(255,255,255,0.1); color: white; }
  .kanji-move-current {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
    background: rgba(255,255,255,0.03); font-size: 0.85rem; color: rgba(255,255,255,0.6);
    flex-wrap: wrap;
  }
  .move-label { color: rgba(255,255,255,0.5); }
  .move-badge {
    padding: 0.15rem 0.5rem; border-radius: 4px; color: white;
    font-size: 0.75rem; font-weight: 600;
  }
  .move-location { color: rgba(255,255,255,0.8); font-weight: 500; }
  .move-step { padding: 0.75rem 1.25rem; }
  .move-step-label {
    font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; font-weight: 500;
  }
  .move-level-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem;
  }
  .move-level-btn {
    padding: 0.5rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);
    font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    text-align: center;
  }
  .move-level-btn:hover { background: rgba(255,255,255,0.08); color: white; }
  .move-level-btn.active {
    background: var(--level-color); border-color: var(--level-color); color: white;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--level-color) 40%, transparent);
  }
  .move-lesson-list {
    display: flex; flex-direction: column; gap: 0.25rem; max-height: 200px; overflow-y: auto;
  }
  .move-lesson-btn {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
    border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.7); font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
    text-align: left;
  }
  .move-lesson-btn:hover { background: rgba(255,255,255,0.08); color: white; }
  .move-lesson-btn.active {
    background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.4); color: #c4b5fd;
  }
  .move-empty {
    padding: 1.5rem; text-align: center; color: rgba(255,255,255,0.4); font-size: 0.85rem;
  }
  .kanji-move-actions {
    display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.08);
  }
`;
