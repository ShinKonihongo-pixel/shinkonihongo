// Dialogue prompt builder for speaking practice

import type { JLPTLevel } from '../types/kaiwa';
import type { SpeakingTopicId } from '../types/speaking-practice';
import { SPEAKING_TOPIC_PROMPTS, SPEAKING_LINES_PER_LEVEL, getSpeakingTopicById } from '../constants/speaking-topics';

const LEVEL_GUIDANCE: Record<string, string> = {
  N5: `JLPT N5 (Beginner):
- Use ONLY basic vocabulary and simple sentence patterns
- Use です/ます form exclusively
- Keep sentences SHORT (5-10 words max)
- Common verbs: いく、くる、たべる、のむ、みる、する
- Basic particles: は、が、を、に、で、へ`,

  N4: `JLPT N4 (Elementary):
- Use N4/N5 vocabulary
- Use て-form、た-form、～たい
- Can use basic compound sentences
- Keep sentences moderate length (8-15 words)`,

  N3: `JLPT N3 (Intermediate):
- Use everyday vocabulary including some idiomatic expressions
- Can use conditional forms, passive, causative
- Natural conversational flow`,

  N2: `JLPT N2 (Upper-Intermediate):
- Use varied vocabulary with nuance
- Complex grammar patterns allowed
- Natural, fluid conversation`,

  N1: `JLPT N1 (Advanced):
- Full range of vocabulary including business/formal
- All grammar patterns including keigo
- Native-like natural expression`,
};

export function buildDialoguePrompt(topicId: SpeakingTopicId, level: JLPTLevel): string {
  const topic = getSpeakingTopicById(topicId);
  const topicPrompt = SPEAKING_TOPIC_PROMPTS[topicId];
  const lineCount = SPEAKING_LINES_PER_LEVEL[level];
  const levelGuidance = LEVEL_GUIDANCE[level];

  return `You are a Japanese language teacher creating a speaking practice dialogue.

TOPIC: ${topic?.name} (${topic?.nameVi})
${topicPrompt}

LEVEL REQUIREMENTS:
${levelGuidance}

DIALOGUE REQUIREMENTS:
- Create exactly ${lineCount} dialogue lines (alternating between AI and User)
- AI speaks first (as shop staff, waiter, etc.)
- User responds (as customer, patient, etc.)
- Each line should be NATURAL and PRACTICAL
- Add furigana for ALL kanji: [漢字|かんじ] format
- Lines should build on each other logically

RESPONSE FORMAT (JSON only, no markdown):
{
  "title": "[Japanese title with furigana]",
  "titleVi": "[Vietnamese title]",
  "situation": "[Brief situation description in Vietnamese]",
  "lines": [
    {
      "role": "ai",
      "text": "[Japanese with furigana [kanji|reading]]",
      "translation": "[Vietnamese translation]"
    },
    {
      "role": "user",
      "text": "[Japanese with furigana]",
      "translation": "[Vietnamese translation]"
    }
  ],
  "vocabulary": [
    {
      "word": "[word]",
      "reading": "[reading if kanji]",
      "meaning": "[Vietnamese meaning]"
    }
  ]
}

CRITICAL RULES:
- NO ROMAJI anywhere - use hiragana/katakana/kanji only
- Foreign words in katakana
- EVERY kanji must have furigana: [漢字|かんじ]
- Vocabulary should include 3-5 key words from the dialogue
- Make the dialogue REALISTIC and PRACTICAL for real-life situations`;
}
