// PPTX import/export type definitions

import type { SlideFormData } from './lecture';

// Parsed PPTX structure from XML
export interface ParsedPresentation {
  slideOrder: string[]; // Array of slide rIds
  title?: string;
}

export interface ParsedSlide {
  title?: string;
  elements: ParsedElement[];
  background?: ParsedBackground;
  notes?: string;
  layoutType?: string;
}

export interface ParsedElement {
  type: 'text' | 'image' | 'shape' | 'placeholder';
  content: string;
  position: {
    x: number;  // EMUs
    y: number;  // EMUs
    width: number;  // EMUs
    height: number; // EMUs
  };
  style?: ParsedTextStyle;
  relationshipId?: string; // rId for images
}

export interface ParsedTextStyle {
  fontSize?: number;  // Points (pt)
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;  // Hex color
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface ParsedBackground {
  type: 'solid' | 'image' | 'gradient';
  color?: string;
  imageRelId?: string;
}

// Import options
export interface PPTXImportOptions {
  mode: 'append' | 'replace' | 'select';
  selectedSlides?: number[]; // For 'select' mode
  preserveStyles?: boolean;
}

// Export options
export interface PPTXExportOptions {
  includeNotes?: boolean;
  author?: string;
  title?: string;
}

// Import state for progress tracking
export type ImportState =
  | 'idle'
  | 'reading'
  | 'parsing'
  | 'uploading'
  | 'saving'
  | 'complete'
  | 'error';

export interface ImportProgress {
  state: ImportState;
  percent: number;
  currentStep: string;
  totalSlides?: number;
  processedSlides?: number;
}

// Import result
export interface ImportResult {
  success: boolean;
  slides: SlideFormData[];
  errors: string[];
  warnings: string[];
  mediaUrls: Map<string, string>;
}

// Preview slide for import modal
export interface SlidePreview {
  index: number;
  title?: string;
  elementCount: number;
  hasImages: boolean;
  thumbnail?: string; // Base64 or placeholder
}

// Media file extracted from PPTX
export interface ExtractedMedia {
  filename: string;
  relationshipId: string;
  blob: Blob;
  mimeType: string;
}

// Mapping from PPTX relationship ID to our element
export interface MediaMapping {
  relId: string;
  originalPath: string;
  uploadedUrl: string;
}
