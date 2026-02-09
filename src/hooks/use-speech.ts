// Hook for Speech Recognition and Text-to-Speech using Web Speech API

import { useState, useEffect, useCallback, useRef } from 'react';
import type { JapaneseVoice, JapaneseVoiceGender, PronunciationResult, PronunciationDiff } from '../types/kaiwa';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionClass {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

// Extend Window interface for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionClass;
    webkitSpeechRecognition: SpeechRecognitionClass;
  }
}

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  voice?: SpeechSynthesisVoice;
}

interface UseSpeechOptions {
  voiceGender?: JapaneseVoiceGender;
  voiceRate?: number;
  autoSpeak?: boolean;
}

// Detect if voice is female based on name patterns
function isFemaleName(name: string): boolean {
  const femalePatterns = /kyoko|haruka|o-ren|nanami|female|女|mei-jia|ting-ting|yuna|siri.*female/i;
  return femalePatterns.test(name);
}

// Detect if voice is male based on name patterns
function isMaleName(name: string): boolean {
  const malePatterns = /otoya|ichiro|male|男|tian-tian|yuna.*male|siri.*male/i;
  return malePatterns.test(name);
}

// Normalize Japanese text for comparison (remove punctuation, whitespace, convert to consistent form)
function normalizeJapanese(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[。、！？「」『』（）\s・…]/g, '')
    .toLowerCase();
}

