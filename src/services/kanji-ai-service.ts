// AI service for auto-generating kanji info and examples using Groq

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface KanjiInfo {
  vocabulary: string;      // Hiragana reading
  sinoVietnamese: string;  // Âm Hán Việt (uppercase)
  meaning: string;         // Vietnamese meaning
}

export interface ExampleSentence {
  japanese: string;       // With furigana: 食(た)べます
  vietnamese: string;
}

export interface VocabularyMeaning {
  meaning: string;        // Vietnamese meaning
  sinoVietnamese?: string; // Optional sino-vietnamese
}

// Get API key from environment
function getApiKey(): string | null {
  return import.meta.env.VITE_GROQ_API_KEY || null;
}

// Generate kanji info (reading, sino-vietnamese, meaning)
export async function generateKanjiInfo(kanji: string): Promise<KanjiInfo | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY');
  }

  const prompt = `Cho chữ Kanji hoặc từ tiếng Nhật sau: "${kanji}"

Hãy trả về thông tin theo định dạng JSON chính xác như sau (không có markdown, chỉ JSON thuần):
{
  "vocabulary": "cách đọc bằng hiragana",
  "sinoVietnamese": "ÂM HÁN VIỆT (VIẾT HOA)",
  "meaning": "nghĩa tiếng Việt ngắn gọn"
}

Ví dụ với 食べる:
{
  "vocabulary": "たべる",
  "sinoVietnamese": "THỰC",
  "meaning": "Ăn"
}

Lưu ý:
- vocabulary: chỉ ghi hiragana, không ghi kanji
- sinoVietnamese: viết IN HOA, nếu có nhiều hán tự thì cách nhau bằng dấu cách
- meaning: nghĩa tiếng Việt ngắn gọn, dễ hiểu`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
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

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Không tìm thấy JSON trong phản hồi');
    }

    const parsed = JSON.parse(jsonMatch[0]) as KanjiInfo;
    return {
      vocabulary: parsed.vocabulary || '',
      sinoVietnamese: (parsed.sinoVietnamese || '').toUpperCase(),
      meaning: parsed.meaning || '',
    };
  } catch (error) {
    console.error('generateKanjiInfo error:', error);
    throw error;
  }
}

// Generate meaning from vocabulary (hiragana/katakana/kanji)
export async function generateMeaningFromVocabulary(vocabulary: string): Promise<VocabularyMeaning | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY');
  }

  const prompt = `Cho từ tiếng Nhật: "${vocabulary}"

Trả về nghĩa tiếng Việt theo JSON (không markdown):
{
  "meaning": "nghĩa tiếng Việt ngắn gọn",
  "sinoVietnamese": "ÂM HÁN VIỆT nếu có kanji (hoặc để trống)"
}

Ví dụ với たべる:
{
  "meaning": "Ăn",
  "sinoVietnamese": "THỰC"
}

Ví dụ với きれい:
{
  "meaning": "Đẹp, sạch sẽ",
  "sinoVietnamese": ""
}`;

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
        max_tokens: 150,
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Không nhận được phản hồi');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Không tìm thấy JSON');

    const parsed = JSON.parse(jsonMatch[0]) as VocabularyMeaning;
    return {
      meaning: parsed.meaning || '',
      sinoVietnamese: (parsed.sinoVietnamese || '').toUpperCase(),
    };
  } catch (error) {
    console.error('generateMeaningFromVocabulary error:', error);
    throw error;
  }
}

// Generate example sentence for a word
export async function generateExample(
  vocabulary: string,
  kanji?: string,
  meaning?: string,
  existingExamples?: string[]
): Promise<ExampleSentence | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Chưa cấu hình VITE_GROQ_API_KEY');
  }

  const word = kanji || vocabulary;
  const existingText = existingExamples?.length
    ? `\n\nCác ví dụ đã có (KHÔNG được lặp lại):\n${existingExamples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    : '';

  const prompt = `Tạo MỘT câu ví dụ tiếng Nhật sử dụng từ "${word}"${meaning ? ` (nghĩa: ${meaning})` : ''}.${existingText}

Yêu cầu:
- Câu ngắn gọn, dễ hiểu, phù hợp trình độ N5-N4
- Phải sử dụng từ "${word}" trong câu
- Kèm furigana cho kanji: viết theo format 漢字(かんじ) - furigana trong ngoặc đơn ngay sau kanji
- Kèm nghĩa tiếng Việt

Trả về JSON (không markdown):
{
  "japanese": "câu tiếng Nhật có furigana, ví dụ: 私(わたし)は食(た)べます",
  "vietnamese": "nghĩa tiếng Việt"
}

Ví dụ output:
{
  "japanese": "毎日(まいにち)日本語(にほんご)を勉強(べんきょう)します。",
  "vietnamese": "Tôi học tiếng Nhật mỗi ngày."
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9, // Higher temperature for variety
        max_tokens: 200,
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

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Không tìm thấy JSON trong phản hồi');
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExampleSentence;
    return {
      japanese: parsed.japanese || '',
      vietnamese: parsed.vietnamese || '',
    };
  } catch (error) {
    console.error('generateExample error:', error);
    throw error;
  }
}
