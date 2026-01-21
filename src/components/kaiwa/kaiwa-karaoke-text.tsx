// Karaoke-style text display for pronunciation practice
// Shows character-by-character coloring based on pronunciation accuracy

import { useMemo } from 'react';
import type { PronunciationResult, PronunciationDiff } from '../../types/kaiwa';
import { removeFurigana } from '../../lib/furigana-utils';

interface KaiwaKaraokeTextProps {
  expectedText: string;
  spokenText?: string;
  result: PronunciationResult | null;
  isRecording: boolean;
  interimText?: string;
}

type CharStatus = 'correct' | 'wrong' | 'missing' | 'extra' | 'pending' | 'current';

interface CharInfo {
  char: string;
  status: CharStatus;
  spokenChar?: string;
}

// Normalize Japanese text for comparison
function normalizeJapanese(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[。、！？「」『』（）\s・…]/g, '')
    .toLowerCase();
}

// Build character info array from pronunciation result
function buildCharInfos(
  expected: string,
  result: PronunciationResult | null,
  isRecording: boolean,
  interimText?: string
): CharInfo[] {
  const cleanExpected = normalizeJapanese(removeFurigana(expected));

  // If recording with interim text, show live progress
  if (isRecording && interimText) {
    const cleanInterim = normalizeJapanese(interimText);
    return cleanExpected.split('').map((char, idx) => {
      if (idx < cleanInterim.length) {
        const interimChar = cleanInterim[idx];
        if (char === interimChar) {
          return { char, status: 'correct' as CharStatus, spokenChar: interimChar };
        } else {
          return { char, status: 'wrong' as CharStatus, spokenChar: interimChar };
        }
      } else if (idx === cleanInterim.length) {
        return { char, status: 'current' as CharStatus };
      }
      return { char, status: 'pending' as CharStatus };
    });
  }

  // If no result yet, show all pending
  if (!result) {
    return cleanExpected.split('').map(char => ({
      char,
      status: isRecording ? 'pending' as CharStatus : 'pending' as CharStatus,
    }));
  }

  // Build from differences
  const diffMap = new Map<number, PronunciationDiff>();
  result.differences.forEach(diff => {
    diffMap.set(diff.position, diff);
  });

  const charInfos: CharInfo[] = [];
  const cleanSpoken = normalizeJapanese(result.spokenText);
  const maxLen = Math.max(cleanExpected.length, cleanSpoken.length);

  for (let i = 0; i < maxLen; i++) {
    const expectedChar = cleanExpected[i] || '';
    const spokenChar = cleanSpoken[i] || '';
    const diff = diffMap.get(i);

    if (diff) {
      if (!expectedChar && spokenChar) {
        // Extra character spoken
        charInfos.push({ char: spokenChar, status: 'extra', spokenChar });
      } else if (expectedChar && !spokenChar) {
        // Missing character
        charInfos.push({ char: expectedChar, status: 'missing' });
      } else {
        // Wrong character
        charInfos.push({ char: expectedChar, status: 'wrong', spokenChar });
      }
    } else if (expectedChar) {
      charInfos.push({ char: expectedChar, status: 'correct' });
    }
  }

  return charInfos;
}

export function KaiwaKaraokeText({
  expectedText,
  result,
  isRecording,
  interimText,
}: KaiwaKaraokeTextProps) {
  const charInfos = useMemo(
    () => buildCharInfos(expectedText, result, isRecording, interimText),
    [expectedText, result, isRecording, interimText]
  );

  const accuracy = result?.accuracy ?? 0;

  return (
    <div className="kaiwa-karaoke-container">
      <div className="kaiwa-karaoke-text">
        {charInfos.map((info, idx) => (
          <span
            key={idx}
            className={`karaoke-char karaoke-${info.status}`}
            title={info.spokenChar && info.status === 'wrong' ? `Nói: ${info.spokenChar}` : undefined}
          >
            {info.char}
          </span>
        ))}
      </div>

      {result && (
        <div className="kaiwa-karaoke-stats">
          <div className={`karaoke-accuracy ${accuracy >= 80 ? 'good' : accuracy >= 50 ? 'ok' : 'poor'}`}>
            <span className="accuracy-value">{accuracy}%</span>
            <span className="accuracy-label">Độ chính xác</span>
          </div>
          <div className="karaoke-feedback">{result.feedback}</div>
        </div>
      )}

      {isRecording && !result && (
        <div className="kaiwa-karaoke-recording">
          <span className="recording-indicator"></span>
          <span>Đang nghe...</span>
        </div>
      )}
    </div>
  );
}
