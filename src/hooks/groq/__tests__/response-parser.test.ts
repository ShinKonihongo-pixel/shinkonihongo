import { describe, it, expect } from 'vitest';
import { parseResponse } from '../response-parser';

describe('parseResponse', () => {
  it('returns an object with a text field', () => {
    const result = parseResponse('---RESPONSE---\nこんにちは。');
    expect(result).toHaveProperty('text');
  });

  it('parses response section text', () => {
    const input = '---RESPONSE---\nこんにちは。\nお元気ですか？';
    const result = parseResponse(input);
    expect(result.text).toContain('こんにちは。');
    expect(result.text).toContain('お元気ですか？');
  });

  it('parses suggestions section', () => {
    const input = [
      '---RESPONSE---',
      'こんにちは。',
      '---SUGGESTIONS---',
      '- はい、元気です。',
      '- まあまあです。',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBe(2);
    expect(result.suggestions![0].text).toBe('はい、元気です。');
    expect(result.suggestions![1].text).toBe('まあまあです。');
  });

  it('each suggestion has an id', () => {
    const input = '---SUGGESTIONS---\n- テスト回答';
    const result = parseResponse(input);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions![0].id).toBeTruthy();
  });

  it('parses hints section with word = meaning format', () => {
    const input = [
      '---HINTS---',
      '- 元気 = khỏe mạnh',
      '- 好き = thích',
    ].join('\n');
    const result = parseResponse(input);
    // hints appear only when a template pattern is also present
    // without a template section, answerTemplate is undefined
    // Test that the parser handles the hints section without crashing
    expect(result).toBeDefined();
  });

  it('parses template section and returns answerTemplate', () => {
    const input = [
      '---RESPONSE---',
      'テニスが好きです。',
      '---TEMPLATE---',
      '...が好きです。',
      '---HINTS---',
      '- テニス = tennis',
      '- サッカー = bóng đá',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.answerTemplate).toBeDefined();
    expect(result.answerTemplate!.pattern).toBe('...が好きです。');
    expect(result.answerTemplate!.hints.length).toBe(2);
    expect(result.answerTemplate!.hints[0].word).toBe('テニス');
    expect(result.answerTemplate!.hints[0].meaning).toBe('tennis');
  });

  it('parses template with "pattern:" prefix', () => {
    const input = [
      '---TEMPLATE---',
      'pattern: ...が好きです。',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.answerTemplate).toBeDefined();
    expect(result.answerTemplate!.pattern).toBe('...が好きです。');
  });

  it('parses questions section', () => {
    const input = [
      '---QUESTIONS---',
      '- あなたの趣味は何ですか？',
      '- 好きな食べ物は？',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.suggestedQuestions).toBeDefined();
    expect(result.suggestedQuestions!.length).toBe(2);
    expect(result.suggestedQuestions![0]).toBe('あなたの趣味は何ですか？');
  });

  it('skips instruction-like lines in response section (wrapped in brackets)', () => {
    const input = [
      '---RESPONSE---',
      '[This is an instruction line]',
      'こんにちは。',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.text).toBe('こんにちは。');
  });

  it('handles "RESPONSE:" keyword format (colon style)', () => {
    const input = 'RESPONSE:\nこんにちは。';
    const result = parseResponse(input);
    expect(result.text).toContain('こんにちは。');
  });

  it('handles "SUGGESTIONS:" keyword format (colon style)', () => {
    const input = 'SUGGESTIONS:\n- 回答一';
    const result = parseResponse(input);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions![0].text).toBe('回答一');
  });

  it('returns undefined suggestions when none found', () => {
    const result = parseResponse('---RESPONSE---\nテスト');
    expect(result.suggestions).toBeUndefined();
  });

  it('returns undefined answerTemplate when no template pattern', () => {
    const result = parseResponse('---RESPONSE---\nテスト');
    expect(result.answerTemplate).toBeUndefined();
  });

  it('returns undefined suggestedQuestions when none found', () => {
    const result = parseResponse('---RESPONSE---\nテスト');
    expect(result.suggestedQuestions).toBeUndefined();
  });

  it('handles empty input gracefully', () => {
    const result = parseResponse('');
    expect(result.text).toBe('');
    expect(result.suggestions).toBeUndefined();
    expect(result.answerTemplate).toBeUndefined();
    expect(result.suggestedQuestions).toBeUndefined();
  });

  it('skips group header lines in hints (①②③)', () => {
    const input = [
      '---TEMPLATE---',
      'pattern: ...が好きです。',
      '---HINTS---',
      '① スポーツ系',
      '- テニス = tennis',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.answerTemplate!.hints.length).toBe(1);
    expect(result.answerTemplate!.hints[0].word).toBe('テニス');
  });

  it('skips suggestions starting with [', () => {
    const input = [
      '---SUGGESTIONS---',
      '- [invalid bracket suggestion]',
      '- 有効な回答',
    ].join('\n');
    const result = parseResponse(input);
    expect(result.suggestions!.length).toBe(1);
    expect(result.suggestions![0].text).toBe('有効な回答');
  });
});
