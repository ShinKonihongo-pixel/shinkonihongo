// PPTX Importer - Extract slides from PowerPoint files using JSZip
// Rewritten for better compatibility with different PPTX formats

import JSZip from 'jszip';
import type { SlideFormData, SlideElement, SlideLayout } from '../../types/lecture';
import type {
  ImportResult,
  ImportProgress,
  ExtractedMedia,
  ParsedSlide,
} from '../../types/pptx';
import {
  parseSlideXml,
  parseRelationships,
  parseNotesXml,
} from './pptx-parser';
import {
  emuToPercentX,
  emuToPercentY,
  emuToPercentWidth,
  emuToPercentHeight,
  MAX_FILE_SIZE,
} from './pptx-constants';
// Helper function to convert blob to data URL
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Generate unique ID for elements
function generateId(): string {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate minimum height needed for text based on font size and content
function calculateMinTextHeight(fontSize: number, content: string, widthPercent: number): number {
  // Approximate characters per line based on width (assuming 16:9 slide ratio)
  const slideWidthPx = 960; // Reference width
  const fontSizePx = fontSize || 18;
  const widthPx = (widthPercent / 100) * slideWidthPx;
  const charsPerLine = Math.max(1, Math.floor(widthPx / (fontSizePx * 0.6)));

  // Count lines (including explicit line breaks)
  const lines = content.split('\n');
  let totalLines = 0;
  for (const line of lines) {
    totalLines += Math.max(1, Math.ceil(line.length / charsPerLine));
  }

  // Calculate height: line height ~1.5, convert to percent of slide height (540px reference)
  const slideHeightPx = 540;
  const lineHeightPx = fontSizePx * 1.5;
  const neededHeightPx = totalLines * lineHeightPx + fontSizePx; // Extra padding
  const heightPercent = (neededHeightPx / slideHeightPx) * 100;

  return Math.min(90, Math.max(8, heightPercent)); // Cap between 8% and 90%
}

// Convert parsed element to SlideElement
function convertToSlideElement(
  parsed: import('../../types/pptx').ParsedElement,
  mediaUrls: Map<string, string>
): SlideElement | null {
  // Convert EMU position to percentages
  const basePosition = {
    x: Math.max(0, Math.min(100, emuToPercentX(parsed.position.x))),
    y: Math.max(0, Math.min(100, emuToPercentY(parsed.position.y))),
    width: Math.max(5, Math.min(100, emuToPercentWidth(parsed.position.width))),
    height: Math.max(5, Math.min(100, emuToPercentHeight(parsed.position.height))),
  };

  if (parsed.type === 'text' && parsed.content.trim()) {
    const fontSize = parsed.style?.fontSize || 18;

    // Auto-adjust height for large fonts to prevent overflow/scrolling
    const minHeight = calculateMinTextHeight(fontSize, parsed.content, basePosition.width);
    const adjustedHeight = Math.max(basePosition.height, minHeight);

    // Also ensure position doesn't overflow slide boundaries
    const position = {
      ...basePosition,
      height: adjustedHeight,
      y: Math.min(basePosition.y, 100 - adjustedHeight), // Prevent overflow at bottom
    };

    return {
      id: generateId(),
      type: 'text',
      content: parsed.content,
      position,
      style: {
        fontSize: `${Math.round(fontSize)}px`,
        fontWeight: parsed.style?.bold ? 'bold' : 'normal',
        fontStyle: parsed.style?.italic ? 'italic' : 'normal',
        color: parsed.style?.color || '#000000',
        textAlign: parsed.style?.align || 'left',
        backgroundColor: 'transparent',
      },
    };
  }

  if (parsed.type === 'image' && parsed.relationshipId) {
    const imageUrl = mediaUrls.get(parsed.relationshipId);
    if (imageUrl) {
      return {
        id: generateId(),
        type: 'image',
        content: imageUrl,
        position: basePosition,
      };
    }
  }

  return null;
}

// Convert parsed slide to SlideFormData
function convertToSlideFormData(
  parsed: ParsedSlide,
  mediaUrls: Map<string, string>,
  slideIndex: number
): SlideFormData {
  const elements: SlideElement[] = [];

  for (const el of parsed.elements) {
    const converted = convertToSlideElement(el, mediaUrls);
    if (converted) {
      elements.push(converted);
    }
  }

  // Determine layout based on content
  let layout: SlideLayout = 'content';
  const hasImage = elements.some(e => e.type === 'image');
  const hasText = elements.some(e => e.type === 'text');

  if (parsed.title && elements.length <= 2) {
    layout = 'title';
  } else if (hasImage && hasText) {
    const imageEl = elements.find(e => e.type === 'image');
    if (imageEl && imageEl.position.x < 40) {
      layout = 'image-left';
    } else if (imageEl && imageEl.position.x > 50) {
      layout = 'image-right';
    }
  }

  // Handle background
  let backgroundColor = '#ffffff';
  let backgroundImage: string | undefined;

  if (parsed.background) {
    if (parsed.background.type === 'solid' && parsed.background.color) {
      backgroundColor = parsed.background.color;
    } else if (parsed.background.type === 'image' && parsed.background.imageRelId) {
      backgroundImage = mediaUrls.get(parsed.background.imageRelId);
    }
  }

  return {
    layout,
    title: parsed.title || `Slide ${slideIndex + 1}`,
    elements,
    backgroundColor,
    backgroundImage,
    notes: parsed.notes,
    animation: 'none',
    transition: 'fade',
    animationDuration: 500,
  };
}

// Extract media files from PPTX
async function extractMedia(zip: JSZip): Promise<Map<string, ExtractedMedia>> {
  const mediaFiles = new Map<string, ExtractedMedia>();

  // Look for media files in ppt/media/
  const mediaFolder = zip.folder('ppt/media');
  if (!mediaFolder) return mediaFiles;

  const mediaEntries: { name: string; file: JSZip.JSZipObject }[] = [];
  mediaFolder.forEach((relativePath, file) => {
    if (!file.dir) {
      mediaEntries.push({ name: relativePath, file });
    }
  });

  for (const { name, file } of mediaEntries) {
    try {
      const blob = await file.async('blob');
      const ext = name.split('.').pop()?.toLowerCase() || 'bin';
      const mimeMap: Record<string, string> = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        'svg': 'image/svg+xml',
        'emf': 'image/emf',
        'wmf': 'image/wmf',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
      };

      mediaFiles.set(name, {
        filename: name,
        relationshipId: '',
        blob: new Blob([blob], { type: mimeMap[ext] || 'application/octet-stream' }),
        mimeType: mimeMap[ext] || 'application/octet-stream',
      });
    } catch (error) {
      console.warn(`Failed to extract media file: ${name}`, error);
    }
  }

  return mediaFiles;
}

