// Speech recognition hook — dual engine: Google Cloud STT (primary) + Web Speech API (fallback)
// Two modes: Free (dictation) and Practice (compare with expected)

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioRecorder } from './use-audio-recorder';
import { recognizeSpeech, isGoogleSTTConfigured } from '../services/google-speech';

// ========== Types ==========

export type RecognitionEngine = 'google' | 'webspeech';
export type RecognitionMode = 'free' | 'practice';

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  alternatives: string[];
  engine: RecognitionEngine;
}

// ========== Web Speech API fallback ==========

function getWebSpeechRecognition(): typeof SpeechRecognition | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ========== Main Hook ==========

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Google STT processing
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<RecognitionEngine>('webspeech');

  const webSpeechRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioRecorder = useAudioRecorder();

  const isWebSpeechSupported = !!getWebSpeechRecognition();
  const isGoogleConfigured = isGoogleSTTConfigured();
  const isSupported = isWebSpeechSupported || isGoogleConfigured;

  // Determine best engine
  const activeEngine: RecognitionEngine = isGoogleConfigured ? 'google' : 'webspeech';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webSpeechRef.current?.abort();
      abortRef.current?.abort();
    };
  }, []);

  // When Google recorder stops, process audio
  useEffect(() => {
    if (activeEngine === 'google' && audioRecorder.audioBase64 && !audioRecorder.isRecording) {
      processGoogleAudio(audioRecorder.audioBase64);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRecorder.audioBase64, audioRecorder.isRecording]);

  // Process audio with Google STT
  const processGoogleAudio = useCallback(async (base64: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      abortRef.current = new AbortController();

      // Detect encoding from recorder
      const encoding = audioRecorder.audioBlob?.type.includes('mp4') ? 'MP3' : 'WEBM_OPUS';

      const result = await recognizeSpeech(base64, {
        languageCode: 'ja-JP',
        encoding,
        sampleRateHertz: 48000,
        signal: abortRef.current.signal,
      });

      if (result.transcript) {
        setTranscript(result.transcript);
        setConfidence(result.confidence);
        setAlternatives(result.alternatives);
        setEngine('google');
      } else {
        setError('Không nghe rõ. Hãy nói to hơn và thử lại.');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Lỗi nhận diện giọng nói');
    } finally {
      setIsProcessing(false);
      setIsListening(false);
      abortRef.current = null;
    }
  }, [audioRecorder.audioBlob]);

  // Start listening (auto-selects best engine)
  const startListening = useCallback((lang: string = 'ja-JP') => {
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setAlternatives([]);

    if (activeEngine === 'google') {
      // Use MediaRecorder → Google STT
      audioRecorder.reset();
      audioRecorder.startRecording();
      setIsListening(true);
      setEngine('google');
    } else {
      // Fallback: Web Speech API
      const SpeechRecognitionClass = getWebSpeechRecognition();
      if (!SpeechRecognitionClass) {
        setError('Trình duyệt không hỗ trợ nhận diện giọng nói');
        return;
      }

      if (webSpeechRef.current) webSpeechRef.current.abort();

      const recognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 5;

      recognition.onstart = () => {
        setIsListening(true);
        setEngine('webspeech');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0];
        if (result.isFinal) {
          setTranscript(result[0].transcript);
          setConfidence(result[0].confidence);
          setInterimTranscript('');
          const alts: string[] = [];
          for (let i = 0; i < result.length; i++) alts.push(result[i].transcript);
          setAlternatives(alts);
        } else {
          setInterimTranscript(result[0].transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setInterimTranscript('');
        const msgs: Record<string, string> = {
          'no-speech': 'Không nghe thấy giọng nói. Hãy thử lại.',
          'not-allowed': 'Chưa cấp quyền microphone.',
          'audio-capture': 'Không tìm thấy microphone.',
          'network': 'Lỗi mạng.',
          'aborted': '',
        };
        const msg = msgs[event.error] || 'Lỗi nhận diện giọng nói.';
        if (msg) setError(msg);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        webSpeechRef.current = null;
      };

      webSpeechRef.current = recognition;
      recognition.start();
    }
  }, [activeEngine, audioRecorder]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (activeEngine === 'google') {
      audioRecorder.stopRecording(); // Will trigger processGoogleAudio via useEffect
    } else {
      webSpeechRef.current?.stop();
    }
  }, [activeEngine, audioRecorder]);

  // Reset all state
  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setAlternatives([]);
    setError(null);
    setIsProcessing(false);
    audioRecorder.reset();
  }, [audioRecorder]);

  return {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    interimTranscript,
    confidence,
    alternatives,
    error,
    engine,
    activeEngine,
    recordingDuration: audioRecorder.duration,
    startListening,
    stopListening,
    reset,
  };
}

// ========== Pronunciation Scoring ==========
// Levenshtein-based, handles kanji/hiragana mismatches

export function scorePronunciation(
  expected: string,
  spoken: string,
  alternatives: string[] = [],
): {
  score: number;
  feedback: string;
  bestMatch: string;
} {
  const normalize = (s: string) =>
    s.replace(/[\s、。！？!?.,\u3000]/g, '')
     .replace(/[ａ-ｚＡ-Ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

  const exp = normalize(expected);
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

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}
