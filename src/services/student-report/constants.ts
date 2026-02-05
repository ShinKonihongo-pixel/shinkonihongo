// Design constants for student report PDF generation

export const COLORS = {
  // Primary palette
  primary: { r: 67, g: 97, b: 238 },       // Royal blue
  primaryLight: { r: 114, g: 137, b: 245 },
  primaryDark: { r: 45, g: 66, b: 170 },

  // Accent colors
  accent: { r: 255, g: 107, b: 107 },      // Coral
  success: { r: 46, g: 204, b: 113 },      // Green
  warning: { r: 241, g: 196, b: 15 },      // Yellow
  danger: { r: 231, g: 76, b: 60 },        // Red
  info: { r: 52, g: 152, b: 219 },         // Sky blue

  // Neutral colors
  dark: { r: 44, g: 62, b: 80 },
  gray: { r: 127, g: 140, b: 141 },
  lightGray: { r: 189, g: 195, b: 199 },
  background: { r: 248, g: 249, b: 250 },
  white: { r: 255, g: 255, b: 255 },

  // Section colors
  attendance: { r: 46, g: 204, b: 113 },
  grades: { r: 52, g: 152, b: 219 },
  evaluation: { r: 155, g: 89, b: 182 },
};

export type Color = { r: number; g: number; b: number };