// Build relationship ID to media file mapping
function buildRelIdToMediaMap(
  slideRels: Map<string, string>,
  mediaFiles: Map<string, ExtractedMedia>
): Map<string, Blob> {
  const relIdToBlob = new Map<string, Blob>();

  for (const [relId, target] of slideRels) {
    // Target can be: ../media/image1.png, media/image1.png, or just image1.png
    let mediaName = target;
    if (mediaName.includes('/')) {
      mediaName = mediaName.split('/').pop() || '';
    }

    const media = mediaFiles.get(mediaName);
    if (media) {
      relIdToBlob.set(relId, media.blob);
    }
  }

  return relIdToBlob;
}

// Find all slide files in the ZIP by iterating over all files
function findSlideFiles(zip: JSZip): string[] {
  const slideFiles: string[] = [];

  // Iterate over all files in the zip
  Object.keys(zip.files).forEach((path) => {
    // Match ppt/slides/slide1.xml, ppt/slides/slide2.xml, etc.
    // Exclude _rels folder and other non-slide files
    if (path.match(/^ppt\/slides\/slide\d+\.xml$/)) {
      slideFiles.push(path);
    }
  });

  console.log('Raw slide file paths found:', slideFiles);

  // Sort by slide number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    return numA - numB;
  });

  return slideFiles;
}

