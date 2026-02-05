// Response parser for Groq API responses

import type { GeminiKaiwaResponse, SuggestedAnswer, VocabularyHint, AnswerTemplate } from '../../types/kaiwa';

export function parseResponse(text: string): GeminiKaiwaResponse {
  const lines = text.split('\n');
  let mainText = '';
  const suggestions: SuggestedAnswer[] = [];
  const hints: VocabularyHint[] = [];
  const questions: string[] = [];
  let templatePattern = '';
  let section: 'response' | 'template' | 'hints' | 'suggestions' | 'questions' = 'response';

  for (const line of lines) {
    const trimmed = line.trim();
    const upperTrimmed = trimmed.toUpperCase();

    // Section detection with new format (---SECTION---)
    if (upperTrimmed.includes('---RESPONSE---') || upperTrimmed.includes('RESPONSE:')) {
      section = 'response';
      continue;
    }
    if (upperTrimmed.includes('---TEMPLATE---') || upperTrimmed.includes('TEMPLATE:')) {
      section = 'template';
      continue;
    }
    if (upperTrimmed.includes('---HINTS---') || upperTrimmed.includes('HINTS:')) {
      section = 'hints';
      continue;
    }
    if (upperTrimmed.includes('---SUGGESTIONS---') || upperTrimmed.includes('SUGGESTIONS:')) {
      section = 'suggestions';
      continue;
    }
    if (upperTrimmed.includes('---QUESTIONS---') || upperTrimmed.includes('QUESTIONS:')) {
      section = 'questions';
      continue;
    }

    // Skip empty lines and section markers
    if (!trimmed || trimmed.startsWith('---')) continue;

    // Parse content based on section
    if (section === 'response') {
      // Skip instruction-like lines
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue;
      mainText += (mainText ? '\n' : '') + trimmed;
    } else if (section === 'template') {
      // Extract pattern - could be direct or with "pattern:" prefix
      // Allow furigana format [kanji|reading] which starts with [
      if (trimmed.toLowerCase().startsWith('pattern:')) {
        templatePattern = trimmed.substring(8).trim();
      } else if (!trimmed.startsWith('-')) {
        // Accept any pattern including those with furigana [kanji|reading]
        templatePattern = trimmed;
      }
    } else if (section === 'hints') {
      // Check for group header (①, ②, ③, etc.)
      if (/^[①②③④⑤]/.test(trimmed)) {
        // This is a group header, skip it (or could store for labeling)
        continue;
      }
      // Parse "- word = meaning" format
      if (trimmed.startsWith('-')) {
        const hintText = trimmed.substring(1).trim();
        const eqIndex = hintText.indexOf('=');
        if (eqIndex > 0) {
          const word = hintText.substring(0, eqIndex).trim();
          const meaning = hintText.substring(eqIndex + 1).trim();
          if (word && meaning) {
            hints.push({ word, meaning });
          }
        }
      }
    } else if (section === 'suggestions' && trimmed.startsWith('-')) {
      const suggestionText = trimmed.substring(1).trim();
      if (suggestionText && !suggestionText.startsWith('[')) {
        suggestions.push({
          id: `sug-${Date.now()}-${suggestions.length}`,
          text: suggestionText,
        });
      }
    } else if (section === 'questions' && trimmed.startsWith('-')) {
      // Parse "- question" format - allow furigana [kanji|reading]
      const questionText = trimmed.substring(1).trim();
      if (questionText) {
        questions.push(questionText);
      }
    }
  }

  // Build answer template if pattern exists
  let answerTemplate: AnswerTemplate | undefined;
  if (templatePattern) {
    answerTemplate = {
      pattern: templatePattern,
      hints: hints,
    };
  }

  return {
    text: mainText.trim(),
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    answerTemplate,
    suggestedQuestions: questions.length > 0 ? questions : undefined,
  };
}
