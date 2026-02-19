// Premium Lobby Shell — Full-screen portal with animated background + layout
// Reusable across all game lobbies. Themed via CSS custom properties.

import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import './premium-lobby.css';

export interface PremiumLobbyAccent {
  /** Primary accent color, e.g. '#E040FB' */
  accent: string;
  /** Darker accent, e.g. '#9C27B0' */
  accentDark: string;
  /** RGB triplet for rgba(), e.g. '224, 64, 251' */
  accentRgb: string;
}

interface PremiumLobbyShellProps {
  /** Game title displayed in header */
  title: string;
  /** Meta tag elements rendered next to title */
  metaTags?: ReactNode;
  /** Left column content (host card, QR, rules) */
  leftContent: ReactNode;
  /** Right column content (players grid) */
  rightContent: ReactNode;
  /** Footer content (start button / waiting message) */
  footerContent: ReactNode;
  /** Accent color theme */
  accent: PremiumLobbyAccent;
  /** Called when leave button is clicked */
  onLeave: () => void;
  /** Whether QR section is hidden (shrinks left column) */
  qrHidden?: boolean;
}

export function PremiumLobbyShell({
  title,
  metaTags,
  leftContent,
  rightContent,
  footerContent,
  accent,
  onLeave,
  qrHidden = false,
}: PremiumLobbyShellProps) {
  const cssVars = {
    '--pl-accent': accent.accent,
    '--pl-accent-dark': accent.accentDark,
    '--pl-accent-rgb': accent.accentRgb,
  } as React.CSSProperties;

  return createPortal(
    <div className="pl-lobby" style={cssVars}>
      {/* Animated background */}
      <div className="pl-lobby-bg">
        <div className="pl-lobby-orb pl-lobby-orb-1" />
        <div className="pl-lobby-orb pl-lobby-orb-2" />
        <div className="pl-lobby-orb pl-lobby-orb-3" />
        <div className="pl-lobby-grid-pattern" />
      </div>

      {/* Header */}
      <header className="pl-lobby-header">
        <div className="pl-lobby-title-row">
          <button className="pl-lobby-leave-btn" onClick={onLeave} title="Rời phòng">
            <LogOut size={16} />
          </button>
          <div className="pl-lobby-title-text">
            <h1 className="pl-lobby-title">{title}</h1>
            {metaTags && <div className="pl-lobby-meta">{metaTags}</div>}
          </div>
        </div>
      </header>

      {/* Body: 2-column on PC, stacked on mobile */}
      <div className="pl-lobby-body">
        <aside className={`pl-lobby-left${qrHidden ? ' qr-hidden' : ''}`}>
          {leftContent}
        </aside>
        <section className="pl-lobby-right">
          {rightContent}
        </section>
      </div>

      {/* Footer */}
      <footer className="pl-lobby-footer">
        {footerContent}
      </footer>
    </div>,
    document.body,
  );
}
