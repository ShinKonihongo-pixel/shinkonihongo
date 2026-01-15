// PPTX format constants and conversion utilities

// EMU (English Metric Units) conversions
// 914400 EMUs = 1 inch
export const EMU_PER_INCH = 914400;
export const EMU_PER_POINT = 12700; // For font sizes

// Standard slide dimensions in EMUs (10" x 7.5")
export const SLIDE_WIDTH_EMU = 9144000;
export const SLIDE_HEIGHT_EMU = 6858000;

// Standard slide dimensions in inches
export const SLIDE_WIDTH_INCHES = 10;
export const SLIDE_HEIGHT_INCHES = 7.5;

// Convert EMU to percentage of slide dimension
export function emuToPercentX(emu: number): number {
  return (emu / SLIDE_WIDTH_EMU) * 100;
}

export function emuToPercentY(emu: number): number {
  return (emu / SLIDE_HEIGHT_EMU) * 100;
}

export function emuToPercentWidth(emu: number): number {
  return (emu / SLIDE_WIDTH_EMU) * 100;
}

export function emuToPercentHeight(emu: number): number {
  return (emu / SLIDE_HEIGHT_EMU) * 100;
}

// Convert percentage to inches for pptxgenjs
export function percentToInchesX(percent: number): number {
  return (percent / 100) * SLIDE_WIDTH_INCHES;
}

export function percentToInchesY(percent: number): number {
  return (percent / 100) * SLIDE_HEIGHT_INCHES;
}

export function percentToInchesWidth(percent: number): number {
  return (percent / 100) * SLIDE_WIDTH_INCHES;
}

export function percentToInchesHeight(percent: number): number {
  return (percent / 100) * SLIDE_HEIGHT_INCHES;
}

// Convert EMU font size to points
export function emuToPoints(emu: number): number {
  return emu / EMU_PER_POINT;
}

// Convert points to pixels (approximate, 1pt = 1.333px at 96dpi)
export function pointsToPixels(points: number): number {
  return points * 1.333;
}

// Convert ARGB hex (AARRGGBB) to RGB hex (#RRGGBB)
export function argbToHex(argb: string): string {
  if (!argb) return '#000000';
  // PPTX uses AARRGGBB format, we need #RRGGBB
  const clean = argb.replace(/^#/, '');
  if (clean.length === 8) {
    return '#' + clean.substring(2);
  }
  if (clean.length === 6) {
    return '#' + clean;
  }
  return '#000000';
}

// Common PPTX color scheme names to hex
export const SCHEME_COLORS: Record<string, string> = {
  'tx1': '#000000',
  'tx2': '#44546A',
  'bg1': '#FFFFFF',
  'bg2': '#E7E6E6',
  'accent1': '#4472C4',
  'accent2': '#ED7D31',
  'accent3': '#A5A5A5',
  'accent4': '#FFC000',
  'accent5': '#5B9BD5',
  'accent6': '#70AD47',
  'hlink': '#0563C1',
  'folHlink': '#954F72',
  'dk1': '#000000',
  'dk2': '#44546A',
  'lt1': '#FFFFFF',
  'lt2': '#E7E6E6',
};

// PPTX layout types mapping
export const LAYOUT_MAPPING: Record<string, string> = {
  'title': 'title',
  'obj': 'content',
  'twoObj': 'two-column',
  'objTx': 'image-left',
  'txObj': 'image-right',
  'blank': 'content',
  'secHead': 'title',
  'twoTxTwoObj': 'two-column',
  'titleOnly': 'content',
  'picTx': 'image-left',
  'txPic': 'image-right',
};

// File size limit (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
];

// PPTX XML namespaces
export const XML_NAMESPACES = {
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
};
