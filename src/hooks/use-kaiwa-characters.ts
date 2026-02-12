// Hook for managing kaiwa characters with assigned TTS voices
// Characters are stored in localStorage since TTS voices are device-specific
// Voice presets provide 10 distinct voice types via pitch/rate combinations

import { useState, useEffect, useCallback } from 'react';
import type { KaiwaCharacter, KaiwaGender } from '../types/listening';

const STORAGE_KEY = 'kaiwa-characters';

// Gender emoji helper
export const GENDER_EMOJI: Record<KaiwaGender, string> = {
  male: '👨', female: '👩', boy: '👦', girl: '👧',
};

// Voice preset: combines base gender, pitch, and rate to create distinct voice types
export interface VoicePreset {
  id: string;
  label: string;
  emoji: string;
  gender: KaiwaGender;
  pitch: number; // 0.1 - 2.0
  rate: number; // Multiplier (1.0 = normal)
  color: string; // Gradient for UI
}

// 10 voice presets covering adult, youth, children, and elderly
export const VOICE_PRESETS: VoicePreset[] = [
  { id: 'adult-male', label: 'Nam', emoji: '👨', gender: 'male', pitch: 1.0, rate: 1.0, color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  { id: 'adult-female', label: 'Nữ', emoji: '👩', gender: 'female', pitch: 1.0, rate: 1.0, color: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  { id: 'young-male', label: 'Thanh niên', emoji: '🧑', gender: 'male', pitch: 1.15, rate: 1.0, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { id: 'young-female', label: 'Thiếu nữ', emoji: '👱‍♀️', gender: 'female', pitch: 1.1, rate: 1.0, color: 'linear-gradient(135deg, #f472b6 0%, #e879a0 100%)' },
  { id: 'boy', label: 'Bé trai', emoji: '👦', gender: 'boy', pitch: 1.4, rate: 1.05, color: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  { id: 'girl', label: 'Bé gái', emoji: '👧', gender: 'girl', pitch: 1.35, rate: 1.05, color: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' },
  { id: 'child-boy', label: 'Bé trai nhỏ', emoji: '🧒', gender: 'boy', pitch: 1.7, rate: 1.1, color: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)' },
  { id: 'child-girl', label: 'Bé gái nhỏ', emoji: '👶', gender: 'girl', pitch: 1.65, rate: 1.1, color: 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)' },
  { id: 'old-male', label: 'Ông già', emoji: '👴', gender: 'male', pitch: 0.8, rate: 0.85, color: 'linear-gradient(135deg, #78716c 0%, #57534e 100%)' },
  { id: 'old-female', label: 'Bà già', emoji: '👵', gender: 'female', pitch: 0.9, rate: 0.88, color: 'linear-gradient(135deg, #a8a29e 0%, #78716c 100%)' },
];

// Default characters if none exist
const DEFAULT_CHARACTERS: KaiwaCharacter[] = [
  { id: '1', name: 'たなか', gender: 'male', voiceURI: '', pitch: 1.0, rate: 1.0, presetId: 'adult-male' },
  { id: '2', name: 'やまだ', gender: 'female', voiceURI: '', pitch: 1.0, rate: 1.0, presetId: 'adult-female' },
  { id: '3', name: 'けんた', gender: 'boy', voiceURI: '', pitch: 1.4, rate: 1.05, presetId: 'boy' },
  { id: '4', name: 'さくら', gender: 'girl', voiceURI: '', pitch: 1.35, rate: 1.05, presetId: 'girl' },
];

function loadCharacters(): KaiwaCharacter[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_CHARACTERS;
}

function saveCharacters(characters: KaiwaCharacter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

// Get available Japanese voices from the browser
export function getJapaneseVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices().filter(v => v.lang.startsWith('ja'));
}

// Create a SpeechSynthesisUtterance with the character's voice preset (pitch/rate)
export function createUtteranceForCharacter(
  text: string,
  character: KaiwaCharacter | undefined,
  rate = 0.9
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = rate * (character?.rate || 1.0);
  utterance.pitch = character?.pitch || 1.0;

  if (character?.voiceURI) {
    const voices = getJapaneseVoices();
    const match = voices.find(v => v.voiceURI === character.voiceURI);
    if (match) utterance.voice = match;
  }

  return utterance;
}

// Get the preset for a character (by presetId or best match)
export function getPresetForCharacter(char: KaiwaCharacter): VoicePreset | undefined {
  if (char.presetId) return VOICE_PRESETS.find(p => p.id === char.presetId);
  return VOICE_PRESETS.find(p => p.gender === char.gender && p.pitch === (char.pitch || 1.0));
}

export function useKaiwaCharacters() {
  const [characters, setCharacters] = useState<KaiwaCharacter[]>(loadCharacters);
  const [jaVoices, setJaVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available Japanese voices (may load async)
  useEffect(() => {
    const loadVoices = () => {
      const voices = getJapaneseVoices();
      if (voices.length > 0) setJaVoices(voices);
    };
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Auto-assign voices to characters that don't have one
  useEffect(() => {
    if (jaVoices.length === 0) return;
    let updated = false;
    const newChars = characters.map(char => {
      if (char.voiceURI) return char;
      // boy/girl use female/male base voices (pitch creates the difference)
      const isFemaleVoice = char.gender === 'female' || char.gender === 'girl';
      const genderVoice = jaVoices.find(v =>
        isFemaleVoice
          ? v.name.toLowerCase().includes('female') || v.name.includes('Kyoko') || v.name.includes('O-Ren') || v.name.includes('Nanami')
          : v.name.toLowerCase().includes('male') || v.name.includes('Otoya') || v.name.includes('Hattori')
      );
      if (genderVoice) {
        updated = true;
        return { ...char, voiceURI: genderVoice.voiceURI };
      }
      return char;
    });
    if (updated) {
      setCharacters(newChars);
      saveCharacters(newChars);
    }
  }, [jaVoices, characters]);

  const addCharacter = useCallback((name: string, gender: KaiwaGender, voiceURI: string, pitch?: number, rate?: number, presetId?: string) => {
    const newChar: KaiwaCharacter = {
      id: Date.now().toString(),
      name,
      gender,
      voiceURI,
      pitch: pitch ?? 1.0,
      rate: rate ?? 1.0,
      presetId,
    };
    const updated = [...characters, newChar];
    setCharacters(updated);
    saveCharacters(updated);
    return newChar;
  }, [characters]);

  const updateCharacter = useCallback((id: string, data: Partial<KaiwaCharacter>) => {
    const updated = characters.map(c => c.id === id ? { ...c, ...data } : c);
    setCharacters(updated);
    saveCharacters(updated);
  }, [characters]);

  const deleteCharacter = useCallback((id: string) => {
    const updated = characters.filter(c => c.id !== id);
    setCharacters(updated);
    saveCharacters(updated);
  }, [characters]);

  const getCharacterByName = useCallback((name: string) => {
    return characters.find(c => c.name === name);
  }, [characters]);

  return {
    characters,
    jaVoices,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacterByName,
  };
}
