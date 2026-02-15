// Game lobby/waiting room — full-screen premium immersive design
// Layout: PC = 2-column (host+QR | players), Mobile = stacked vertical
// All computed values memoized, callbacks stable, no inline object creation in render

import { QRCodeSVG } from 'qrcode.react';
import { Users, Clock, HelpCircle, Sparkles, Copy, Check, Share2, ChevronUp, ChevronDown, QrCode, LogOut } from 'lucide-react';
import { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { QuizGame } from '../../types/quiz-game';
import { PlayerListGrid, normalizePlayer } from '../shared/game-lobby';
import { isImageAvatar } from '../../utils/avatar-icons';
import { getVipNameClasses, getVipBadge, isVipRole } from '../../utils/vip-styling';
import { ConfirmModal } from '../ui/confirm-modal';

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

interface GameLobbyProps {
  game: QuizGame;
  isHost: boolean;
  currentPlayerId: string;
  onStartGame: () => Promise<boolean>;
  onKickPlayer: (playerId: string) => Promise<boolean>;
  onLeaveGame: () => Promise<void>;
  onUpdateHostMessage?: (message: string) => Promise<void>;
  onInviteFriends?: () => void;
  hasFriends?: boolean;
  error: string | null;
}

export function GameLobby({
  game,
  isHost,
  currentPlayerId,
  onStartGame,
  onKickPlayer,
  onLeaveGame,
  onUpdateHostMessage,
  onInviteFriends,
  hasFriends = false,
  error,
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sharingRef = useRef(false);

  // -- Derived player data (memoized) --
  const { hostPlayer, normalizedPlayers, playerCount, activePlayerCount, fillPercent } = useMemo(() => {
    const list = Object.values(game.players);
    return {
      hostPlayer: list.find(p => p.isHost),
      normalizedPlayers: list.map(p => normalizePlayer({
        id: p.id, name: p.name, avatar: p.avatar, isHost: p.isHost, role: p.role,
      })),
      playerCount: list.length,
      activePlayerCount: list.filter(p => !p.isSpectator).length,
      fillPercent: Math.min(100, (list.length / game.settings.maxPlayers) * 100),
    };
  }, [game.players, game.settings.maxPlayers]);

  const canStart = activePlayerCount >= game.settings.minPlayers;
  const joinUrl = `${window.location.origin}?join=${game.code}`;

  // -- Host VIP styling (memoized) --
  const hostVipBadge = useMemo(() => hostPlayer ? getVipBadge(hostPlayer.role) : null, [hostPlayer]);
  const hostNameClass = useMemo(() => {
    if (!hostPlayer) return 'qz-lobby-host-name';
    return isVipRole(hostPlayer.role)
      ? getVipNameClasses(hostPlayer.role, 'qz-lobby-host-name')
      : 'qz-lobby-host-name';
  }, [hostPlayer]);

  // -- Clipboard fallback for non-HTTPS (mobile via IP) --
  const copyText = useCallback((text: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    // Clear previous timer to prevent stacking
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  // -- Stable callbacks --
  const copyCode = useCallback(() => {
    copyText(game.code);
  }, [game.code, copyText]);

  const shareLink = useCallback(async () => {
    // Guard against rapid presses while share sheet is open
    if (sharingRef.current) return;
    sharingRef.current = true;
    try {
      if (navigator.share) {
        await navigator.share({ title: game.title, text: `Tham gia game: ${game.code}`, url: joinUrl });
      } else {
        copyText(joinUrl);
      }
    } catch { /* user cancelled */ }
    sharingRef.current = false;
  }, [game.title, game.code, joinUrl, copyText]);

  const toggleQr = useCallback(() => setQrVisible(v => !v), []);
  const handleKick = useCallback((id: string) => { setKickTarget(id); }, []);
  const handleKickConfirm = useCallback(async () => {
    if (!kickTarget) return;
    await onKickPlayer(kickTarget);
    setKickTarget(null);
  }, [kickTarget, onKickPlayer]);
  const handleStart = useCallback(async () => { await onStartGame(); }, [onStartGame]);
  const handleLeaveConfirm = useCallback(async () => {
    setShowLeaveConfirm(false);
    await onLeaveGame();
  }, [onLeaveGame]);

  // Debounced host message (500ms)
  const handleHostMessage = useCallback((value: string) => {
    if (!onUpdateHostMessage) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdateHostMessage(value.slice(0, 50)), 500);
  }, [onUpdateHostMessage]);

  return createPortal(
    <div className="qz-lobby">
      {/* Animated background */}
      <div className="qz-lobby-bg">
        <div className="qz-lobby-orb qz-lobby-orb-1" />
        <div className="qz-lobby-orb qz-lobby-orb-2" />
        <div className="qz-lobby-orb qz-lobby-orb-3" />
        <div className="qz-lobby-grid-pattern" />
      </div>

      {/* Header */}
      <header className="qz-lobby-header">
        <div className="qz-lobby-title-row">
          <button className="qz-lobby-leave-btn" onClick={() => setShowLeaveConfirm(true)} title="Rời phòng">
            <LogOut size={16} />
          </button>
          <div className="qz-lobby-icon-wrap">
            <Sparkles size={18} />
          </div>
          <div className="qz-lobby-title-text">
            <h1 className="qz-lobby-title">{game.title}</h1>
            <div className="qz-lobby-meta">
              <span className="qz-lobby-tag">
                <HelpCircle size={13} />
                {game.totalRounds} câu
              </span>
              <span className="qz-lobby-tag">
                <Clock size={13} />
                {game.timePerQuestion}s
              </span>
              <span className="qz-lobby-tag qz-lobby-tag-live">
                <span className="qz-lobby-live-dot" />
                Live
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Body: 2-column on PC, stacked on mobile */}
      <div className="qz-lobby-body">

        {/* LEFT: Host + QR */}
        <aside className={`qz-lobby-left${qrVisible ? '' : ' qr-hidden'}`}>
          {/* Host card */}
          {hostPlayer && (
            <div className="qz-lobby-host-card">
              <div className="qz-lobby-host-avatar">
                {hostPlayer.avatar && isImageAvatar(hostPlayer.avatar)
                  ? <img src={hostPlayer.avatar} alt={hostPlayer.name} />
                  : (hostPlayer.avatar || hostPlayer.name.charAt(0).toUpperCase())}
              </div>
              <div className="qz-lobby-host-info">
                <div className="qz-lobby-host-name-row">
                  <span className={hostNameClass} title={hostPlayer.name}>
                    {hostVipBadge && <span className="vip-badge">{hostVipBadge}</span>}
                    {hostPlayer.name}
                  </span>
                  <span className="qz-lobby-host-badge">Host</span>
                </div>
                {isHost ? (
                  <input
                    className="qz-lobby-host-msg-input"
                    type="text"
                    maxLength={50}
                    defaultValue={game.hostMessage || ''}
                    placeholder="Nhập lời nhắn cho phòng..."
                    onChange={e => handleHostMessage(e.target.value)}
                  />
                ) : game.hostMessage ? (
                  <span className="qz-lobby-host-msg">{game.hostMessage}</span>
                ) : null}
              </div>
            </div>
          )}

          {/* QR toggle */}
          <button className="qz-lobby-qr-toggle" onClick={toggleQr}>
            <QrCode size={16} />
            {qrVisible ? 'Ẩn QR' : 'Hiện QR'}
            {qrVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* QR + Code (collapsible) */}
          {qrVisible && (
            <div className="qz-lobby-join-section">
              <div className="qz-lobby-qr-container">
                <div className="qz-lobby-qr-glow" />
                <div className="qz-lobby-qr-scan-ring" />
                <div className="qz-lobby-qr-wrap">
                  <QRCodeSVG value={joinUrl} size={260} level="M" bgColor="transparent" fgColor="#ffffff" includeMargin={false} />
                </div>
                <span className="qz-lobby-qr-hint">Quét để tham gia</span>
              </div>
              <div className="qz-lobby-code-area">
                <span className="qz-lobby-code-label">MÃ PHÒNG</span>
                <div className="qz-lobby-code-row">
                  <span className="qz-lobby-code">{game.code}</span>
                  <button className={`qz-lobby-copy-btn ${copied ? 'copied' : ''}`} onClick={copyCode}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="qz-lobby-btn-group">
                  <button className="qz-lobby-share-btn" onClick={shareLink}>
                    <Share2 size={14} /> Chia sẻ
                  </button>
                  {onInviteFriends && hasFriends && (
                    <button className="qz-lobby-invite-btn" onClick={onInviteFriends}>
                      <Users size={14} /> Mời bạn bè
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT: Players */}
        <section className="qz-lobby-right">
          <div className="qz-lobby-players-header">
            <div className="qz-lobby-players-title">
              <Users size={18} />
              <span>Người chơi</span>
            </div>
            <div className="qz-lobby-capacity">
              <span className="qz-lobby-players-count">
                {playerCount}<span className="qz-lobby-players-max">/{game.settings.maxPlayers}</span>
              </span>
              <div className="qz-lobby-capacity-bar">
                <div className="qz-lobby-capacity-fill" style={{ width: `${fillPercent}%` }} />
              </div>
            </div>
          </div>

          <div className="qz-lobby-players-grid-wrap">
            <PlayerListGrid
              players={normalizedPlayers}
              hostId={hostPlayer?.id || ''}
              currentPlayerId={currentPlayerId}
              maxPlayers={game.settings.maxPlayers}
              onKickPlayer={handleKick}
              className="qz-lobby-players-grid"
              maxEmptySlots={6}
            />
          </div>

          {activePlayerCount < game.settings.minPlayers && (
            <div className="qz-lobby-waiting-hint">
              <div className="qz-lobby-waiting-dots"><span /><span /><span /></div>
              Đang chờ thêm {game.settings.minPlayers - activePlayerCount} người chơi
            </div>
          )}
        </section>
      </div>

      {/* Error */}
      {error && <p className="qz-lobby-error">{error}</p>}

      {/* Footer — start button only (leave moved to header) */}
      <footer className="qz-lobby-footer">
        {isHost ? (
          <button className="qz-lobby-start-btn" onClick={handleStart} disabled={!canStart}>
            {canStart ? 'Bắt đầu game' : `Cần ${game.settings.minPlayers} người chơi`}
          </button>
        ) : (
          <div className="qz-lobby-waiting-msg">Đang chờ host bắt đầu...</div>
        )}
      </footer>

      {/* Leave confirmation modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi phòng?"
        message={isHost
          ? 'Bạn là host. Nếu bạn rời đi, phòng sẽ bị huỷ và tất cả người chơi sẽ bị đuổi ra.'
          : 'Bạn có chắc muốn rời khỏi phòng chơi này?'}
        confirmText="Rời phòng"
        cancelText="Ở lại"
        onConfirm={handleLeaveConfirm}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      {/* Kick confirmation modal */}
      <ConfirmModal
        isOpen={!!kickTarget}
        title="Kick người chơi?"
        message={`Bạn có chắc muốn kick "${normalizedPlayers.find(p => p.id === kickTarget)?.displayName || ''}" khỏi phòng?`}
        confirmText="Kick"
        cancelText="Huỷ"
        onConfirm={handleKickConfirm}
        onCancel={() => setKickTarget(null)}
      />
    </div>,
    document.body,
  );
}
