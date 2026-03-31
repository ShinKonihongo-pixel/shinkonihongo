// Shared Groq API fetch helper with built-in rate limiting
// All Groq hooks should use this instead of raw fetch()

import { GROQ_API_URL, MODEL } from './constants';
import { groqLimiter } from '../../utils/rate-limiter';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqFetchOptions {
  messages: GroqMessage[];
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/** Call Groq API with rate limiting. Throws on error. */
export async function groqFetch(options: GroqFetchOptions): Promise<string> {
  if (!groqLimiter.tryRequest()) {
    const retryMs = groqLimiter.retryAfterMs();
    throw new Error(`Vượt giới hạn tần suất. Thử lại sau ${Math.ceil(retryMs / 1000)} giây`);
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.apiKey !== 'proxy' && { 'Authorization': `Bearer ${options.apiKey}` }),
    },
    body: JSON.stringify({
      model: options.model || MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 800,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
