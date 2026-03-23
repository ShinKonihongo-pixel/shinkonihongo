// Hán Việt tooltip — hover over kanji to see Sino-Vietnamese reading

import { useState } from 'react';
import { lookupHanViet } from '../../data/han-viet-dictionary';
import './han-viet-tooltip.css';

interface HanVietTooltipProps {
  text: string;         // Text containing kanji
  showAlways?: boolean; // Show Hán Việt inline instead of tooltip
}

export function HanVietTooltip({ text, showAlways = false }: HanVietTooltipProps) {
  const [hoveredChar, setHoveredChar] = useState<{ char: string; x: number; y: number } | null>(null);

  const chars = text.split('');
  const hoveredEntry = hoveredChar ? lookupHanViet(hoveredChar.char) : null;

  if (showAlways) {
    return (
      <span className="hv-inline">
        {chars.map((char, i) => {
          const entry = lookupHanViet(char);
          if (!entry) return <span key={i}>{char}</span>;
          return (
            <span key={i} className="hv-annotated">
              <span className="hv-char">{char}</span>
              <span className="hv-reading">{entry.hanViet}</span>
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className="hv-text">
      {chars.map((char, i) => {
        const entry = lookupHanViet(char);
        if (!entry) return <span key={i}>{char}</span>;
        return (
          <span
            key={i}
            className="hv-kanji"
            onMouseEnter={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setHoveredChar({ char, x: rect.left, y: rect.bottom });
            }}
            onMouseLeave={() => setHoveredChar(null)}
          >
            {char}
          </span>
        );
      })}
      {hoveredEntry && hoveredChar && (
        <span
          className="hv-tooltip"
          style={{ left: hoveredChar.x, top: hoveredChar.y + 4 }}
        >
          <span className="hv-tooltip-hv">{hoveredEntry.hanViet}</span>
          <span className="hv-tooltip-meaning">{hoveredEntry.meaning}</span>
          {hoveredEntry.examples && (
            <span className="hv-tooltip-examples">
              {hoveredEntry.examples.slice(0, 2).join(', ')}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
