// Lecture Editor Constants - Styling and configuration values

export const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '40', '48', '56', '64', '72', '96'];

export const FONT_FAMILIES = [
  'Arial', 'Arial Black', 'Georgia', 'Times New Roman', 'Verdana', 'Tahoma',
  'Courier New', 'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Lucida Sans'
];

export const COLORS = [
  '#000000', '#ffffff', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71',
  '#3498db', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6', '#7f8c8d',
  '#c0392b', '#d35400', '#f39c12', '#27ae60', '#2980b9', '#8e44ad'
];

export const HIGHLIGHT_COLORS = [
  'transparent', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000',
  '#0000ff', '#ffa500', '#ffb6c1', '#98fb98', '#add8e6', '#dda0dd'
];

export const LINE_HEIGHTS = ['1', '1.2', '1.5', '1.8', '2', '2.5', '3'];
export const BORDER_WIDTHS = ['0', '1', '2', '3', '4', '5'];
export const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double'];
export const OPACITIES = ['100', '90', '80', '70', '60', '50', '40', '30', '20', '10'];
export const PADDING_SIZES = ['0', '4', '8', '12', '16', '20', '24', '32'];

// Box background colors (with transparency options)
export const BOX_BACKGROUNDS = [
  'transparent',
  '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6',
  '#fff3cd', '#d4edda', '#d1ecf1', '#f8d7da', '#e2d5f1',
  'rgba(255,255,255,0.8)', 'rgba(0,0,0,0.05)', 'rgba(52,152,219,0.1)',
  'rgba(46,204,113,0.1)', 'rgba(241,196,15,0.2)', 'rgba(231,76,60,0.1)',
];

// Educational symbols/icons for lectures
export const LECTURE_SYMBOLS = {
  'Arrows': ['→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐', '⇑', '⇓', '⇔', '➜', '➤', '➡', '⬅', '⬆', '⬇'],
  'Checkmarks': ['✓', '✔', '✗', '✘', '☑', '☐', '☒', '⊙', '⊛', '◉', '○', '●'],
  'Stars & Ratings': ['★', '☆', '✩', '✪', '✫', '✬', '✭', '✮', '⭐', '🌟', '💫'],
  'Numbers': ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '❶', '❷', '❸', '❹', '❺'],
  'Bullets': ['•', '◦', '▪', '▫', '►', '▻', '◆', '◇', '■', '□', '▲', '△', '▼', '▽'],
  'Math': ['+', '−', '×', '÷', '=', '≠', '≈', '≤', '≥', '<', '>', '±', '∞', '√', '%'],
  'Hands & Actions': ['👆', '👇', '👈', '👉', '✋', '👍', '👎', '👏', '🤝', '✌️', '☝️'],
  'Alerts': ['⚠️', '❗', '❓', '❕', '❔', '💡', '📌', '📍', '🔔', '⚡', '🔥', '💥'],
  'Learning': ['📚', '📖', '📝', '✏️', '📎', '📋', '🎯', '🏆', '💯', '✅', '❌', '⭕'],
  'Japanese': ['〇', '×', '△', '□', '◎', '※', '♪', '♫', '→', '⇒', '＝', '＋'],
};

// Quick text templates for lectures
export const TEXT_TEMPLATES: { label: string; content: string; style: Record<string, string> }[] = [
  { label: 'Tiêu đề', content: 'Tiêu đề', style: { fontSize: '36px', fontWeight: 'bold', textAlign: 'center' } },
  { label: 'Phụ đề', content: 'Phụ đề', style: { fontSize: '24px', fontStyle: 'italic', color: '#7f8c8d' } },
  { label: 'Bullet point', content: '• Điểm quan trọng', style: { fontSize: '20px' } },
  { label: 'Ghi chú', content: '※ Ghi chú:', style: { fontSize: '16px', color: '#e67e22', backgroundColor: '#fff3cd', padding: '8px' } },
  { label: 'Cảnh báo', content: '⚠️ Lưu ý quan trọng', style: { fontSize: '18px', color: '#e74c3c', fontWeight: 'bold' } },
];

// Quick symbols for toolbar
export const QUICK_SYMBOLS = ['→', '✓', '★', '•', '①', '⚠️', '💡', '📌'];
