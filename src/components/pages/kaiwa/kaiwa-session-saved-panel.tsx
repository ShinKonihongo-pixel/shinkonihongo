// Saved sentences panel for kaiwa-session-view

import { Bookmark, X, Volume2, Copy, Trash2 } from 'lucide-react';
import { FuriganaText } from '../../common/furigana-text';
import { removeFurigana } from '../../../lib/furigana-utils';
import { useSpeech } from '../../../hooks/use-speech';

interface KaiwaSessionSavedPanelProps {
  savedSentences: string[];
  showFurigana: boolean;
  fontSize: number;
  speech: ReturnType<typeof useSpeech>;
  getSpeechRate: () => number;
  setShowSavedPanel: (show: boolean) => void;
  setSavedSentences: React.Dispatch<React.SetStateAction<string[]>>;
}

export function KaiwaSessionSavedPanel({
  savedSentences,
  showFurigana,
  fontSize,
  speech,
  getSpeechRate,
  setShowSavedPanel,
  setSavedSentences,
}: KaiwaSessionSavedPanelProps) {
  if (savedSentences.length === 0) return null;

  return (
    <div className="kaiwa-saved-panel">
      <div className="kaiwa-saved-header">
        <h3><Bookmark size={16} /> Câu đã lưu ({savedSentences.length})</h3>
        <button className="kaiwa-saved-close" onClick={() => setShowSavedPanel(false)}><X size={16} /></button>
      </div>
      <div className="kaiwa-saved-list">
        {savedSentences.map((sentence, idx) => (
          <div key={idx} className="kaiwa-saved-item">
            <p className="kaiwa-saved-text" style={{ fontSize: `${fontSize}px` }}>
              <FuriganaText text={sentence} showFurigana={showFurigana} />
            </p>
            <div className="kaiwa-saved-actions">
              <button
                className="kaiwa-saved-btn"
                onClick={() => speech.speak(removeFurigana(sentence), { rate: getSpeechRate() })}
                title="Nghe"
              >
                <Volume2 size={14} />
              </button>
              <button
                className="kaiwa-saved-btn"
                onClick={() => {
                  navigator.clipboard.writeText(removeFurigana(sentence));
                }}
                title="Sao chép"
              >
                <Copy size={14} />
              </button>
              <button
                className="kaiwa-saved-btn delete"
                onClick={() => setSavedSentences(prev => prev.filter((_, i) => i !== idx))}
                title="Xóa"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
