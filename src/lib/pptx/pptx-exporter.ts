// PPTX Export - Convert slides to PowerPoint format using pptxgenjs

import pptxgen from 'pptxgenjs';
import type { Lecture, Slide, SlideElement } from '../../types/lecture';
import type { PPTXExportOptions } from '../../types/pptx';
import {
  percentToInchesX,
  percentToInchesY,
  percentToInchesWidth,
  percentToInchesHeight,
  SLIDE_WIDTH_INCHES,
  SLIDE_HEIGHT_INCHES,
} from './pptx-constants';

// Convert our slide layout to pptxgenjs layout
function getSlideLayout(layout: string): string {
  const layoutMap: Record<string, string> = {
    'title': 'TITLE_SLIDE',
    'content': 'BLANK',
    'two-column': 'BLANK',
    'image-left': 'BLANK',
    'image-right': 'BLANK',
    'full-media': 'BLANK',
  };
  return layoutMap[layout] || 'BLANK';
}

// Convert CSS font size to points
function fontSizeToPoints(fontSize?: string): number {
  if (!fontSize) return 18;
  const match = fontSize.match(/(\d+)/);
  if (match) {
    const px = parseInt(match[1], 10);
    return Math.round(px * 0.75); // px to pt conversion
  }
  return 18;
}

// Convert hex color for pptxgenjs
function normalizeColor(color?: string): string {
  if (!color) return '000000';
  return color.replace('#', '');
}

// Add text element to slide
function addTextElement(pptxSlide: pptxgen.Slide, element: SlideElement): void {
  const x = percentToInchesX(element.position.x);
  const y = percentToInchesY(element.position.y);
  const w = percentToInchesWidth(element.position.width);
  const h = percentToInchesHeight(element.position.height);

  const textOptions: pptxgen.TextPropsOptions = {
    x,
    y,
    w,
    h,
    fontSize: fontSizeToPoints(element.style?.fontSize),
    color: normalizeColor(element.style?.color),
    bold: element.style?.fontWeight === 'bold',
    italic: element.style?.fontStyle === 'italic',
    align: (element.style?.textAlign as pptxgen.HAlign) || 'left',
    valign: 'top',
    wrap: true,
  };

  // Handle background color
  if (element.style?.backgroundColor && element.style.backgroundColor !== 'transparent') {
    textOptions.fill = { color: normalizeColor(element.style.backgroundColor) };
  }

  pptxSlide.addText(element.content, textOptions);
}

// Add image element to slide
async function addImageElement(pptxSlide: pptxgen.Slide, element: SlideElement): Promise<void> {
  if (!element.content) return;

  const x = percentToInchesX(element.position.x);
  const y = percentToInchesY(element.position.y);
  const w = percentToInchesWidth(element.position.width);
  const h = percentToInchesHeight(element.position.height);

  try {
    // Check if it's a base64 image or URL
    if (element.content.startsWith('data:')) {
      pptxSlide.addImage({
        data: element.content,
        x,
        y,
        w,
        h,
      });
    } else {
      // For external URLs, try to fetch and convert to base64
      // Or use path directly if pptxgenjs supports it
      pptxSlide.addImage({
        path: element.content,
        x,
        y,
        w,
        h,
      });
    }
  } catch (error) {
    console.warn('Failed to add image:', error);
    // Add placeholder text instead
    pptxSlide.addText('[Image]', { x, y, w, h, color: '999999' });
  }
}

// Add video placeholder (PPTX doesn't support embedded online videos well)
function addVideoElement(pptxSlide: pptxgen.Slide, element: SlideElement): void {
  const x = percentToInchesX(element.position.x);
  const y = percentToInchesY(element.position.y);
  const w = percentToInchesWidth(element.position.width);
  const h = percentToInchesHeight(element.position.height);

  // Add a placeholder with video URL
  pptxSlide.addText(`[Video: ${element.content}]`, {
    x,
    y,
    w,
    h,
    color: '666666',
    fill: { color: 'EEEEEE' },
    align: 'center',
    valign: 'middle',
  });
}

