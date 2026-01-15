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
function parseColor(colorNode: any): string {
  if (!colorNode) return '#000000';

  // Solid fill with RGB
  const srgbClr = colorNode.srgbClr;
  if (srgbClr) {
    return '#' + (srgbClr['@_val'] || '000000');
  }

  // Scheme color reference
  const schemeClr = colorNode.schemeClr;
  if (schemeClr) {
    const schemeName = schemeClr['@_val'];
    return SCHEME_COLORS[schemeName] || '#000000';
  }

  return '#000000';
}

// Parse text run properties
function parseTextStyle(rPr: any): ParsedTextStyle {
  const style: ParsedTextStyle = {};

  if (!rPr) return style;

  // Font size (in hundredths of a point)
  if (rPr['@_sz']) {
    style.fontSize = rPr['@_sz'] / 100;
  }

  // Bold
  if (rPr['@_b'] === 1 || rPr['@_b'] === true) {
    style.bold = true;
  }

  // Italic
  if (rPr['@_i'] === 1 || rPr['@_i'] === true) {
    style.italic = true;
  }

  // Color
  const solidFill = rPr.solidFill;
  if (solidFill) {
    style.color = parseColor(solidFill);
  }

  // Font family
  const latin = rPr.latin;
  if (latin?.['@_typeface']) {
    style.fontFamily = latin['@_typeface'];
  }

  return style;
}

// Parse a text paragraph
function parseTextParagraph(p: any): { text: string; style: ParsedTextStyle } {
  const runs = ensureArray(p.r);
  let fullText = '';
  let mergedStyle: ParsedTextStyle = {};

  // Get paragraph properties for alignment
  const pPr = p.pPr;
  if (pPr?.['@_algn']) {
    const alignMap: Record<string, 'left' | 'center' | 'right' | 'justify'> = {
      'l': 'left',
      'ctr': 'center',
      'r': 'right',
      'just': 'justify',
    };
    mergedStyle.align = alignMap[pPr['@_algn']] || 'left';
  }

  for (const run of runs) {
    // Get text content
    const textNode = run.t;
    if (textNode !== undefined) {
      const text = typeof textNode === 'object' ? textNode['#text'] : textNode;
      if (text) fullText += text;
    }

    // Get run properties (use first non-empty style)
    const rPr = run.rPr;
    if (rPr && Object.keys(mergedStyle).length <= 1) {
      Object.assign(mergedStyle, parseTextStyle(rPr));
    }
  }

  // Handle line breaks
  if (p.br) {
    fullText += '\n';
  }

  return { text: fullText, style: mergedStyle };
}

// Parse a shape element (text box)
function parseShape(sp: any): ParsedElement | null {
  const spPr = sp.spPr;
  const txBody = sp.txBody;

  // Get position from spPr.xfrm (use defaults if not present)
  const xfrm = spPr?.xfrm;
  const off = xfrm?.off || {};
  const ext = xfrm?.ext || {};

  // Default position if not specified (centered, reasonable size)
  const position = {
    x: parseInt(off['@_x'] || '0', 10),
    y: parseInt(off['@_y'] || '0', 10),
    width: parseInt(ext['@_cx'] || '4572000', 10), // Default ~50% width
    height: parseInt(ext['@_cy'] || '914400', 10), // Default ~13% height
  };

  // Parse text content
  if (txBody) {
    const paragraphs = ensureArray(txBody.p);
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
function parsePicture(pic: any): ParsedElement | null {
  const blipFill = pic.blipFill;
  const spPr = pic.spPr;

  // Get image relationship ID - can be in blip[@_embed] or blip[@_r:embed]
  const blip = blipFill?.blip;
  const relId = blip?.['@_embed'] || blip?.['@_r:embed'];
  if (!relId) {
    console.log('Picture without relId:', Object.keys(blip || {}));
    return null;
  }

  console.log('Found picture with relId:', relId);

  // Get position (use defaults if not present)
  const xfrm = spPr?.xfrm;
  const off = xfrm?.off || {};
  const ext = xfrm?.ext || {};

  return {
    type: 'image',
    content: '', // Will be filled in with actual URL after media extraction
    position: {
      x: parseInt(off['@_x'] || '0', 10),
      y: parseInt(off['@_y'] || '0', 10),
      width: parseInt(ext['@_cx'] || '4572000', 10), // Default ~50% width
      height: parseInt(ext['@_cy'] || '3429000', 10), // Default ~50% height
    },
    relationshipId: relId,
  };
}

// Parse background
function parseBackground(bgNode: any): ParsedBackground | undefined {
  if (!bgNode) return undefined;

  const bgPr = bgNode.bgPr;
  if (!bgPr) return undefined;

  // Solid fill
  const solidFill = bgPr.solidFill;
  if (solidFill) {
    return {
      type: 'solid',
      color: parseColor(solidFill),
    };
  }

  // Image fill
  const blipFill = bgPr.blipFill;
  if (blipFill?.blip) {
    return {
      type: 'image',
      imageRelId: blipFill.blip['@_embed'],
    };
  }

  return undefined;
}

// Parse all shapes from a container (handles nested groups)
function parseAllShapes(container: any, elements: ParsedElement[]): void {
  if (!container) return;

  // Parse direct shapes (sp)
  const shapes = ensureArray(container.sp);
  for (const sp of shapes) {
    const element = parseShape(sp);
    if (element) {
      elements.push(element);
    }
  }

  // Parse pictures (pic)
  const pictures = ensureArray(container.pic);
  for (const pic of pictures) {
    const element = parsePicture(pic);
    if (element) {
      elements.push(element);
    }
  }

  // Parse group shapes (grpSp) - recursive
  const groups = ensureArray(container.grpSp);
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
  } catch (error) {
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
