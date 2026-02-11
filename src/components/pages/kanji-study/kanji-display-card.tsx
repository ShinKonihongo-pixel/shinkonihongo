// Kanji flashcard display component with HanziWriter stroke order animation
import { useRef, useEffect } from 'react';
import HanziWriter from 'hanzi-writer';
import type { KanjiCard, KanjiLesson } from '../../../types/kanji';
import type { JLPTLevel } from '../../../types/flashcard';
import type { KanjiStudySettings } from './types';

interface KanjiDisplayCardProps {
  card: KanjiCard;
  isFlipped: boolean;
  settings: KanjiStudySettings;
  selectedLevel: JLPTLevel;
  lessons: KanjiLesson[];
  onFlip: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  // Remove ref props - manage touch state locally
}

const LEVEL_COLORS: Record<JLPTLevel, string> = {
  BT: '#8b5cf6', N5: '#22c55e', N4: '#3b82f6', N3: '#f59e0b', N2: '#a855f7', N1: '#ef4444',
};

export function KanjiDisplayCard({
  card, isFlipped, settings, selectedLevel, lessons,
  onFlip, onSwipeLeft, onSwipeRight,
}: KanjiDisplayCardProps) {
  const writerRef = useRef<HTMLDivElement>(null);
  const writerInstance = useRef<HanziWriter | null>(null);
  // Manage touch state locally to avoid ref mutation issues
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Scale HanziWriter size from frontFont.fontSize (clamped to reasonable range for SVG)
  const writerSize = Math.min(Math.max(settings.frontFont.fontSize, 80), 360);

  useEffect(() => {
    if (!settings.frontShow.strokeOrder || !writerRef.current) return;

    // Clear previous
    if (writerRef.current) writerRef.current.innerHTML = '';

    try {
      const writer = HanziWriter.create(writerRef.current, card.character, {
        width: writerSize,
        height: writerSize,
        padding: 5,
        strokeColor: settings.frontFont.fontColor,
        radicalColor: '#c4b5fd',
        delayBetweenStrokes: 300,
        strokeAnimationSpeed: 1.5,
        showOutline: true,
        outlineColor: 'rgba(255,255,255,0.1)',
      });
      writerInstance.current = writer;
      if (settings.autoPlayStroke) {
        writer.animateCharacter();
      }
    } catch {
      // Character may not be in hanzi-writer database
      if (writerRef.current) {
        writerRef.current.innerHTML = `<div style="font-size:${settings.frontFont.fontSize}px;color:${settings.frontFont.fontColor};font-family:'Noto Serif JP',serif;text-align:center;line-height:${writerSize}px;">${card.character}</div>`;
      }
    }

    return () => {
      writerInstance.current = null;
    };
  }, [card.character, settings.frontShow.strokeOrder, settings.autoPlayStroke, writerSize, settings.frontFont.fontColor]);

  const replayAnimation = (e: React.MouseEvent) => {
    e.stopPropagation();
    writerInstance.current?.animateCharacter();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx > 50 && absDx > absDy) {
      if (dx < 0) onSwipeRight();
      else onSwipeLeft();
    } else if (absDy < 30 && absDx < 30) {
      onFlip();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const lessonName = lessons.find(l => l.id === card.lessonId)?.name;
  const levelColor = LEVEL_COLORS[selectedLevel];

  return (
    <div
      className={`kanji-card-container ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ '--level-glow': `${levelColor}40` } as React.CSSProperties}
    >
      <div className="kanji-card">
        {/* FRONT */}
        <div className="kanji-card-front">
          {settings.frontShow.level && (
            <span className="card-level-badge" style={{ background: levelColor }}>{selectedLevel === 'BT' ? 'Bộ thủ' : selectedLevel}</span>
          )}
          {settings.frontShow.lesson && lessonName && (
            <span className="card-lesson-badge">{lessonName}</span>
          )}
          <div className="card-main-content">
            {settings.frontShow.strokeOrder ? (
              <div className="stroke-order-container">
                <div ref={writerRef} className="hanzi-writer-target" />
                <button className="replay-btn" onClick={replayAnimation} title="Xem lại nét viết">↻</button>
              </div>
            ) : settings.frontShow.character ? (
              <div className="kanji-large-character" style={{ fontSize: `${settings.frontFont.fontSize}px`, color: settings.frontFont.fontColor, textShadow: `0 0 40px ${settings.frontFont.fontColor}40` }}>{card.character}</div>
            ) : null}
            {settings.frontShow.onYomi && card.onYomi.length > 0 && (
              <div className="reading-line on-yomi"><span className="reading-label">音</span> {card.onYomi.join('、')}</div>
            )}
            {settings.frontShow.kunYomi && card.kunYomi.length > 0 && (
              <div className="reading-line kun-yomi"><span className="reading-label">訓</span> {card.kunYomi.join('、')}</div>
            )}
            {settings.frontShow.sinoVietnamese && <div className="sino-vietnamese">{card.sinoVietnamese}</div>}
            {settings.frontShow.meaning && <div className="kanji-meaning-front">{card.meaning}</div>}
          </div>
          <p className="flip-hint">Chạm để lật</p>
        </div>
        {/* BACK */}
        <div className="kanji-card-back">
          <div className="back-content-wrapper">
            <div className="back-section-left">
              {settings.backShow.character && <div className="kanji-back-character" style={{ fontSize: `${settings.backFont.fontSize}px`, color: settings.backFont.fontColor }}>{card.character}</div>}
              {settings.backShow.onYomi && card.onYomi.length > 0 && (
                <div className="reading-section"><span className="reading-label-back">音読み</span><span className="reading-value" style={{ fontSize: `${settings.backTextSize}px` }}>{card.onYomi.join('、')}</span></div>
              )}
              {settings.backShow.kunYomi && card.kunYomi.length > 0 && (
                <div className="reading-section"><span className="reading-label-back">訓読み</span><span className="reading-value" style={{ fontSize: `${settings.backTextSize}px` }}>{card.kunYomi.join('、')}</span></div>
              )}
              {settings.backShow.sinoVietnamese && (
                <div className="reading-section"><span className="reading-label-back">Hán Việt</span><span className="reading-value sino" style={{ fontSize: `${settings.backTextSize}px` }}>{card.sinoVietnamese}</span></div>
              )}
              {settings.backShow.meaning && <div className="kanji-meaning-back" style={{ fontSize: `${settings.backTextSize}px` }}>{card.meaning}</div>}
              {settings.backShow.mnemonic && card.mnemonic && (
                <div className="mnemonic-section"><span className="mnemonic-label">Mẹo nhớ</span><p className="mnemonic-text" style={{ fontSize: `${settings.backTextSize}px` }}>{card.mnemonic}</p></div>
              )}
              {settings.backShow.radicals && card.radicals.length > 0 && (
                <div className="radicals-section">
                  <span className="radicals-label">Bộ thủ</span>
                  <div className="radicals-list">{card.radicals.map((r, i) => <span key={i} className="radical-chip">{r}</span>)}</div>
                </div>
              )}
            </div>
            {settings.backShow.sampleWords && card.sampleWords.length > 0 && (
              <div className="back-section-right">
                <strong className="sample-words-label">Từ mẫu</strong>
                {card.sampleWords.map((sw, i) => (
                  <div key={i} className="sample-word">
                    <div className="sample-word-main"><span className="sample-word-text" style={{ fontSize: `${settings.backTextSize}px` }}>{sw.word}</span><span className="sample-word-reading" style={{ fontSize: `${settings.backTextSize * 0.85}px` }}>{sw.reading}</span></div>
                    <div className="sample-word-meaning" style={{ fontSize: `${settings.backTextSize * 0.8}px` }}>{sw.meaning}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
