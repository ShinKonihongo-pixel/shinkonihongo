// Golden Bell Team Lobby — horizontal team columns layout
// Shows teams as colored columns, players choose which to join

import { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Clock, HelpCircle, Copy, Check, Share2, LogOut, Bell, Layers, Shuffle, ChevronUp, ChevronDown, QrCode } from 'lucide-react';
import type { GoldenBellGame } from '../../types/golden-bell';
import { GB_TEAM_COLORS } from '../../types/golden-bell';
import { isImageAvatar } from '../../utils/avatar-icons';
// Share2 imported but only used if we add share in future — suppress lint by referencing it
void Share2;

interface GoldenBellTeamLobbyProps {
  game: GoldenBellGame;
  isHost: boolean;
  currentPlayerId: string;
  onStart: () => void;
  onLeave: () => void;
  onJoinTeam: (playerId: string, teamId: string) => void;
  onShuffleTeams: () => void;
}

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

export function GoldenBellTeamLobby({
  game,
  isHost,
  currentPlayerId,
  onStart,
  onLeave,
  onJoinTeam,
  onShuffleTeams,
}: GoldenBellTeamLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teams = useMemo(() => {
    if (!game.teams) return [];
    return Object.values(game.teams);
  }, [game.teams]);

  const playerCount = Object.keys(game.players).length;
  const maxPerTeam = game.settings.maxPlayersPerTeam || 6;
  const currentPlayerTeamId = game.players[currentPlayerId]?.teamId;
  const joinUrl = `${window.location.origin}?game=golden-bell&join=${game.code}`;

  // All teams need >= 2 members to start
  const canStart = useMemo(() => {
    if (playerCount < game.settings.minPlayers) return false;
    if (!game.teams) return false;
    return Object.values(game.teams).every(t => t.members.length >= 2);
  }, [playerCount, game.settings.minPlayers, game.teams]);

  const copyCode = useCallback(() => {
    const text = game.code;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [game.code]);

  return createPortal(
    <div className="gb-lobby gb-team-lobby">
      {/* Animated background */}
      <div className="gb-lobby-bg">
        <div className="gb-lobby-orb gb-lobby-orb-1" />
        <div className="gb-lobby-orb gb-lobby-orb-2" />
        <div className="gb-lobby-orb gb-lobby-orb-3" />
        <div className="gb-lobby-grid-pattern" />
      </div>

      {/* Header */}
      <header className="gb-lobby-header">
        <div className="gb-lobby-title-row">
          <button
            className="gb-lobby-leave-btn"
            onClick={onLeave}
            title="Roi phong"
          >
            <LogOut size={16} />
          </button>

          <div className="gb-lobby-title-text">
            <h1 className="gb-lobby-title">{game.title}</h1>
            <div className="gb-lobby-meta">
              <span className="gb-lobby-tag">
                <Users size={13} />
                Che do doi ({teams.length} doi)
              </span>
              <span className="gb-lobby-tag">
                <Layers size={13} />
                {game.settings.jlptLevel}
              </span>
              <span className="gb-lobby-tag">
                <HelpCircle size={13} />
                {game.settings.questionCount} cau
              </span>
              <span className="gb-lobby-tag">
                <Clock size={13} />
                {game.settings.timePerQuestion}s
              </span>
              <span className="gb-lobby-tag gb-lobby-tag-live">
                <span className="gb-lobby-live-dot" />
                {playerCount} nguoi
              </span>
            </div>
          </div>

          {/* Code + QR toggle */}
          <div className="gb-team-header-right">
            <div className="gb-lobby-code-row">
              <span className="gb-lobby-code" style={{ fontSize: '1.2rem' }}>{game.code}</span>
              <button
                className={`gb-lobby-copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyCode}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              className="gb-lobby-qr-toggle gb-team-qr-toggle"
              onClick={() => setQrVisible(v => !v)}
            >
              <QrCode size={14} />
              {qrVisible ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* QR collapsible */}
        {qrVisible && (
          <div className="gb-team-qr-row">
            <div className="gb-lobby-qr-wrap" style={{ padding: '0.5rem' }}>
              <QRCodeSVG
                value={joinUrl}
                size={120}
                level="M"
                bgColor="transparent"
                fgColor="#ffffff"
                includeMargin={false}
              />
            </div>
          </div>
        )}
      </header>

      {/* Team columns */}
      <div className="gb-team-columns">
        {teams.map(team => {
          const color = GB_TEAM_COLORS[team.colorKey];
          const isFull = team.members.length >= maxPerTeam;
          const isMyTeam = currentPlayerTeamId === team.id;

          return (
            <div
              key={team.id}
              className={`gb-team-column${isMyTeam ? ' my-team' : ''}`}
              style={{ '--team-color': color.color } as React.CSSProperties}
            >
              <div className="gb-team-column-header">
                <span className="gb-team-emoji">{team.emoji}</span>
                <span className="gb-team-name">{team.name}</span>
                <span className="gb-team-count">{team.members.length}/{maxPerTeam}</span>
              </div>

              <div className="gb-team-members">
                {team.members.map(pid => {
                  const player = game.players[pid];
                  if (!player) return null;
                  const playerIsHost = pid === game.hostId;
                  const isMe = pid === currentPlayerId;
                  return (
                    <div
                      key={pid}
                      className={`gb-team-member${isMe ? ' me' : ''}${playerIsHost ? ' host' : ''}`}
                    >
                      <div className="gb-team-member-avatar">
                        {player.avatar && isImageAvatar(player.avatar)
                          ? <img src={player.avatar} alt={player.displayName} />
                          : (player.avatar || '?')}
                      </div>
                      <span className="gb-team-member-name">{player.displayName}</span>
                      {playerIsHost && <span className="gb-team-host-badge">Host</span>}
                      {player.isBot && <span className="gb-team-bot-badge">Bot</span>}
                    </div>
                  );
                })}

                {/* Empty slot indicators (show up to 2 empty slots) */}
                {Array.from({ length: Math.max(0, 2 - team.members.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="gb-team-member empty">
                    <div className="gb-team-member-avatar">?</div>
                    <span className="gb-team-member-name">Trong</span>
                  </div>
                ))}
              </div>

              {/* Action area */}
              {!isMyTeam && !isFull && (
                <button
                  className="gb-team-join-btn"
                  onClick={() => onJoinTeam(currentPlayerId, team.id)}
                  style={{ background: color.color }}
                >
                  Vao doi
                </button>
              )}
              {isMyTeam && (
                <div className="gb-team-current-badge">Doi cua ban</div>
              )}
              {!isMyTeam && isFull && (
                <div className="gb-team-full-badge">Da day</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="gb-lobby-footer">
        {isHost ? (
          <div className="gb-team-footer-row">
            <button className="gb-team-shuffle-btn" onClick={onShuffleTeams}>
              <Shuffle size={16} /> Xao tron doi
            </button>
            <button
              className="gb-lobby-start-btn"
              onClick={onStart}
              disabled={!canStart}
            >
              <Bell size={20} />
              {canStart ? 'Bat Dau Game' : 'Moi doi can it nhat 2 nguoi'}
            </button>
          </div>
        ) : (
          <div className="gb-lobby-waiting-msg">Dang cho host bat dau...</div>
        )}
      </footer>

    </div>,
    document.body,
  );
}
