// Utility functions for grammar study
import type { ReactNode } from 'react';

export function parseFurigana(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /([一-龯々]+)\(([ぁ-んァ-ヴー]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rt>{match[2]}</rt>
      </ruby>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function speakJapanese(text: string) {
  const cleanText = text.replace(/\([ぁ-んァ-ヴー]+\)/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}
