import { forwardRef } from 'react';
import { FileText, BookOpen, Volume2, Square, Pause, Play, Clock } from 'lucide-react';
import { FuriganaText } from '../../ui/furigana-text';
import type { ReadingPassage } from '../../../types/reading';
import type { AudioState, ContentTab } from './types';

interface ContentPanelProps {
  selectedPassage: ReadingPassage;
  contentTab: ContentTab;
  audioState: AudioState;
  settings: { fontSize: number; textColor?: string };
  onTabChange: (tab: ContentTab) => void;
  onAudioToggle: (text: string) => void;
  onPauseSpeaking: () => void;
  onResumeSpeaking: () => void;
}

export const ContentPanel = forwardRef<HTMLDivElement, ContentPanelProps>(({
  selectedPassage,
  contentTab,
  audioState,
  settings,
  onTabChange,
  onAudioToggle,
  onPauseSpeaking,
  onResumeSpeaking,
}, ref) => {
  return (
    <div className="content-panel" ref={ref}>
      <div className="content-card">
        <div className="content-header">
          <div className="content-tabs">
            <button
              className={`content-tab ${contentTab === 'passage' ? 'active' : ''}`}
              onClick={() => onTabChange('passage')}
            >
              <FileText size={16} />
              <span>Nội dung bài đọc</span>
            </button>
            <button
              className={`content-tab ${contentTab === 'vocabulary' ? 'active' : ''}`}
              onClick={() => onTabChange('vocabulary')}
            >
              <BookOpen size={16} />
              <span>Từ mới</span>
              {selectedPassage.vocabulary && selectedPassage.vocabulary.length > 0 && (
                <span className="vocab-count">{selectedPassage.vocabulary.length}</span>
              )}
            </button>
          </div>
          {contentTab === 'passage' && (
            <div className="audio-controls">
              <button
                className={`btn-audio ${audioState !== 'idle' ? 'active' : ''}`}
                onClick={() => onAudioToggle(selectedPassage.content)}
                title={audioState === 'idle' ? 'Nghe' : 'Dừng'}
              >
                {audioState === 'idle' ? <Volume2 size={18} /> : <Square size={16} />}
              </button>
              {audioState !== 'idle' && (
                <button
                  className={`btn-audio ${audioState === 'paused' ? 'paused' : ''}`}
                  onClick={() => audioState === 'playing' ? onPauseSpeaking() : onResumeSpeaking()}
                  title={audioState === 'playing' ? 'Tạm dừng' : 'Tiếp tục'}
                >
                  {audioState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="content-body">
          {contentTab === 'passage' ? (
            <div className="passage-text" style={{ fontSize: `${settings.fontSize}rem`, color: settings.textColor || 'white' }}>
              <FuriganaText text={selectedPassage.content} />
            </div>
          ) : (
            <div className="vocabulary-list">
              {selectedPassage.vocabulary && selectedPassage.vocabulary.length > 0 ? (
                <>
                  <div className="vocab-header-row">
                    <span className="vocab-col-num">#</span>
                    <span className="vocab-col-word">Từ mới</span>
                    <span className="vocab-col-reading">Cách đọc</span>
                    <span className="vocab-col-meaning">Nghĩa</span>
                  </div>
                  {selectedPassage.vocabulary.map((vocab, idx) => (
                    <div key={idx} className="vocab-item" style={{ fontSize: `${settings.fontSize * 0.95}rem` }}>
                      <span className="vocab-num" style={{ color: 'white' }}>{idx + 1}</span>
                      <span className="vocab-word" style={{ color: 'white' }}>{vocab.word}</span>
                      <span className="vocab-reading" style={{ color: 'white' }}>{vocab.reading || '—'}</span>
                      <span className="vocab-meaning" style={{ color: 'white' }}>{vocab.meaning}</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="vocab-empty">
                  <BookOpen size={32} />
                  <span>Chưa có từ mới</span>
                </div>
              )}
            </div>
          )}
        </div>
        {contentTab === 'passage' && (
          <div className="content-footer">
            <div className="word-count">
              <Clock size={14} />
              <span>~{Math.ceil(selectedPassage.content.length / 400)} phút đọc</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ContentPanel.displayName = 'ContentPanel';
