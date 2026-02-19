// Lobby Join Section — QR code + room code + copy/share buttons
// Reusable across all premium game lobbies

import { useState, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, QrCode, ChevronUp, ChevronDown } from 'lucide-react';

// Fallback copy for non-HTTPS contexts (mobile via LAN IP)
function fallbackCopy(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

interface LobbyJoinSectionProps {
  code: string;
  joinUrl: string;
  shareText: string;
  /** Controls QR visibility from parent */
  qrVisible: boolean;
  onToggleQr: () => void;
}

export function LobbyJoinSection({ code, joinUrl, shareText, qrVisible, onToggleQr }: LobbyJoinSectionProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sharingRef = useRef(false);

  const copyText = useCallback((text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const copyCode = useCallback(() => copyText(code), [code, copyText]);

  const shareLink = useCallback(async () => {
    if (sharingRef.current) return;
    sharingRef.current = true;
    try {
      if (navigator.share) {
        await navigator.share({ title: shareText, text: `${shareText}: ${code}`, url: joinUrl });
      } else {
        copyText(joinUrl);
      }
    } catch { /* user cancelled */ }
    sharingRef.current = false;
  }, [shareText, code, joinUrl, copyText]);

  return (
    <>
      {/* QR toggle */}
      <button className="pl-lobby-qr-toggle" onClick={onToggleQr}>
        <QrCode size={16} />
        {qrVisible ? 'Ẩn QR' : 'Hiện QR'}
        {qrVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* QR + Code (collapsible) */}
      {qrVisible && (
        <div className="pl-lobby-join-section">
          <div className="pl-lobby-qr-container">
            <div className="pl-lobby-qr-glow" />
            <div className="pl-lobby-qr-scan-ring" />
            <div className="pl-lobby-qr-wrap">
              <QRCodeSVG value={joinUrl} size={260} level="M" bgColor="transparent" fgColor="#ffffff" includeMargin={false} />
            </div>
            <span className="pl-lobby-qr-hint">Quét để tham gia</span>
          </div>
          <div className="pl-lobby-code-area">
            <span className="pl-lobby-code-label">MÃ PHÒNG</span>
            <div className="pl-lobby-code-row">
              <span className="pl-lobby-code">{code}</span>
              <button className={`pl-lobby-copy-btn ${copied ? 'copied' : ''}`} onClick={copyCode}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="pl-lobby-btn-group">
              <button className="pl-lobby-share-btn" onClick={shareLink}>
                <Share2 size={14} /> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