// Compare pronunciation between spoken and expected text
export function comparePronunciation(spoken: string, expected: string): PronunciationResult {
  const normalizedSpoken = normalizeJapanese(spoken);
  const normalizedExpected = normalizeJapanese(expected);

  if (normalizedSpoken === normalizedExpected) {
    return {
      accuracy: 100,
      isCorrect: true,
      differences: [],
      feedback: '完璧です！ (Hoàn hảo!)',
      expectedText: expected,
      spokenText: spoken,
    };
  }

  // Find differences using simple character comparison
  const differences: PronunciationDiff[] = [];
  const maxLen = Math.max(normalizedSpoken.length, normalizedExpected.length);
  let matchCount = 0;

  for (let i = 0; i < maxLen; i++) {
    const expectedChar = normalizedExpected[i] || '';
    const spokenChar = normalizedSpoken[i] || '';

    if (expectedChar === spokenChar) {
      matchCount++;
    } else if (expectedChar || spokenChar) {
      differences.push({
        expected: expectedChar || '(thiếu)',
        spoken: spokenChar || '(thừa)',
        position: i,
      });
    }
  }

  const accuracy = maxLen > 0 ? Math.round((matchCount / maxLen) * 100) : 0;

  // Generate feedback based on accuracy
  let feedback: string;
  if (accuracy >= 90) {
    feedback = 'とても良いです！ (Rất tốt!)';
  } else if (accuracy >= 70) {
    feedback = 'いい感じです！ (Khá tốt!)';
  } else if (accuracy >= 50) {
    feedback = 'もう一度練習しましょう (Hãy luyện tập thêm)';
  } else {
    feedback = 'ゆっくり言ってみてください (Hãy nói chậm lại)';
  }

  return {
    accuracy,
    isCorrect: false,
    differences,
    feedback,
    expectedText: expected,
    spokenText: spoken,
  };
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const { voiceGender = 'female', voiceRate = 1.0 } = options;

  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<JapaneseVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  // Recognition State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // Support Status
  const [ttsSupported, setTtsSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize TTS
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTtsSupported(true);
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        // Filter Japanese voices
        const japaneseVoices = voices
          .filter(v => v.lang.startsWith('ja'))
          .map(v => ({
            voiceURI: v.voiceURI,
            name: v.name,
            lang: v.lang,
            gender: (isFemaleName(v.name) ? 'female' : isMaleName(v.name) ? 'male' : 'female') as JapaneseVoiceGender,
          }));
        setAvailableVoices(japaneseVoices);

        // Select default voice based on gender preference
        const preferredVoices = voices.filter(
          v => v.lang.startsWith('ja') &&
          (voiceGender === 'female' ? isFemaleName(v.name) : isMaleName(v.name))
        );
        if (preferredVoices.length > 0) {
          setSelectedVoice(preferredVoices[0]);
        } else {
          // Fallback to any Japanese voice
          const anyJapanese = voices.find(v => v.lang.startsWith('ja'));
          if (anyJapanese) setSelectedVoice(anyJapanese);
        }
      };

      // Voices may load async
      loadVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, [voiceGender]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Check browser support - Chrome/Edge work, Safari doesn't
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');
    const isEdge = userAgent.includes('edg');
    const isSupported = isChrome || isEdge;

    console.log('[Speech] Browser check:', { userAgent, isChrome, isEdge, isSupported, hasAPI: !!SpeechRecognitionAPI });

    if (SpeechRecognitionAPI && isSupported) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecognitionSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        console.log('[Speech] Recognition started');
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        console.log('[Speech] Recognition ended');
        setIsListening(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('[Speech] Got result:', event.results);
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        console.log('[Speech] Final:', final, 'Interim:', interim);
        if (final) {
          setTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[Speech] Error:', event.error);
        setIsListening(false);
        switch (event.error) {
          case 'no-speech':
            setError('Không nghe thấy. Vui lòng nói lại.');
            break;
          case 'audio-capture':
            setError('Không tìm thấy microphone.');
            break;
          case 'not-allowed':
            setError('Vui lòng cấp quyền microphone.');
            break;
          default:
            setError(`Lỗi nhận dạng: ${event.error}`);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  // Speak function
  const speak = useCallback((text: string, speakOptions?: SpeakOptions) => {
    if (!synthRef.current || !ttsSupported) {
      setError('Trình duyệt không hỗ trợ đọc văn bản.');
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = speakOptions?.rate ?? voiceRate;
    utterance.pitch = speakOptions?.pitch ?? 1.0;

    // Use provided voice or selected voice, or find any Japanese voice
    let voiceToUse = speakOptions?.voice ?? selectedVoice;
    if (!voiceToUse) {
      const voices = synthRef.current.getVoices();
      voiceToUse = voices.find(v => v.lang.startsWith('ja')) || null;
    }
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      // Don't show error for 'interrupted' or 'canceled'
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        setError('Lỗi khi đọc văn bản. Thử tải lại trang.');
      }
    };

    synthRef.current.speak(utterance);
  }, [ttsSupported, voiceRate, selectedVoice]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // Start listening
  const startListening = useCallback(() => {
    console.log('[Speech] startListening called, supported:', recognitionSupported, 'ref:', !!recognitionRef.current);
    if (!recognitionRef.current || !recognitionSupported) {
      setError('Trình duyệt không hỗ trợ nhận dạng giọng nói. Vui lòng dùng Chrome.');
      return;
    }
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
      console.log('[Speech] Recognition start() called');
    } catch (e) {
      console.error('[Speech] Start error:', e);
      setError('Đang trong quá trình nhận dạng.');
    }
  }, [recognitionSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Set voice by name
  const setVoiceByName = useCallback((voiceName: string) => {
    if (!synthRef.current) return;
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
    }
  }, []);

  // Set voice by gender
  const setVoiceByGender = useCallback((gender: JapaneseVoiceGender) => {
    if (!synthRef.current) return;
    const voices = synthRef.current.getVoices();
    const japaneseVoices = voices.filter(v => v.lang.startsWith('ja'));
    const preferredVoice = japaneseVoices.find(
      v => gender === 'female' ? isFemaleName(v.name) : isMaleName(v.name)
    );
    if (preferredVoice) {
      setSelectedVoice(preferredVoice);
    } else if (japaneseVoices.length > 0) {
      setSelectedVoice(japaneseVoices[0]);
    }
  }, []);

  return {
    // TTS
    speak,
    stopSpeaking,
    isSpeaking,
    availableVoices,
    selectedVoice,
    setVoiceByName,
    setVoiceByGender,

    // Recognition
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    resetTranscript,

    // Support status
    ttsSupported,
    recognitionSupported,
    error,
    clearError,
  };
}
