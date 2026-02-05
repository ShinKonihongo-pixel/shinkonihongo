// Teacher notes panel component

interface TeacherNotesPanelProps {
  notes: string | undefined;
  onClose: () => void;
}

export function TeacherNotesPanel({ notes, onClose }: TeacherNotesPanelProps) {
  return (
    <div className={`teacher-notes-panel ${!notes ? 'empty' : ''}`}>
      <div className="teacher-notes-header">
        <span>📝 Ghi chú giáo viên</span>
        <button className="btn-close" onClick={onClose}>×</button>
      </div>
      <div className="teacher-notes-content">
        {notes ? notes : <em>Slide này chưa có ghi chú</em>}
      </div>
    </div>
  );
}
