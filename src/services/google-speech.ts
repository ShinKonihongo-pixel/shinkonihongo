// Google Cloud Speech-to-Text API service
// Uses REST API with WebM/Opus audio from MediaRecorder
// SECURITY: Prefer VITE_GOOGLE_STT_PROXY_URL to keep API key server-side
// VITE_GOOGLE_STT_API_KEY is INSECURE (exposed in browser bundle) — use only for local dev

const API_KEY = import.meta.env.VITE_GOOGLE_STT_API_KEY || '';
const PROXY_URL = import.meta.env.VITE_GOOGLE_STT_PROXY_URL || '';

// Warn in production if using direct API key instead of proxy
if (API_KEY && !PROXY_URL && !import.meta.env.DEV) {
  console.warn('[SECURITY] VITE_GOOGLE_STT_API_KEY is exposed in browser bundle. Use VITE_GOOGLE_STT_PROXY_URL instead.');
}

// Use proxy if configured, otherwise direct API with key
function getEndpoint(): string {
  if (PROXY_URL) return PROXY_URL;
  return `https://speech.googleapis.com/v1/speech:recognize?key=${API_KEY}`;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  alternatives: string[];
}

interface GoogleSTTResponse {
  results?: Array<{
    alternatives: Array<{
      transcript: string;
      confidence: number;
    }>;
  }>;
  error?: { code: number; message: string };
}

// Send audio to Google Cloud STT and get transcript
export async function recognizeSpeech(
  audioBase64: string,
  options?: {
    languageCode?: string;
    sampleRateHertz?: number;
    encoding?: string;
    signal?: AbortSignal;
  }
): Promise<SpeechRecognitionResult> {
  const endpoint = getEndpoint();
  if (!endpoint || (!API_KEY && !PROXY_URL)) {
    throw new Error('Chưa cấu hình Google Speech API. Thêm VITE_GOOGLE_STT_API_KEY vào .env');
  }

  const body = {
    config: {
      encoding: options?.encoding || 'WEBM_OPUS',
      sampleRateHertz: options?.sampleRateHertz || 48000,
      languageCode: options?.languageCode || 'ja-JP',
      maxAlternatives: 5,
      // Optimize for short utterances (sentences)
      model: 'default',
      useEnhanced: true,
    },
    audio: {
      content: audioBase64,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Google STT error ${response.status}: ${errText}`);
  }

  const data: GoogleSTTResponse = await response.json();

  if (data.error) {
    throw new Error(`Google STT: ${data.error.message}`);
  }

  if (!data.results?.length) {
    return { transcript: '', confidence: 0, alternatives: [] };
  }

  const result = data.results[0];
  const primary = result.alternatives[0];
  const alternatives = result.alternatives.map(a => a.transcript);

  return {
    transcript: primary.transcript,
    confidence: primary.confidence,
    alternatives,
  };
}

// Check if Google STT is configured
export function isGoogleSTTConfigured(): boolean {
  return !!(API_KEY || PROXY_URL);
}
