// Tests for Groq advanced response parser

import { describe, it, expect } from 'vitest';
import { parseAdvancedResponse } from '../groq-advanced-parser';

describe('parseAdvancedResponse', () => {
  it('parses complete response with all sections', () => {
    const text = `---RESPONSE---
こんにちは！今日は[映画|えいが]について話しましょう。

---TEMPLATE---
①が[好|す]きです。

---HINTS---
① ジャンル
- アクション = hành động
- コメディ = hài

---SUGGESTIONS---
- アクションが好きです。
- コメディを見ます。

---QUESTIONS---
- どんな映画が好きですか？
- いつ見ますか？`;

    const result = parseAdvancedResponse(text);

    expect(result.text).toContain('こんにちは');
    expect(result.text).toContain('[映画|えいが]');
    expect(result.answerTemplate).toBeDefined();
    expect(result.answerTemplate?.pattern).toContain('①');
    expect(result.answerTemplate?.hints).toHaveLength(2);
    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestedQuestions).toHaveLength(2);
  });

  it('handles response with only text', () => {
    const result = parseAdvancedResponse('Hello world');
    expect(result.text).toBe('Hello world');
    expect(result.suggestions).toBeUndefined();
    expect(result.answerTemplate).toBeUndefined();
  });

  it('handles empty input', () => {
    const result = parseAdvancedResponse('');
    expect(result.text).toBe('');
  });

  it('skips lines starting with --- (separators)', () => {
    const text = `---RESPONSE---
Line 1
---
Line 2`;
    const result = parseAdvancedResponse(text);
    expect(result.text).toBe('Line 1\nLine 2');
  });

  it('parses hints with word = meaning format', () => {
    const text = `---TEMPLATE---
①が好きです。

---HINTS---
- [映画|えいが] = phim
- [音楽|おんがく] = âm nhạc`;

    const result = parseAdvancedResponse(text);
    expect(result.answerTemplate).toBeDefined();
    expect(result.answerTemplate?.hints).toHaveLength(2);
    expect(result.answerTemplate?.hints[0].word).toBe('[映画|えいが]');
    expect(result.answerTemplate?.hints[0].meaning).toBe('phim');
  });

  it('generates unique suggestion IDs', () => {
    const text = `---SUGGESTIONS---
- Answer 1
- Answer 2
- Answer 3`;

    const result = parseAdvancedResponse(text);
    const ids = result.suggestions!.map(s => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });
});
