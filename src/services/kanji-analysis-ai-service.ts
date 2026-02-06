// AI service for generating per-character Kanji analysis using Groq

import type { KanjiCharacterAnalysis } from '../types/flashcard';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getApiKey(): string | null {
  return import.meta.env.VITE_GROQ_API_KEY || null;
}

// Extract individual Kanji characters from text
export function extractKanjiCharacters(text: string): string[] {
  const matches = text.match(/[一-龯々]/g);
  return matches ? [...new Set(matches)] : [];
}

// Generate analysis for multiple Kanji characters in a single AI call
export async function generateKanjiCharacterAnalysis(
  characters: string[]
): Promise<KanjiCharacterAnalysis[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY');
  }

  if (characters.length === 0) return [];

  const charList = characters.join(', ');
  const prompt = `Phân tích các chữ Kanji sau: ${charList}

Trả về JSON array (không markdown, chỉ JSON thuần) với mỗi phần tử có cấu trúc:
{
  "character": "漢字",
  "onYomi": ["âm ON bằng katakana"],
  "kunYomi": ["âm KUN bằng hiragana, dấu chấm phân cách phần okurigana"],
  "sinoVietnamese": "ÂM HÁN VIỆT VIẾT HOA",
  "mnemonic": "Mẹo ghi nhớ ngắn gọn bằng tiếng Việt",
  "sampleWords": [
    { "word": "từ mẫu", "reading": "cách đọc", "meaning": "nghĩa tiếng Việt" }
  ]
}

Ví dụ với 食:
{
  "character": "食",
  "onYomi": ["ショク", "ジキ"],
  "kunYomi": ["た.べる", "く.う"],
  "sinoVietnamese": "THỰC",
  "mnemonic": "Hình người ngồi ăn cơm trên bàn - THỰC (ăn)",
  "sampleWords": [
    { "word": "食事", "reading": "しょくじ", "meaning": "Bữa ăn" },
    { "word": "食べ物", "reading": "たべもの", "meaning": "Đồ ăn" }
  ]
}

Lưu ý:
- onYomi: viết bằng katakana
- kunYomi: viết bằng hiragana, dùng dấu chấm (.) để phân cách phần okurigana
- sinoVietnamese: viết IN HOA
- mnemonic: ngắn gọn, dễ nhớ, bằng tiếng Việt
- sampleWords: luôn luôn 3 từ phổ biến nhất

Trả về JSON array:`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Không nhận được phản hồi');
    }

    // Parse JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Không tìm thấy JSON array trong phản hồi');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      character: string;
      onYomi: string[];
      kunYomi: string[];
      sinoVietnamese: string;
      mnemonic: string;
      sampleWords: Array<{ word: string; reading: string; meaning: string }>;
    }>;

    const now = new Date().toISOString();
    return parsed.map((item) => ({
      id: item.character,
      character: item.character,
      onYomi: item.onYomi || [],
      kunYomi: item.kunYomi || [],
      sinoVietnamese: (item.sinoVietnamese || '').toUpperCase(),
      mnemonic: item.mnemonic || '',
      sampleWords: (item.sampleWords || []).map((sw) => ({
        word: sw.word || '',
        reading: sw.reading || '',
        meaning: sw.meaning || '',
      })),
      createdAt: now,
    }));
  } catch (error) {
    console.error('generateKanjiCharacterAnalysis error:', error);
    throw error;
  }
}
