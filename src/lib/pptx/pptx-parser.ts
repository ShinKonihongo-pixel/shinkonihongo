// PPTX Parser - Extract content from PowerPoint XML using fast-xml-parser

import { XMLParser } from 'fast-xml-parser';
import type { ParsedSlide, ParsedElement, ParsedTextStyle, ParsedBackground } from '../../types/pptx';
import { SCHEME_COLORS } from './pptx-constants';

// XML Parser configuration
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  removeNSPrefix: true,
};

const parser = new XMLParser(parserOptions);

// Ensure array format (PPTX XML can have single or multiple elements)
function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// Parse color from PPTX XML
function parseColor(colorNode: unknown): string {
  if (!colorNode || typeof colorNode !== 'object') return '#000000';

  // Solid fill with RGB
  const srgbClr = (colorNode as Record<string, unknown>).srgbClr;
  if (srgbClr && typeof srgbClr === 'object') {
    return '#' + ((srgbClr as Record<string, unknown>)['@_val'] || '000000');
  }

  // Scheme color reference
  const schemeClr = (colorNode as Record<string, unknown>).schemeClr;
  if (schemeClr && typeof schemeClr === 'object') {
    const schemeName = (schemeClr as Record<string, unknown>)['@_val'] as string;
    return SCHEME_COLORS[schemeName] || '#000000';
  }

  return '#000000';
}

// Parse text run properties
function parseTextStyle(rPr: unknown): ParsedTextStyle {
  const style: ParsedTextStyle = {};

  if (!rPr || typeof rPr !== 'object') return style;

  const rPrObj = rPr as Record<string, unknown>;

  // Font size (in hundredths of a point)
  if (typeof rPrObj['@_sz'] === 'number') {
    style.fontSize = rPrObj['@_sz'] / 100;
  }

  // Bold
  if (rPrObj['@_b'] === 1 || rPrObj['@_b'] === true) {
    style.bold = true;
  }

  // Italic
  if (rPrObj['@_i'] === 1 || rPrObj['@_i'] === true) {
    style.italic = true;
  }

  // Color
  const solidFill = rPrObj.solidFill;
  if (solidFill) {
    style.color = parseColor(solidFill);
  }

  // Font family
  const latin = rPrObj.latin;
  if (latin && typeof latin === 'object' && '@_typeface' in latin) {
    style.fontFamily = (latin as Record<string, unknown>)['@_typeface'] as string;
  }

  return style;
}

// Parse a text paragraph
function parseTextParagraph(p: unknown): { text: string; style: ParsedTextStyle } {
  if (!p || typeof p !== 'object') return { text: '', style: {} };
  const pObj = p as Record<string, unknown>;
  const runs = ensureArray(pObj.r);
  let fullText = '';
  const mergedStyle: ParsedTextStyle = {};

  // Get paragraph properties for alignment
  const pPr = pObj.pPr;
  if (pPr && typeof pPr === 'object' && '@_algn' in pPr) {
    const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
      'l': 'left',
      'ctr': 'center',
      'r': 'right',
      'just': 'justify',
    };
    const alignValue = (pPr as Record<string, unknown>)['@_algn'] as string;
    mergedStyle.align = alignMap[alignValue] || 'left';
  }

  for (const run of runs) {
    if (!run || typeof run !== 'object') continue;
    const runObj = run as Record<string, unknown>;

    // Get text content
    const textNode = runObj.t;
    if (textNode !== undefined) {
      const text = typeof textNode === 'object' ? (textNode as Record<string, unknown>)['#text'] : textNode;
      if (text) fullText += String(text);
    }

    // Get run properties (use first non-empty style)
    const rPr = runObj.rPr;
    if (rPr && Object.keys(mergedStyle).length <= 1) {
      Object.assign(mergedStyle, parseTextStyle(rPr));
    }
  }

  // Handle line breaks
  if (pObj.br) {
    fullText += '\n';
  }

  return { text: fullText, style: mergedStyle };
}