// Main import function
export async function importPPTXFile(
  file: File,
  _lectureId: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    slides: [],
    errors: [],
    warnings: [],
    mediaUrls: new Map(),
  };

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    result.errors.push(`File quá lớn (${Math.round(file.size / 1024 / 1024)}MB). Giới hạn: 50MB`);
    return result;
  }

  try {
    // Step 1: Read file
    onProgress?.({ state: 'reading', percent: 10, currentStep: 'Đang đọc file...' });

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Debug: Log all files in ZIP
    console.log('PPTX files found:');
    zip.forEach((path) => {
      console.log(' -', path);
    });

    // Step 2: Extract media files
    onProgress?.({ state: 'parsing', percent: 20, currentStep: 'Đang trích xuất media...' });
    const mediaFiles = await extractMedia(zip);
    console.log('Media files found:', mediaFiles.size);

    // Step 3: Find all slide files
    const slideFiles = findSlideFiles(zip);
    console.log('Slide files found:', slideFiles.length, slideFiles);

    if (slideFiles.length === 0) {
      result.errors.push('Không tìm thấy slide nào trong file PPTX');
      return result;
    }

    // Step 4: Parse each slide
    onProgress?.({ state: 'parsing', percent: 30, currentStep: `Đang phân tích ${slideFiles.length} slides...` });

    const allMediaToUpload = new Map<string, Blob>();
    const parsedSlides: { parsed: ParsedSlide; slideRels: Map<string, string> }[] = [];

    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i];
      const slideXml = await zip.file(slidePath)?.async('string');

      if (!slideXml) {
        console.warn(`Could not read slide: ${slidePath}`);
        continue;
      }

      console.log(`Parsing slide ${i + 1}: ${slidePath}`);

      // Parse slide content
      const parsed = parseSlideXml(slideXml);
      console.log(`  Elements found: ${parsed.elements.length}`);

      // Get slide number from path
      const slideNum = slidePath.match(/slide(\d+)\.xml/)?.[1] || '1';

      // Get slide relationships
      const slideRelsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
      const slideRelsXml = await zip.file(slideRelsPath)?.async('string');
      const slideRels = slideRelsXml ? parseRelationships(slideRelsXml) : new Map();
      console.log(`  Relationships found: ${slideRels.size}`);

      // Try to get notes
      const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
      const notesXml = await zip.file(notesPath)?.async('string');
      if (notesXml) {
        parsed.notes = parseNotesXml(notesXml);
      }

      parsedSlides.push({ parsed, slideRels });

      // Collect media for this slide
      const relIdToBlob = buildRelIdToMediaMap(slideRels, mediaFiles);
      for (const [relId, blob] of relIdToBlob) {
        allMediaToUpload.set(`slide${i}_${relId}`, blob);
      }
    }

    console.log(`Total parsed slides: ${parsedSlides.length}`);

    // Step 5: Handle media - convert to base64 data URLs instead of uploading
    // This avoids Firebase Storage configuration issues and is faster
    const mediaDataUrls = new Map<string, string>();

    if (allMediaToUpload.size > 0) {
      onProgress?.({
        state: 'uploading',
        percent: 50,
        currentStep: `Đang xử lý ${allMediaToUpload.size} media files...`,
      });

      let processed = 0;
      const total = allMediaToUpload.size;

      for (const [key, blob] of allMediaToUpload) {
        try {
          // Convert blob to base64 data URL
          const dataUrl = await blobToDataUrl(blob);
          mediaDataUrls.set(key, dataUrl);
        } catch (err) {
          console.warn(`Failed to convert media ${key}:`, err);
        }

        processed++;
        onProgress?.({
          state: 'uploading',
          percent: 50 + (processed / total) * 30,
          currentStep: `Đang xử lý media (${processed}/${total})...`,
        });
      }

      console.log(`Processed ${mediaDataUrls.size} media files as base64`);
    }

    // Step 6: Convert slides to SlideFormData
    onProgress?.({ state: 'saving', percent: 85, currentStep: 'Đang tạo slides...' });

    for (let i = 0; i < parsedSlides.length; i++) {
      const { parsed, slideRels } = parsedSlides[i];

      // Build media URL map for this slide (using base64 data URLs)
      const slideMediaUrls = new Map<string, string>();
      for (const [relId] of slideRels) {
        const key = `slide${i}_${relId}`;
        const dataUrl = mediaDataUrls.get(key);
        if (dataUrl) {
          slideMediaUrls.set(relId, dataUrl);
        }
      }

      const slideFormData = convertToSlideFormData(parsed, slideMediaUrls, i);
      result.slides.push(slideFormData);
    }

    // Step 7: Complete
    onProgress?.({
      state: 'complete',
      percent: 100,
      currentStep: 'Hoàn thành!',
      totalSlides: result.slides.length,
      processedSlides: result.slides.length,
    });

    result.success = true;
    result.mediaUrls = mediaDataUrls;

    if (result.slides.length === 0) {
      result.warnings.push('Không tìm thấy nội dung slide trong file');
    }

  } catch (error) {
    console.error('PPTX import error:', error);
    result.errors.push(`Lỗi import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    onProgress?.({ state: 'error', percent: 0, currentStep: 'Lỗi import file' });
  }

  return result;
}

// Get preview of slides without uploading
export async function previewPPTXFile(file: File): Promise<{
  slideCount: number;
  hasImages: boolean;
  estimatedMediaSize: number;
  errors: string[];
}> {
  const preview = {
    slideCount: 0,
    hasImages: false,
    estimatedMediaSize: 0,
    errors: [] as string[],
  };

  if (file.size > MAX_FILE_SIZE) {
    preview.errors.push(`File quá lớn (${Math.round(file.size / 1024 / 1024)}MB)`);
    return preview;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Count slides by iterating over all files
    Object.keys(zip.files).forEach((path) => {
      if (path.match(/^ppt\/slides\/slide\d+\.xml$/)) {
        preview.slideCount++;
      }
    });
    console.log('Preview: slideCount =', preview.slideCount);

    // Check for media by iterating over all files
    let mediaCount = 0;
    Object.keys(zip.files).forEach((path) => {
      if (path.startsWith('ppt/media/') && !zip.files[path].dir) {
        preview.hasImages = true;
        mediaCount++;
      }
    });
    preview.estimatedMediaSize = mediaCount * 500 * 1024;
  } catch (error) {
    preview.errors.push('Không thể đọc file PPTX');
  }

  return preview;
}
