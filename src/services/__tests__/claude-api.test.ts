import { describe, it, expect } from 'vitest';
import { buildTutorSystemPrompt } from '../claude-api';

describe('Claude API Service', () => {
  it('builds system prompt with default N5 level', () => {
    const prompt = buildTutorSystemPrompt();
    expect(prompt).toContain('N5');
    expect(prompt).toContain('Shinko AI');
  });

  it('builds system prompt with specified level', () => {
    const prompt = buildTutorSystemPrompt('N3');
    expect(prompt).toContain('N3');
  });

  it('prompt includes Vietnamese language instruction', () => {
    const prompt = buildTutorSystemPrompt('N5');
    expect(prompt).toContain('tiếng Việt');
  });

  it('prompt includes furigana format instruction', () => {
    const prompt = buildTutorSystemPrompt('N5');
    expect(prompt).toContain('[漢字|かんじ]');
  });
});