// Parse a shape element (text box)
function parseShape(sp: unknown): ParsedElement | null {
  if (!sp || typeof sp !== 'object') return null;
  const spObj = sp as Record<string, unknown>;
  const spPr = spObj.spPr;
  const txBody = spObj.txBody;

  // Get position from spPr.xfrm (use defaults if not present)
  const xfrm = spPr && typeof spPr === 'object' ? (spPr as Record<string, unknown>).xfrm : undefined;
  const off = (xfrm && typeof xfrm === 'object' ? (xfrm as Record<string, unknown>).off : undefined) as Record<string, unknown> | undefined || {};
  const ext = (xfrm && typeof xfrm === 'object' ? (xfrm as Record<string, unknown>).ext : undefined) as Record<string, unknown> | undefined || {};

  // Default position if not specified (centered, reasonable size)
  const position = {
    x: parseInt(String(off['@_x'] || '0'), 10),
    y: parseInt(String(off['@_y'] || '0'), 10),
    width: parseInt(String(ext['@_cx'] || '4572000'), 10), // Default ~50% width
    height: parseInt(String(ext['@_cy'] || '914400'), 10), // Default ~13% height
  };

  // Parse text content
  if (txBody && typeof txBody === 'object') {
    const paragraphs = ensureArray((txBody as Record<string, unknown>).p);
    let fullText = '';
    let textStyle: ParsedTextStyle = {};

    for (let i = 0; i < paragraphs.length; i++) {
      const { text, style } = parseTextParagraph(paragraphs[i]);
      fullText += text;
      if (i < paragraphs.length - 1 && text) {
        fullText += '\n';
      }
      // Use first paragraph's style
      if (i === 0) {
        textStyle = style;
      }
    }

    if (fullText.trim()) {
      console.log('Parsed text element:', fullText.substring(0, 50));
      return {
        type: 'text',
        content: fullText.trim(),
        position,
        style: textStyle,
      };
    }
  }

  return null;
}

// Parse a picture element
function parsePicture(pic: unknown): ParsedElement | null {
  if (!pic || typeof pic !== 'object') return null;
  const picObj = pic as Record<string, unknown>;
  const blipFill = picObj.blipFill;
  const spPr = picObj.spPr;

  // Get image relationship ID - can be in blip[@_embed] or blip[@_r:embed]
  const blip = blipFill && typeof blipFill === 'object' ? (blipFill as Record<string, unknown>).blip : undefined;
  const blipObj = blip && typeof blip === 'object' ? blip as Record<string, unknown> : undefined;
  const relId = blipObj?.['@_embed'] || blipObj?.['@_r:embed'];
  if (!relId) {
    console.log('Picture without relId:', Object.keys(blipObj || {}));
    return null;
  }

  console.log('Found picture with relId:', relId);

  // Get position (use defaults if not present)
  const xfrm = spPr && typeof spPr === 'object' ? (spPr as Record<string, unknown>).xfrm : undefined;
  const off = (xfrm && typeof xfrm === 'object' ? (xfrm as Record<string, unknown>).off : undefined) as Record<string, unknown> | undefined || {};
  const ext = (xfrm && typeof xfrm === 'object' ? (xfrm as Record<string, unknown>).ext : undefined) as Record<string, unknown> | undefined || {};

  return {
    type: 'image',
    content: '', // Will be filled in with actual URL after media extraction
    position: {
      x: parseInt(String(off['@_x'] || '0'), 10),
      y: parseInt(String(off['@_y'] || '0'), 10),
      width: parseInt(String(ext['@_cx'] || '4572000'), 10), // Default ~50% width
      height: parseInt(String(ext['@_cy'] || '3429000'), 10), // Default ~50% height
    },
    relationshipId: String(relId),
  };
}

// Parse background
function parseBackground(bgNode: unknown): ParsedBackground | undefined {
  if (!bgNode || typeof bgNode !== 'object') return undefined;

  const bgPr = (bgNode as Record<string, unknown>).bgPr;
  if (!bgPr || typeof bgPr !== 'object') return undefined;

  const bgPrObj = bgPr as Record<string, unknown>;

  // Solid fill
  const solidFill = bgPrObj.solidFill;
  if (solidFill) {
    return {
      type: 'solid',
      color: parseColor(solidFill),
    };
  }

  // Image fill
  const blipFill = bgPrObj.blipFill;
  if (blipFill && typeof blipFill === 'object') {
    const blip = (blipFill as Record<string, unknown>).blip;
    if (blip && typeof blip === 'object') {
      return {
        type: 'image',
        imageRelId: (blip as Record<string, unknown>)['@_embed'] as string,
      };
    }
  }

  return undefined;
}

