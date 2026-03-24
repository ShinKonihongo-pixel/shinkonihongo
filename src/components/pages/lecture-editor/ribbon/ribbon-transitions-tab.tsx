import type { SlideFormData, SlideTransition } from '../../../../types/lecture';

interface TransitionsTabContentProps {
  editingSlide: SlideFormData;
  updateEditingSlide: (updates: Partial<SlideFormData>) => void;
}

export function TransitionsTabContent({ editingSlide, updateEditingSlide }: TransitionsTabContentProps) {
  return (
    <div className="ppt-ribbon-group">
      <div className="ppt-ribbon-group-content">
        <select
          className="ppt-ribbon-select"
          value={editingSlide.transition || 'fade'}
          onChange={(e) => updateEditingSlide({ transition: e.target.value as SlideTransition })}
        >
          <option value="none">Không có</option>
          <option value="fade">Fade</option>
          <option value="slide-horizontal">Slide ngang</option>
          <option value="slide-vertical">Slide dọc</option>
          <option value="zoom">Zoom</option>
          <option value="flip">Flip</option>
        </select>
        <input
          type="number"
          className="ppt-ribbon-input"
          value={editingSlide.animationDuration || 500}
          onChange={(e) => updateEditingSlide({ animationDuration: parseInt(e.target.value) || 500 })}
          min={100}
          max={3000}
          step={100}
        />
        <span className="ppt-ribbon-label">ms</span>
      </div>
      <span className="ppt-ribbon-group-label">Transition</span>
    </div>
  );
}
