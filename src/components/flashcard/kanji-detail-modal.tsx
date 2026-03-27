// Modal showing per-character Kanji breakdown with readings, mnemonics, sample words

import { useState } from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import { ModalShell } from '../ui/modal-shell';
import type { Flashcard } from '../../types/flashcard';
import type { Radical } from '../../types/kanji';
import { useKanjiAnalysis } from '../../hooks/use-kanji-analysis';
import { getRadicalInfo } from '../../utils/radical-kanji-index';
import { RadicalExplorerPanel } from './radical-explorer-panel';
import './kanji-detail-modal.css';

interface KanjiDetailModalProps {
  flashcard: Flashcard;
  onClose: () => void;
  readOnly?: boolean; // true = only show cached data, no AI call
}

export function KanjiDetailModal({ flashcard, onClose, readOnly = false }: KanjiDetailModalProps) {
  const kanjiText = flashcard.kanji || flashcard.vocabulary;
  const { analyses, loading, error, regenerate } = useKanjiAnalysis(kanjiText, { readOnly });
  const [selectedRadical, setSelectedRadical] = useState<Radical | null>(null);

  return (
    <ModalShell isOpen onClose={onClose} maxWidth={560} hideClose className="kd-shell">
      {/* Header with gradient accent */}
      <div className="kd-header">
          <div className="kd-title">
            <Sparkles size={18} className="kd-title-icon" />
            <h3>{flashcard.kanji || flashcard.vocabulary}</h3>
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
          {selectedRadical ? (
            <RadicalExplorerPanel
              radical={selectedRadical}
              onBack={() => setSelectedRadical(null)}
              readOnly={readOnly}
            />
          ) : (
            <>
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
                    ? 'Chưa có dữ liệu phân tích.'
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

                    {/* Radical chips */}
                    {a.radicals && a.radicals.length > 0 && (
                      <div className="kd-radicals">
                        <span className="kd-radicals-label">Bộ thủ:</span>
                        <div className="kd-radicals-chips">
                          {a.radicals.map((r) => {
                            const info = getRadicalInfo(r);
                            return (
                              <button
                                key={r}
                                className="kd-radical-chip"
                                onClick={() => info && setSelectedRadical(info)}
                                title={info ? `${info.vietnameseName} — ${info.meaning}` : r}
                              >
                                <span className="kd-radical-char">{r}</span>
                                {info && <span className="kd-radical-name">{info.vietnameseName}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
            </>
          )}
        </div>
    </ModalShell>
  );
}