// Parse all shapes from a container (handles nested groups)
function parseAllShapes(container: unknown, elements: ParsedElement[]): void {
  if (!container || typeof container !== 'object') return;
  const containerObj = container as Record<string, unknown>;

  // Parse direct shapes (sp)
  const shapes = ensureArray(containerObj.sp);
  for (const sp of shapes) {
    const element = parseShape(sp);
    if (element) {
      elements.push(element);
    }
  }

  // Parse pictures (pic)
  const pictures = ensureArray(containerObj.pic);
  for (const pic of pictures) {
    const element = parsePicture(pic);
    if (element) {
      elements.push(element);
    }
  }

  // Parse group shapes (grpSp) - recursive
  const groups = ensureArray(containerObj.grpSp);
  for (const grp of groups) {
    parseAllShapes(grp, elements);
  }

  // Parse content part (cxnSp - connector shapes, usually lines)
  // We skip connectors for now as they're just lines
  // const connectors = ensureArray(container.cxnSp);
}

// Parse slide XML content
export function parseSlideXml(slideXml: string): ParsedSlide {
  const result: ParsedSlide = {
    elements: [],
  };

  try {
    const parsed = parser.parse(slideXml);
    console.log('Parsed slide structure:', Object.keys(parsed));

    const sld = parsed.sld;
    if (!sld) {
      console.warn('No sld element found in parsed XML');
      return result;
    }

    console.log('sld structure:', Object.keys(sld));

    // Parse background
    result.background = parseBackground(sld.cSld?.bg);

    // Parse shape tree
    const spTree = sld.cSld?.spTree;
    if (!spTree) {
      console.warn('No spTree found in slide');
      return result;
    }

    console.log('spTree structure:', Object.keys(spTree));

    // Parse all shapes recursively (including groups)
    parseAllShapes(spTree, result.elements);
    console.log('Elements found:', result.elements.length);

    // Try to extract title from first text element
    const firstText = result.elements.find(e => e.type === 'text');
    if (firstText && firstText.content.length < 100) {
      result.title = firstText.content.split('\n')[0];
    }

  } catch (error) {
    console.error('Failed to parse slide XML:', error);
  }

  return result;
}

// Parse slide relationships to get media mappings
export function parseRelationships(relsXml: string): Map<string, string> {
  const relMap = new Map<string, string>();

  try {
    const parsed = parser.parse(relsXml);
    const relationships = parsed.Relationships;
    if (!relationships) return relMap;

    const rels = ensureArray(relationships.Relationship);
    for (const rel of rels) {
      const id = rel['@_Id'];
      const target = rel['@_Target'];
      if (id && target) {
        relMap.set(id, target);
      }
    }
  } catch (error) {
    console.error('Failed to parse relationships:', error);
  }

  return relMap;
}

// Parse slide notes
export function parseNotesXml(notesXml: string): string {
  try {
    const parsed = parser.parse(notesXml);
    const notes = parsed.notes;
    if (!notes) return '';

    const txBody = notes.cSld?.spTree?.sp?.[1]?.txBody;
    if (!txBody) return '';

    const paragraphs = ensureArray(txBody.p);
    let notesText = '';

    for (const p of paragraphs) {
      const { text } = parseTextParagraph(p);
      if (text) notesText += text + '\n';
    }

    return notesText.trim();
  } catch (_error) {
    return '';
  }
}

// Parse presentation.xml to get slide order
export function parsePresentationXml(presentationXml: string): string[] {
  const slideOrder: string[] = [];

  try {
    const parsed = parser.parse(presentationXml);
    const presentation = parsed.presentation;
    if (!presentation) return slideOrder;

    const sldIdLst = presentation.sldIdLst;
    if (!sldIdLst) return slideOrder;

    const sldIds = ensureArray(sldIdLst.sldId);
    for (const sldId of sldIds) {
      const rId = sldId['@_id'];
      if (rId) {
        slideOrder.push(rId.toString());
      }
    }
  } catch (error) {
    console.error('Failed to parse presentation.xml:', error);
  }

  return slideOrder;
}
