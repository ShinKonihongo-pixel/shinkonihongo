import { describe, it, expect } from 'vitest';
import { scorePronunciation } from '../use-speech-recognition';

describe('scorePronunciation', () => {
  it('exact match gives 95-100 score', () => {
    const result = scorePronunciation('おはようございます', 'おはようございます');
    expect(result.score).toBeGreaterThanOrEqual(95);
  });

  it('completely different gives low score', () => {
    const result = scorePronunciation('おはようございます', 'さようなら');
    expect(result.score).toBeLessThan(50);
  });

  it('partial match gives medium score', () => {
    const result = scorePronunciation('ありがとうございます', 'ありがとうございました');
    expect(result.score).toBeGreaterThan(50);
    expect(result.score).toBeLessThan(100);
  });

  it('returns feedback string', () => {
    const result = scorePronunciation('テスト', 'テスト');
    expect(result.feedback).toBeTruthy();
  });

  it('uses best match from alternatives', () => {
    const result = scorePronunciation(
      'おはよう',
      'おはよ',
      ['おはよう', 'お早う'],
    );
    expect(result.score).toBe(100); // exact match in alternatives
    expect(result.bestMatch).toBe('おはよう');
  });

  it('ignores punctuation in comparison', () => {
    const result = scorePronunciation('これはいくらですか', 'これはいくらですか。');
    expect(result.score).toBe(100);
  });

  it('handles empty spoken text', () => {
    const result = scorePronunciation('おはよう', '');
    expect(result.score).toBe(0);
  });

  it('handles empty expected text', () => {
    const result = scorePronunciation('', 'おはよう');
    expect(result.score).toBe(0);
  });
});