// Add audio placeholder
function addAudioElement(pptxSlide: pptxgen.Slide, element: SlideElement): void {
  const x = percentToInchesX(element.position.x);
  const y = percentToInchesY(element.position.y);
  const w = percentToInchesWidth(element.position.width);
  const h = percentToInchesHeight(element.position.height);

  pptxSlide.addText(`[Audio: ${element.content}]`, {
    x,
    y,
    w,
    h,
    color: '666666',
    fill: { color: 'EEEEEE' },
    align: 'center',
    valign: 'middle',
  });
}

// Process a single slide
async function processSlide(
  pres: pptxgen,
  slide: Slide,
  options: PPTXExportOptions
): Promise<void> {
  const pptxSlide = pres.addSlide({ masterName: getSlideLayout(slide.layout) });

  // Set background
  if (slide.backgroundImage) {
    try {
      if (slide.backgroundImage.startsWith('data:')) {
        pptxSlide.background = { data: slide.backgroundImage };
      } else {
        pptxSlide.background = { path: slide.backgroundImage };
      }
    } catch {
      // Fallback to color
      if (slide.backgroundColor) {
        pptxSlide.background = { color: normalizeColor(slide.backgroundColor) };
      }
    }
  } else if (slide.backgroundColor && slide.backgroundColor !== '#ffffff') {
    pptxSlide.background = { color: normalizeColor(slide.backgroundColor) };
  }

  // Add slide title if present
  if (slide.title) {
    pptxSlide.addText(slide.title, {
      x: 0.5,
      y: 0.3,
      w: SLIDE_WIDTH_INCHES - 1,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: '333333',
    });
  }

  // Process each element
  for (const element of slide.elements) {
    switch (element.type) {
      case 'text':
        addTextElement(pptxSlide, element);
        break;
      case 'image':
        await addImageElement(pptxSlide, element);
        break;
      case 'video':
        addVideoElement(pptxSlide, element);
        break;
      case 'audio':
        addAudioElement(pptxSlide, element);
        break;
      case 'flashcard':
        // Export flashcard as text box
        pptxSlide.addText(`[Flashcard: ${element.content}]`, {
          x: percentToInchesX(element.position.x),
          y: percentToInchesY(element.position.y),
          w: percentToInchesWidth(element.position.width),
          h: percentToInchesHeight(element.position.height),
          color: '4472C4',
          fill: { color: 'E8F0FE' },
          align: 'center',
          valign: 'middle',
        });
        break;
    }
  }

  // Add speaker notes if enabled
  if (options.includeNotes && slide.notes) {
    pptxSlide.addNotes(slide.notes);
  }
}

// Main export function
export async function exportLectureToPPTX(
  lecture: Lecture,
  slides: Slide[],
  options: PPTXExportOptions = {}
): Promise<void> {
  const pres = new pptxgen();

  // Set presentation metadata
  pres.title = options.title || lecture.title;
  pres.author = options.author || lecture.authorName;
  pres.subject = lecture.description || '';

  // Set slide size (standard 10x7.5 inches)
  pres.defineLayout({ name: 'CUSTOM', width: SLIDE_WIDTH_INCHES, height: SLIDE_HEIGHT_INCHES });
  pres.layout = 'CUSTOM';

  // Process each slide
  for (const slide of slides) {
    await processSlide(pres, slide, options);
  }

  // Generate and download
  const filename = `${lecture.title.replace(/[^a-zA-Z0-9\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/g, '_')}.pptx`;
  await pres.writeFile({ fileName: filename });
}

// Export as blob (for programmatic use)
export async function exportLectureToBlob(
  lecture: Lecture,
  slides: Slide[],
  options: PPTXExportOptions = {}
): Promise<Blob> {
  const pres = new pptxgen();

  pres.title = options.title || lecture.title;
  pres.author = options.author || lecture.authorName;
  pres.subject = lecture.description || '';

  pres.defineLayout({ name: 'CUSTOM', width: SLIDE_WIDTH_INCHES, height: SLIDE_HEIGHT_INCHES });
  pres.layout = 'CUSTOM';

  for (const slide of slides) {
    await processSlide(pres, slide, options);
  }

  const output = await pres.write({ outputType: 'blob' });
  return output as Blob;
}
