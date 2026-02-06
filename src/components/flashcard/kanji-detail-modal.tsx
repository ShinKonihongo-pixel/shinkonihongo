// Modal showing per-character Kanji breakdown with readings, mnemonics, sample words

import { X, RefreshCw, Sparkles } from 'lucide-react';
import type { Flashcard } from '../../types/flashcard';
import { useKanjiAnalysis } from '../../hooks/use-kanji-analysis';

interface KanjiDetailModalProps {
  flashcard: Flashcard;
  onClose: () => void;
  readOnly?: boolean; // true = only show cached data, no AI call
}

export function KanjiDetailModal({ flashcard, onClose, readOnly = false }: KanjiDetailModalProps) {
  const kanjiText = flashcard.kanji || flashcard.vocabulary;
  const { analyses, loading, error, regenerate } = useKanjiAnalysis(kanjiText, { readOnly });

  return (
    <div className="kd-overlay" onClick={onClose}>
      <div className="kd-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with gradient accent */}
        <div className="kd-header">
          <div className="kd-title">
            <Sparkles size={18} className="kd-title-icon" />
            <h3>{flashcard.kanji || flashcard.vocabulary}</h3>
            <span className="kd-subtitle">Chi tiết Kanji</span>
          </div>
          <div className="kd-header-actions">
            {!readOnly && (
              <button
                className="kd-icon-btn"
                onClick={regenerate}
                disabled={loading}
                title="Tạo lại phân tích"
              >
                <RefreshCw size={16} className={loading ? 'kd-spin' : ''} />
              </button>
            )}
            <button className="kd-icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="kd-body">
          {loading && (
            <div className="kd-skeleton-list">
              {[1, 2].map((i) => (
                <div key={i} className="kd-skeleton-card">
                  <div className="kd-skeleton-char" />
                  <div className="kd-skeleton-lines">
                    <div className="kd-skeleton-line kd-skeleton-w60" />
                    <div className="kd-skeleton-line kd-skeleton-w80" />
                    <div className="kd-skeleton-line kd-skeleton-w40" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="kd-error">
              <p>{error}</p>
              <button className="kd-retry-btn" onClick={regenerate}>Thử lại</button>
            </div>
          )}

          {!loading && !error && analyses.length === 0 && (
            <div className="kd-empty">
              {readOnly
                ? 'Chưa có dữ liệu phân tích. Hãy mở "Chi tiết" ở màn Quản lý để tạo.'
                : 'Không tìm thấy chữ Kanji trong từ này.'}
            </div>
          )}

          <div className="kd-grid">
            {analyses.map((a) => (
              <div key={a.character} className="kd-card">
                {/* Character showcase */}
                <div className="kd-card-top">
                  <div className="kd-char-frame">
                    <span className="kd-char">{a.character}</span>
                  </div>
                  <div className="kd-char-info">
                    <span className="kd-sino">{a.sinoVietnamese}</span>
                    <div className="kd-reading-pills">
                      {a.onYomi.length > 0 && (
                        <span className="kd-pill kd-pill-on" title="Âm ON">
                          ON: {a.onYomi.join('、')}
                        </span>
                      )}
                      {a.kunYomi.length > 0 && (
                        <span className="kd-pill kd-pill-kun" title="Âm KUN">
                          KUN: {a.kunYomi.join('、')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mnemonic */}
                {a.mnemonic && (
                  <div className="kd-mnemonic">
                    <span className="kd-mnemonic-icon">💡</span>
                    <span>{a.mnemonic}</span>
                  </div>
                )}

                {/* Sample words */}
                {a.sampleWords.length > 0 && (
                  <div className="kd-samples">
                    {a.sampleWords.map((sw, i) => (
                      <div key={i} className="kd-sample-row">
                        <span className="kd-sw-word">{sw.word}</span>
                        <span className="kd-sw-reading">{sw.reading}</span>
                        <span className="kd-sw-dot">·</span>
                        <span className="kd-sw-meaning">{sw.meaning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{kanjiDetailStyles}</style>
    </div>
  );
}

const kanjiDetailStyles = `
  /* Overlay */
  .kd-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: kd-fade-in 0.2s ease-out;
  }

  @keyframes kd-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Modal frame — matches study-settings-modal pattern */
  .kd-modal {
    background: linear-gradient(165deg, #1a1f35 0%, #0d1121 100%);
    border-radius: 20px;
    width: 100%;
    max-width: 520px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 25px 80px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    animation: kd-slide-up 0.25s ease-out;
  }

  @keyframes kd-slide-up {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Header */
  .kd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .kd-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .kd-title-icon {
    color: #a5b4fc;
    flex-shrink: 0;
  }

  .kd-title h3 {
    margin: 0;
    font-size: 1.25rem;
    color: white;
    font-weight: 700;
  }

  .kd-subtitle {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 500;
    margin-left: 0.25rem;
  }

  .kd-header-actions {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .kd-icon-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .kd-icon-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  .kd-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Body with scroll */
  .kd-body {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 1.5rem;
    min-height: 0;
  }

  .kd-body::-webkit-scrollbar {
    width: 4px;
  }

  .kd-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .kd-body::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
  }

  /* Skeleton loading */
  .kd-skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .kd-skeleton-card {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 14px;
  }

  .kd-skeleton-char {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background: linear-gradient(110deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 200% 100%;
    animation: kd-shimmer 1.5s ease-in-out infinite;
    flex-shrink: 0;
  }

  .kd-skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.25rem;
  }

  .kd-skeleton-line {
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(110deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%);
    background-size: 200% 100%;
    animation: kd-shimmer 1.5s ease-in-out infinite;
  }

  .kd-skeleton-w60 { width: 60%; }
  .kd-skeleton-w80 { width: 80%; }
  .kd-skeleton-w40 { width: 40%; }

  @keyframes kd-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error state */
  .kd-error {
    text-align: center;
    padding: 2rem 1rem;
    color: #fca5a5;
    font-size: 0.9rem;
  }

  .kd-retry-btn {
    margin-top: 0.75rem;
    padding: 0.5rem 1.25rem;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #fca5a5;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .kd-retry-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  /* Empty state */
  .kd-empty {
    text-align: center;
    padding: 2.5rem 1rem;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.9rem;
  }

  /* Kanji card grid */
  .kd-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .kd-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    transition: border-color 0.2s;
  }

  .kd-card:hover {
    border-color: rgba(99, 102, 241, 0.2);
  }

  /* Character top section */
  .kd-card-top {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .kd-char-frame {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
    border: 1.5px solid rgba(99, 102, 241, 0.3);
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }

  .kd-char-frame::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 50%);
    border-radius: inherit;
  }

  .kd-char {
    font-size: 2.25rem;
    font-weight: 700;
    color: white;
    position: relative;
    z-index: 1;
  }

  .kd-char-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  .kd-sino {
    font-size: 1.1rem;
    font-weight: 700;
    color: #a5b4fc;
    letter-spacing: 0.5px;
  }

  /* Reading pills */
  .kd-reading-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .kd-pill {
    display: inline-flex;
    padding: 0.25rem 0.625rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 500;
    border: 1px solid;
  }

  .kd-pill-on {
    background: rgba(251, 146, 60, 0.1);
    border-color: rgba(251, 146, 60, 0.2);
    color: #fdba74;
  }

  .kd-pill-kun {
    background: rgba(52, 211, 153, 0.1);
    border-color: rgba(52, 211, 153, 0.2);
    color: #6ee7b7;
  }

  /* Mnemonic */
  .kd-mnemonic {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
    background: rgba(251, 191, 36, 0.06);
    border: 1px solid rgba(251, 191, 36, 0.12);
    border-radius: 10px;
    font-size: 0.825rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.5;
  }

  .kd-mnemonic-icon {
    flex-shrink: 0;
    font-size: 0.9rem;
  }

  /* Sample words */
  .kd-samples {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-top: 0.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .kd-sample-row {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    font-size: 0.825rem;
    padding: 0.25rem 0;
  }

  .kd-sw-word {
    font-weight: 600;
    color: #93c5fd;
  }

  .kd-sw-reading {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.78rem;
  }

  .kd-sw-dot {
    color: rgba(255, 255, 255, 0.2);
  }

  .kd-sw-meaning {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.78rem;
  }

  /* Spin animation */
  .kd-spin {
    animation: kd-spin-anim 1s linear infinite;
  }
  @keyframes kd-spin-anim {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Mobile */
  @media (max-width: 480px) {
    .kd-modal {
      max-height: 92vh;
      border-radius: 16px;
      margin: 0.5rem;
    }

    .kd-header {
      padding: 1rem 1.25rem;
    }

    .kd-body {
      padding: 1rem 1.25rem;
    }

    .kd-subtitle {
      display: none;
    }

    .kd-char-frame {
      width: 56px;
      height: 56px;
    }

    .kd-char {
      font-size: 1.875rem;
    }
  }
`;
