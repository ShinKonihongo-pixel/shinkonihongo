// Hook for Web Speech API — Japanese speech recognition

import { useState, useCallback, useRef } from 'react';

// Check browser support
function getSpeechRecognition(): typeof SpeechRecognition | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = !!getSpeechRecognition();

  const startListening = useCallback((lang: string = 'ja-JP') => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError('Trình duyệt không hỗ trợ nhận diện giọng nói');
      return;
    }

    // Stop any existing
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setConfidence(0);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0];
      setTranscript(result.transcript);
      setConfidence(result.confidence);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError('Không nghe thấy giọng nói. Hãy thử lại.');
      } else if (event.error === 'not-allowed') {
        setError('Chưa cấp quyền microphone. Hãy cho phép trong cài đặt trình duyệt.');
      } else {
        setError('Lỗi nhận diện giọng nói. Hãy thử lại.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    reset,
  };
}

// Simple pronunciation scoring: compare user speech to expected text
export function scorePronunciation(expected: string, spoken: string): {
  score: number; // 0-100
  matches: boolean[];
  feedback: string;
} {
  // Normalize: remove spaces, convert to hiragana-comparable
  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
  const exp = normalize(expected);
  const spk = normalize(spoken);

  if (exp === spk) {
    return { score: 100, matches: exp.split('').map(() => true), feedback: 'Hoàn hảo! 素晴らしい！' };
  }

  // Character-level comparison
  const maxLen = Math.max(exp.length, spk.length);
  const matches: boolean[] = [];
  let matchCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const match = i < exp.length && i < spk.length && exp[i] === spk[i];
    matches.push(match);
    if (match) matchCount++;
  }

  const score = maxLen > 0 ? Math.round((matchCount / maxLen) * 100) : 0;

  let feedback: string;
  if (score >= 80) feedback = 'Rất tốt! もう少しです！';
  else if (score >= 60) feedback = 'Khá tốt! Cần luyện thêm một chút.';
  else if (score >= 40) feedback = 'Cố gắng hơn nhé! 頑張って！';
  else feedback = 'Hãy nghe lại và thử lại. もう一度！';

  return { score, matches, feedback };
}
