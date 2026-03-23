// Claude API service for AI Tutor chat
// Uses configurable proxy URL since Anthropic API doesn't support browser CORS
// Set VITE_ANTHROPIC_PROXY_URL in .env to your proxy endpoint

const PROXY_URL = import.meta.env.VITE_ANTHROPIC_PROXY_URL || '/api/claude';
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const MODEL = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
}

// System prompt for Japanese language tutor
export function buildTutorSystemPrompt(userLevel?: string): string {
  const level = userLevel || 'N5';
  return `Bạn là Shinko AI - gia sư tiếng Nhật thân thiện và kiên nhẫn.

## Vai trò
- Giúp người Việt học tiếng Nhật
- Trả lời bằng tiếng Việt, kèm tiếng Nhật khi cần
- Giải thích ngữ pháp, từ vựng, kanji rõ ràng
- Sửa lỗi nhẹ nhàng, khuyến khích người học

## Cấp độ người học: ${level}
- Điều chỉnh độ khó phù hợp cấp ${level}
- Dùng ví dụ từ vựng/ngữ pháp phù hợp level
- Với N5/N4: giải thích đơn giản, ít thuật ngữ
- Với N3+: có thể dùng tiếng Nhật nhiều hơn

## Quy tắc
- Trả lời ngắn gọn (2-4 câu), không dài dòng
- Khi viết tiếng Nhật, thêm furigana: [漢字|かんじ]
- Luôn cho ví dụ thực tế khi giải thích
- Nếu người dùng viết tiếng Nhật, nhận xét và sửa lỗi
- Kết thúc bằng câu hỏi hoặc gợi ý để tiếp tục hội thoại
- Không bao giờ nói "Tôi là AI" hay "Tôi không thể"`;
}

// Call Claude API via proxy
export async function sendMessage(
  messages: ClaudeMessage[],
  systemPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  if (!API_KEY && !PROXY_URL.startsWith('/')) {
    throw new Error('Chưa cấu hình API key. Vui lòng thêm VITE_ANTHROPIC_API_KEY vào file .env');
  }

  const { claudeLimiter } = await import('../utils/rate-limiter');
  if (!claudeLimiter.tryRequest()) {
    throw new Error('Bạn gửi tin nhắn quá nhanh. Vui lòng đợi một chút.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If calling Anthropic directly (via proxy), include API key and version
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
    headers['anthropic-version'] = '2023-06-01';
    // Allow browser CORS via proxy
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  }

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data: ClaudeResponse = await response.json();
  return data.content?.[0]?.text || 'Xin lỗi, tôi không hiểu. Bạn có thể nói lại không?';
}
