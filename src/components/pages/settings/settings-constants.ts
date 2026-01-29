// Settings page constants - Gradient presets, fonts, background options
// Extracted from settings-page.tsx for better maintainability

// Profile background options
export const PROFILE_BACKGROUND_OPTIONS = [
  { value: 'transparent', label: 'Trong suốt' },
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Tím xanh' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Hồng' },
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Xanh dương' },
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Xanh lá' },
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Cam hồng' },
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Pastel' },
  { value: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', label: 'Xanh đậm' },
  { value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', label: 'Xám đen' },
  { value: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', label: 'Đỏ' },
];

// Gradient category type
export type GradientCategory = 'all' | 'japanese' | 'nature' | 'sunset' | 'ocean' | 'galaxy' | 'neon' | 'pastel' | 'dark' | 'pattern';

// Gradient preset interface
export interface GradientPreset {
  value: string;
  label: string;
  category: GradientCategory;
}

// Preset gradients for card background - organized by category
export const GRADIENT_PRESETS: GradientPreset[] = [
  // Japanese-themed
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Tím Xanh (Mặc định)', category: 'japanese' },
  { value: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', label: 'Shu (Đỏ son)', category: 'japanese' },
  { value: 'linear-gradient(135deg, #d4a574 0%, #c19a6b 100%)', label: 'Kincha (Vàng trà)', category: 'japanese' },
  { value: 'linear-gradient(135deg, #2d5a27 0%, #1e3d14 100%)', label: 'Matcha (Trà xanh)', category: 'japanese' },
  { value: 'linear-gradient(135deg, #ffb7c5 0%, #ff69b4 100%)', label: 'Sakura (Hoa anh đào)', category: 'japanese' },
  { value: 'linear-gradient(180deg, #1a1a2e 0%, #3d1a4a 50%, #0f3460 100%)', label: 'Yoru (Đêm)', category: 'japanese' },

  // Nature
  { value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', label: 'Rừng Xanh', category: 'nature' },
  { value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', label: 'Lá Non', category: 'nature' },
  { value: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)', label: 'Cỏ Mùa Xuân', category: 'nature' },
  { value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', label: 'Rừng Sâu', category: 'nature' },
  { value: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)', label: 'Sương Mù', category: 'nature' },

  // Sunset
  { value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', label: 'Hoàng Hôn', category: 'sunset' },
  { value: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)', label: 'Bình Minh', category: 'sunset' },
  { value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', label: 'Lửa Chiều', category: 'sunset' },
  { value: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)', label: 'Cam Đỏ', category: 'sunset' },
  { value: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', label: 'Cam Nhạt', category: 'sunset' },

  // Ocean
  { value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', label: 'Biển Xanh', category: 'ocean' },
  { value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: 'Đại Dương Sâu', category: 'ocean' },
  { value: 'linear-gradient(180deg, #87ceeb 0%, #1e90ff 50%, #000080 100%)', label: 'Biển Sâu', category: 'ocean' },
  { value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', label: 'Sóng Biển', category: 'ocean' },
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Biển Pastel', category: 'ocean' },

  // Galaxy
  { value: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', label: 'Thiên Hà', category: 'galaxy' },
  { value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)', label: 'Vũ Trụ', category: 'galaxy' },
  { value: 'linear-gradient(135deg, #1a1a2e 0%, #4a0080 100%)', label: 'Sao Đêm', category: 'galaxy' },
  { value: 'linear-gradient(135deg, #200122 0%, #6f0000 100%)', label: 'Sao Hỏa', category: 'galaxy' },
  { value: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)', label: 'Aurora', category: 'galaxy' },

  // Neon
  { value: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)', label: 'Neon Hồng-Xanh', category: 'neon' },
  { value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', label: 'Neon Hồng', category: 'neon' },
  { value: 'linear-gradient(135deg, #00f3ff 0%, #0080ff 100%)', label: 'Neon Xanh', category: 'neon' },
  { value: 'linear-gradient(135deg, #b721ff 0%, #21d4fd 100%)', label: 'Neon Tím', category: 'neon' },
  { value: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', label: 'Neon Vàng', category: 'neon' },

  // Pastel
  { value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', label: 'Pastel Xanh-Hồng', category: 'pastel' },
  { value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', label: 'Pastel Hồng', category: 'pastel' },
  { value: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', label: 'Pastel Tím', category: 'pastel' },
  { value: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', label: 'Pastel Cầu Vồng', category: 'pastel' },
  { value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', label: 'Pastel Lavender', category: 'pastel' },

  // Dark
  { value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', label: 'Đêm Tối', category: 'dark' },
  { value: 'linear-gradient(135deg, #232526 0%, #414345 100%)', label: 'Xám Tối', category: 'dark' },
  { value: 'linear-gradient(135deg, #c31432 0%, #240b36 100%)', label: 'Đỏ Đậm', category: 'dark' },
  { value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', label: 'Đen Xanh', category: 'dark' },
  { value: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)', label: 'Than Đen', category: 'dark' },

  // Patterns (CSS patterns)
  { value: 'repeating-linear-gradient(45deg, #606dbc, #606dbc 10px, #465298 10px, #465298 20px)', label: 'Sọc Xéo', category: 'pattern' },
  { value: 'repeating-linear-gradient(0deg, #e74c3c, #e74c3c 10px, #c0392b 10px, #c0392b 20px)', label: 'Sọc Ngang Đỏ', category: 'pattern' },
  { value: 'repeating-linear-gradient(90deg, #667eea, #667eea 10px, #764ba2 10px, #764ba2 20px)', label: 'Sọc Dọc Tím', category: 'pattern' },
  { value: 'radial-gradient(circle at 25% 25%, #667eea 2%, transparent 2%), radial-gradient(circle at 75% 75%, #667eea 2%, #764ba2 2%)', label: 'Chấm Bi', category: 'pattern' },
  { value: 'conic-gradient(from 0deg at 50% 50%, #667eea, #764ba2, #667eea)', label: 'Xoáy Ốc', category: 'pattern' },
];

// Gradient category options for UI
export const GRADIENT_CATEGORIES: { key: GradientCategory; label: string; icon: string }[] = [
  { key: 'all', label: 'Tất cả', icon: '🎨' },
  { key: 'japanese', label: 'Nhật Bản', icon: '🎌' },
  { key: 'nature', label: 'Thiên nhiên', icon: '🌿' },
  { key: 'sunset', label: 'Hoàng hôn', icon: '🌅' },
  { key: 'ocean', label: 'Đại dương', icon: '🌊' },
  { key: 'galaxy', label: 'Vũ trụ', icon: '🌌' },
  { key: 'neon', label: 'Neon', icon: '💜' },
  { key: 'pastel', label: 'Pastel', icon: '🍬' },
  { key: 'dark', label: 'Tối', icon: '🌑' },
  { key: 'pattern', label: 'Họa tiết', icon: '🔲' },
];

// Kanji font options
export const KANJI_FONTS = [
  { value: 'Noto Serif JP', label: 'Noto Serif JP' },
  { value: 'Shippori Mincho', label: 'Shippori Mincho' },
  { value: 'Zen Old Mincho', label: 'Zen Old Mincho' },
  { value: 'Zen Antique', label: 'Zen Antique' },
  { value: 'Noto Sans JP', label: 'Noto Sans JP' },
  { value: 'Zen Maru Gothic', label: 'Zen Maru Gothic' },
  { value: 'Zen Kurenaido', label: 'Zen Kurenaido' },
  { value: 'Klee One', label: 'Klee One (Giáo khoa)' },
  { value: 'Hachi Maru Pop', label: 'Hachi Maru Pop (Dễ thương)' },
  { value: 'MS Mincho', label: 'MS Mincho (Hệ thống)' },
];
