// Utility functions for lecture page

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const saveProgress = (lectureId: string, slideIndex: number): void => {
  if (slideIndex > 0) {
    localStorage.setItem(
      `lecture-progress-${lectureId}`,
      JSON.stringify({ slideIndex, timestamp: Date.now() })
    );
  }
};

export const loadProgress = (lectureId: string): { slideIndex: number } | null => {
  const savedProgress = localStorage.getItem(`lecture-progress-${lectureId}`);
  if (savedProgress) {
    return JSON.parse(savedProgress);
  }
  return null;
};

export const clearProgress = (lectureId: string): void => {
  localStorage.removeItem(`lecture-progress-${lectureId}`);
};

export const saveNotes = (lectureId: string, notes: Record<string, string>): void => {
  localStorage.setItem(`lecture-notes-${lectureId}`, JSON.stringify(notes));
};

export const loadNotes = (lectureId: string): Record<string, string> => {
  const savedNotes = localStorage.getItem(`lecture-notes-${lectureId}`);
  return savedNotes ? JSON.parse(savedNotes) : {};
};
