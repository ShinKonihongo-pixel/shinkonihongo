// Hook for Web Speech API — Japanese speech recognition
// Optimized: interim results, multiple alternatives, better scoring

import { useState, useCallback, useRef, useEffect } from 'react';

// Check browser support
function getSpeechRecognition(): typeof SpeechRecognition | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = !!getSpeechRecognition();

  // Cleanup on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const startListening = useCallback((lang: string = 'ja-JP') => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true; // Show real-time text while speaking
    recognition.maxAlternatives = 3;   // Get multiple interpretations for better matching

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      setConfidence(0);
      setAlternatives([]);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result.isFinal) {
        setTranscript(result[0].transcript);
        setConfidence(result[0].confidence);
        setInterimTranscript('');
        // Collect all alternatives
        const alts: string[] = [];
        for (let i = 0; i < result.length; i++) {
          alts.push(result[i].transcript);
        }
        setAlternatives(alts);
      } else {
        setInterimTranscript(result[0].transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setInterimTranscript('');
      const errorMessages: Record<string, string> = {
        'no-speech': 'Không nghe thấy giọng nói. Hãy thử lại.',
        'not-allowed': 'Chưa cấp quyền microphone. Hãy cho phép trong cài đặt trình duyệt.',
        'audio-capture': 'Không tìm thấy microphone. Hãy kiểm tra thiết bị.',
        'network': 'Lỗi mạng. Hãy kiểm tra kết nối internet.',
        'aborted': '', // User cancelled, no error message needed
      };
      const msg = errorMessages[event.error] || 'Lỗi nhận diện giọng nói. Hãy thử lại.';
      if (msg) setError(msg);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setAlternatives([]);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    confidence,
    alternatives,
    error,
    startListening,
    stopListening,
    reset,
  };
}

// Pronunciation scoring — uses Levenshtein distance for Japanese text
// Handles kanji/hiragana/katakana mismatches from speech recognition
export function scorePronunciation(
  expected: string,
  spoken: string,
  alternatives: string[] = [],
): {
  score: number;
  feedback: string;
  bestMatch: string;
} {
  // Normalize: remove punctuation, spaces, fullwidth chars
  const normalize = (s: string) =>
    s.replace(/[\s、。！？!?.,\u3000]/g, '')
     .replace(/[ａ-ｚＡ-Ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

  const exp = normalize(expected);

  // Score against all alternatives and pick best
  const candidates = [spoken, ...alternatives].filter(Boolean);
  let bestScore = 0;
  let bestMatch = spoken;

  for (const candidate of candidates) {
    const spk = normalize(candidate);
    const score = calculateSimilarity(exp, spk);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  const score = Math.round(bestScore * 100);

  let feedback: string;
  if (score >= 95) feedback = 'Hoàn hảo! 素晴らしい！';
  else if (score >= 80) feedback = 'Rất tốt! もう少しです！';
  else if (score >= 60) feedback = 'Khá tốt! Cần luyện thêm.';
  else if (score >= 40) feedback = 'Cố gắng hơn nhé! 頑張って！';
  else feedback = 'Hãy nghe lại và thử lại. もう一度！';

  return { score, feedback, bestMatch };
}

// Levenshtein-based similarity (0-1) — more accurate than character-by-character
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLen = Math.max(a.length, b.length);
  const distance = levenshtein(a, b);
  return 1 - distance / maxLen;
}

// Levenshtein edit distance
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Use single-row optimization for memory efficiency
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,     // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}
