// Advanced Slide Editor Effects and Utilities
// Professional effects for text, shapes, and animations

// ============ TEXT EFFECTS ============
export interface TextEffect {
  id: string;
  name: string;
  style: React.CSSProperties;
}

export const TEXT_EFFECTS: TextEffect[] = [
  {
    id: 'none',
    name: 'Không',
    style: {}
  },
  {
    id: 'shadow-soft',
    name: 'Bóng mềm',
    style: { textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }
  },
  {
    id: 'shadow-hard',
    name: 'Bóng cứng',
    style: { textShadow: '3px 3px 0px rgba(0,0,0,0.5)' }
  },
  {
    id: 'shadow-glow',
    name: 'Phát sáng',
    style: { textShadow: '0 0 10px rgba(52, 152, 219, 0.8), 0 0 20px rgba(52, 152, 219, 0.5)' }
  },
  {
    id: 'shadow-neon',
    name: 'Neon',
    style: { textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 15px #e74c3c, 0 0 20px #e74c3c' }
  },
  {
    id: 'shadow-3d',
    name: '3D',
    style: { textShadow: '1px 1px 0 #ccc, 2px 2px 0 #c9c9c9, 3px 3px 0 #bbb, 4px 4px 0 #b9b9b9, 5px 5px 0 #aaa' }
  },
  {
    id: 'outline-dark',
    name: 'Viền đen',
    style: {
      textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
      color: '#fff'
    }
  },
  {
    id: 'outline-white',
    name: 'Viền trắng',
    style: {
      textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
      color: '#333'
    }
  },
  {
    id: 'emboss',
    name: 'Nổi',
    style: { textShadow: '-1px -1px 0 rgba(255,255,255,0.5), 1px 1px 0 rgba(0,0,0,0.3)' }
  },
  {
    id: 'retro',
    name: 'Retro',
    style: { textShadow: '3px 3px 0 #f39c12, 6px 6px 0 #e74c3c' }
  }
];

// ============ SHAPE EFFECTS ============
export interface ShapeEffect {
  id: string;
  name: string;
  style: React.CSSProperties;
}

export const SHAPE_EFFECTS: ShapeEffect[] = [
  {
    id: 'none',
    name: 'Không',
    style: {}
  },
  {
    id: 'shadow-sm',
    name: 'Bóng nhỏ',
    style: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  },
  {
    id: 'shadow-md',
    name: 'Bóng vừa',
    style: { boxShadow: '0 4px 8px rgba(0,0,0,0.15)' }
  },
  {
    id: 'shadow-lg',
    name: 'Bóng lớn',
    style: { boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
  },
  {
    id: 'shadow-xl',
    name: 'Bóng rất lớn',
    style: { boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }
  },
  {
    id: 'glow-blue',
    name: 'Phát sáng xanh',
    style: { boxShadow: '0 0 20px rgba(52, 152, 219, 0.6)' }
  },
  {
    id: 'glow-green',
    name: 'Phát sáng lục',
    style: { boxShadow: '0 0 20px rgba(46, 204, 113, 0.6)' }
  },
  {
    id: 'glow-red',
    name: 'Phát sáng đỏ',
    style: { boxShadow: '0 0 20px rgba(231, 76, 60, 0.6)' }
  },
  {
    id: 'glow-gold',
    name: 'Phát sáng vàng',
    style: { boxShadow: '0 0 20px rgba(241, 196, 15, 0.6)' }
  },
  {
    id: 'inset',
    name: 'Chìm',
    style: { boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }
  },
  {
    id: 'border-glow',
    name: 'Viền sáng',
    style: { boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.3), 0 4px 12px rgba(0,0,0,0.15)' }
  }
];

// ============ GRADIENT BACKGROUNDS ============
export interface GradientPreset {
  id: string;
  name: string;
  value: string;
  preview: string; // CSS for preview
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  // Solid colors (converted to gradients for consistency)
  { id: 'white', name: 'Trắng', value: '#ffffff', preview: '#ffffff' },
  { id: 'light-gray', name: 'Xám nhạt', value: '#f8f9fa', preview: '#f8f9fa' },

  // Light gradients
  { id: 'sky', name: 'Bầu trời', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', preview: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'sunset', name: 'Hoàng hôn', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', preview: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'ocean', name: 'Đại dương', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', preview: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 'forest', name: 'Rừng xanh', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', preview: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { id: 'peach', name: 'Đào', value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', preview: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 'lavender', name: 'Oải hương', value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', preview: 'linear-gradient(135deg, #e0c3fc, #8ec5fc)' },

  // Dark gradients
  { id: 'midnight', name: 'Nửa đêm', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', preview: 'linear-gradient(135deg, #232526, #414345)' },
  { id: 'royal', name: 'Hoàng gia', value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', preview: 'linear-gradient(135deg, #141e30, #243b55)' },
  { id: 'cosmic', name: 'Vũ trụ', value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', preview: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' },

  // Subtle gradients
  { id: 'paper', name: 'Giấy', value: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)', preview: 'linear-gradient(180deg, #ffffff, #f5f5f5)' },
  { id: 'cream', name: 'Kem', value: 'linear-gradient(180deg, #fffef9 0%, #fff8e7 100%)', preview: 'linear-gradient(180deg, #fffef9, #fff8e7)' },
  { id: 'mint', name: 'Bạc hà', value: 'linear-gradient(180deg, #f0fff4 0%, #c6f6d5 100%)', preview: 'linear-gradient(180deg, #f0fff4, #c6f6d5)' },
  { id: 'rose', name: 'Hồng nhạt', value: 'linear-gradient(180deg, #fff5f5 0%, #fed7d7 100%)', preview: 'linear-gradient(180deg, #fff5f5, #fed7d7)' },

  // Japanese themed
  { id: 'sakura', name: 'Hoa anh đào', value: 'linear-gradient(135deg, #ffeef8 0%, #ffd6e7 50%, #ffb8d6 100%)', preview: 'linear-gradient(135deg, #ffeef8, #ffd6e7, #ffb8d6)' },
  { id: 'zen', name: 'Thiền', value: 'linear-gradient(180deg, #f5f5f0 0%, #e8e8e0 100%)', preview: 'linear-gradient(180deg, #f5f5f0, #e8e8e0)' },
  { id: 'matcha', name: 'Matcha', value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', preview: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
];

// ============ ELEMENT ANIMATIONS ============
export interface ElementAnimation {
  id: string;
  name: string;
  category: 'entrance' | 'emphasis' | 'exit';
  keyframes: string;
  duration: number;
}

export const ELEMENT_ANIMATIONS: ElementAnimation[] = [
  // Entrance
  { id: 'fadeIn', name: 'Mờ dần', category: 'entrance', keyframes: 'fadeIn', duration: 500 },
  { id: 'slideInLeft', name: 'Trượt từ trái', category: 'entrance', keyframes: 'slideInLeft', duration: 500 },
  { id: 'slideInRight', name: 'Trượt từ phải', category: 'entrance', keyframes: 'slideInRight', duration: 500 },
  { id: 'slideInUp', name: 'Trượt từ dưới', category: 'entrance', keyframes: 'slideInUp', duration: 500 },
  { id: 'slideInDown', name: 'Trượt từ trên', category: 'entrance', keyframes: 'slideInDown', duration: 500 },
  { id: 'zoomIn', name: 'Phóng to', category: 'entrance', keyframes: 'zoomIn', duration: 400 },
  { id: 'bounceIn', name: 'Nảy vào', category: 'entrance', keyframes: 'bounceIn', duration: 600 },
  { id: 'flipInX', name: 'Lật ngang', category: 'entrance', keyframes: 'flipInX', duration: 500 },
  { id: 'flipInY', name: 'Lật dọc', category: 'entrance', keyframes: 'flipInY', duration: 500 },
  { id: 'rotateIn', name: 'Xoay vào', category: 'entrance', keyframes: 'rotateIn', duration: 500 },

  // Emphasis
  { id: 'pulse', name: 'Nhấp nháy', category: 'emphasis', keyframes: 'pulse', duration: 1000 },
  { id: 'shake', name: 'Rung', category: 'emphasis', keyframes: 'shake', duration: 500 },
  { id: 'swing', name: 'Lắc lư', category: 'emphasis', keyframes: 'swing', duration: 800 },
  { id: 'tada', name: 'Ta-da!', category: 'emphasis', keyframes: 'tada', duration: 800 },
  { id: 'heartbeat', name: 'Nhịp tim', category: 'emphasis', keyframes: 'heartbeat', duration: 1200 },
  { id: 'rubberBand', name: 'Dây thun', category: 'emphasis', keyframes: 'rubberBand', duration: 800 },

  // Exit
  { id: 'fadeOut', name: 'Mờ đi', category: 'exit', keyframes: 'fadeOut', duration: 500 },
  { id: 'slideOutLeft', name: 'Trượt ra trái', category: 'exit', keyframes: 'slideOutLeft', duration: 500 },
  { id: 'slideOutRight', name: 'Trượt ra phải', category: 'exit', keyframes: 'slideOutRight', duration: 500 },
  { id: 'zoomOut', name: 'Thu nhỏ', category: 'exit', keyframes: 'zoomOut', duration: 400 },
];

// ============ KEYBOARD SHORTCUTS ============
export interface KeyboardShortcut {
  key: string;
  description: string;
  category: 'general' | 'editing' | 'navigation' | 'formatting';
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // General
  { key: 'Ctrl+S', description: 'Lưu slide', category: 'general' },
  { key: 'Ctrl+Z', description: 'Hoàn tác (Undo)', category: 'general' },
  { key: 'Ctrl+Y', description: 'Làm lại (Redo)', category: 'general' },
  { key: 'Escape', description: 'Bỏ chọn element', category: 'general' },

  // Editing
  { key: 'Ctrl+C', description: 'Sao chép element', category: 'editing' },
  { key: 'Ctrl+V', description: 'Dán element', category: 'editing' },
  { key: 'Ctrl+D', description: 'Nhân đôi element', category: 'editing' },
  { key: 'Delete', description: 'Xóa element', category: 'editing' },
  { key: 'Ctrl+A', description: 'Chọn tất cả', category: 'editing' },

  // Navigation
  { key: '↑↓←→', description: 'Di chuyển element', category: 'navigation' },
  { key: 'Shift+↑↓←→', description: 'Di chuyển nhanh (5px)', category: 'navigation' },
  { key: 'Page Up', description: 'Slide trước', category: 'navigation' },
  { key: 'Page Down', description: 'Slide sau', category: 'navigation' },

  // Formatting
  { key: 'Ctrl+B', description: 'In đậm', category: 'formatting' },
  { key: 'Ctrl+I', description: 'In nghiêng', category: 'formatting' },
  { key: 'Ctrl+U', description: 'Gạch chân', category: 'formatting' },
  { key: 'Ctrl+]', description: 'Tăng cỡ chữ', category: 'formatting' },
  { key: 'Ctrl+[', description: 'Giảm cỡ chữ', category: 'formatting' },
];

// ============ SLIDE THEMES ============
export interface SlideTheme {
  id: string;
  name: string;
  preview: string;
  backgroundColor: string;
  titleStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
  accentColor: string;
}

export const SLIDE_THEMES: SlideTheme[] = [
  {
    id: 'default',
    name: 'Mặc định',
    preview: '#ffffff',
    backgroundColor: '#ffffff',
    titleStyle: { color: '#2c3e50', fontSize: '36px', fontWeight: 'bold' },
    textStyle: { color: '#34495e', fontSize: '20px' },
    accentColor: '#3498db'
  },
  {
    id: 'professional',
    name: 'Chuyên nghiệp',
    preview: 'linear-gradient(135deg, #667eea, #764ba2)',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleStyle: { color: '#ffffff', fontSize: '40px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' },
    textStyle: { color: '#ffffff', fontSize: '22px' },
    accentColor: '#f1c40f'
  },
  {
    id: 'minimal',
    name: 'Tối giản',
    preview: '#f8f9fa',
    backgroundColor: '#f8f9fa',
    titleStyle: { color: '#1a1a1a', fontSize: '32px', fontWeight: '300', letterSpacing: '2px' },
    textStyle: { color: '#4a4a4a', fontSize: '18px', lineHeight: '1.8' },
    accentColor: '#e74c3c'
  },
  {
    id: 'dark',
    name: 'Tối',
    preview: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    backgroundColor: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    titleStyle: { color: '#ffffff', fontSize: '36px', fontWeight: 'bold' },
    textStyle: { color: '#e0e0e0', fontSize: '20px' },
    accentColor: '#00d9ff'
  },
  {
    id: 'japanese',
    name: 'Nhật Bản',
    preview: 'linear-gradient(180deg, #fff5f5, #ffe0e0)',
    backgroundColor: 'linear-gradient(180deg, #fff5f5 0%, #ffe0e0 100%)',
    titleStyle: { color: '#c53030', fontSize: '36px', fontWeight: 'bold' },
    textStyle: { color: '#4a3728', fontSize: '20px' },
    accentColor: '#e74c3c'
  },
  {
    id: 'nature',
    name: 'Thiên nhiên',
    preview: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
    backgroundColor: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    titleStyle: { color: '#2e7d32', fontSize: '36px', fontWeight: 'bold' },
    textStyle: { color: '#33691e', fontSize: '20px' },
    accentColor: '#4caf50'
  },
  {
    id: 'ocean',
    name: 'Biển cả',
    preview: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    titleStyle: { color: '#1565c0', fontSize: '36px', fontWeight: 'bold' },
    textStyle: { color: '#0d47a1', fontSize: '20px' },
    accentColor: '#2196f3'
  },
  {
    id: 'playful',
    name: 'Vui nhộn',
    preview: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
    backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
    titleStyle: { color: '#e65100', fontSize: '38px', fontWeight: 'bold' },
    textStyle: { color: '#bf360c', fontSize: '20px' },
    accentColor: '#ff9800'
  }
];

// ============ UNDO/REDO HISTORY ============
export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistoryState<T>(initial: T): HistoryState<T> {
  return {
    past: [],
    present: initial,
    future: []
  };
}

export function pushHistory<T>(history: HistoryState<T>, newState: T, maxHistory = 50): HistoryState<T> {
  return {
    past: [...history.past.slice(-maxHistory + 1), history.present],
    present: newState,
    future: []
  };
}

export function undo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.past.length === 0) return history;

  const newPast = [...history.past];
  const newPresent = newPast.pop()!;

  return {
    past: newPast,
    present: newPresent,
    future: [history.present, ...history.future]
  };
}

export function redo<T>(history: HistoryState<T>): HistoryState<T> {
  if (history.future.length === 0) return history;

  const newFuture = [...history.future];
  const newPresent = newFuture.shift()!;

  return {
    past: [...history.past, history.present],
    present: newPresent,
    future: newFuture
  };
}

export function canUndo<T>(history: HistoryState<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: HistoryState<T>): boolean {
  return history.future.length > 0;
}
