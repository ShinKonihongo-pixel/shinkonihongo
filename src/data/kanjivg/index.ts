// KanjiVG stroke data loader
// Loads stroke path data for kanji characters
// Data can be generated from KanjiVG SVG files using scripts/generate-kanjivg-data.ts

export interface KanjiStrokeData {
  character: string;
  strokeCount: number;
  strokePaths: string[];  // SVG path data for each stroke
  viewBox: string;        // SVG viewBox (typically "0 0 109 109")
}

// Cache for loaded stroke data
const strokeCache = new Map<string, KanjiStrokeData | null>();

// Basic stroke data for common kanji (inline for immediate use)
// In production, this would be lazy-loaded from JSON files
const INLINE_STROKE_DATA: Record<string, KanjiStrokeData> = {
  '一': {
    character: '一',
    strokeCount: 1,
    strokePaths: ['M 15,50 L 94,50'],
    viewBox: '0 0 109 109',
  },
  '二': {
    character: '二',
    strokeCount: 2,
    strokePaths: [
      'M 25,35 L 84,35',
      'M 15,70 L 94,70',
    ],
    viewBox: '0 0 109 109',
  },
  '三': {
    character: '三',
    strokeCount: 3,
    strokePaths: [
      'M 25,25 L 84,25',
      'M 20,52 L 89,52',
      'M 15,80 L 94,80',
    ],
    viewBox: '0 0 109 109',
  },
  '人': {
    character: '人',
    strokeCount: 2,
    strokePaths: [
      'M 55,15 L 30,90',
      'M 55,15 L 85,90',
    ],
    viewBox: '0 0 109 109',
  },
  '大': {
    character: '大',
    strokeCount: 3,
    strokePaths: [
      'M 20,35 L 89,35',
      'M 55,10 L 55,95',
      'M 55,45 L 15,90',
    ],
    viewBox: '0 0 109 109',
  },
  '日': {
    character: '日',
    strokeCount: 4,
    strokePaths: [
      'M 30,15 L 30,95',
      'M 30,15 L 80,15',
      'M 80,15 L 80,95',
      'M 30,55 L 80,55',
    ],
    viewBox: '0 0 109 109',
  },
  '月': {
    character: '月',
    strokeCount: 4,
    strokePaths: [
      'M 35,10 L 35,95',
      'M 35,10 L 80,10 L 80,95',
      'M 35,40 L 80,40',
      'M 35,65 L 80,65',
    ],
    viewBox: '0 0 109 109',
  },
  '山': {
    character: '山',
    strokeCount: 3,
    strokePaths: [
      'M 55,10 L 55,95',
      'M 20,45 L 20,95',
      'M 90,45 L 90,95',
    ],
    viewBox: '0 0 109 109',
  },
  '水': {
    character: '水',
    strokeCount: 4,
    strokePaths: [
      'M 55,10 L 55,95',
      'M 55,50 L 15,85',
      'M 55,50 L 95,85',
      'M 55,30 L 25,15',
    ],
    viewBox: '0 0 109 109',
  },
  '火': {
    character: '火',
    strokeCount: 4,
    strokePaths: [
      'M 55,15 L 55,95',
      'M 55,50 L 15,85',
      'M 55,50 L 95,85',
      'M 30,25 L 40,35',
    ],
    viewBox: '0 0 109 109',
  },
};

// Load stroke data for a character
export async function loadStrokeData(character: string): Promise<KanjiStrokeData | null> {
  // Check cache first
  if (strokeCache.has(character)) {
    return strokeCache.get(character) || null;
  }

  // Check inline data
  if (INLINE_STROKE_DATA[character]) {
    const data = INLINE_STROKE_DATA[character];
    strokeCache.set(character, data);
    return data;
  }

  // For characters without inline data, return a placeholder
  // In production, this would fetch from /src/data/kanjivg/strokes/{codepoint}.json
  const placeholder: KanjiStrokeData = {
    character,
    strokeCount: 0,
    strokePaths: [],
    viewBox: '0 0 109 109',
  };
  strokeCache.set(character, placeholder);
  return placeholder;
}

// Synchronous version for characters we know have inline data
export function getStrokeDataSync(character: string): KanjiStrokeData | null {
  return INLINE_STROKE_DATA[character] || null;
}

// Check if stroke data is available for a character
export function hasStrokeData(character: string): boolean {
  return character in INLINE_STROKE_DATA;
}
