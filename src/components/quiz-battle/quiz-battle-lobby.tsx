// Quiz Battle Lobby — dramatic 1v1 battle lobby (centered duel arena)

import { Play, Swords, Shield, Zap } from 'lucide-react';
import type { QuizBattleGame } from '../pages/quiz-battle/quiz-battle-types';
import {
  LobbyJoinSection,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';
import { isImageAvatar } from '../../utils/avatar-icons';
import { calculateRatingChanges } from '../../utils/elo-rating';
import './quiz-battle-common.css';
import './quiz-battle-lobby.css';

interface QuizBattleLobbyProps {
  game: QuizBattleGame;
  currentPlayerId: string;
  onStart: () => void;
  onLeave: () => void;
}

/** Safe avatar renderer — handles missing displayName/avatar gracefully */
function PlayerAvatar({ player, side }: { player: { avatar?: string; displayName?: string } | null; side: 'host' | 'challenger' }) {
  if (!player) return null;
  const initial = player.displayName?.charAt(0)?.toUpperCase() || '?';
  const hasImage = player.avatar && isImageAvatar(player.avatar);
  return (
    <div className={`qb-avatar qb-avatar-${side}`}>
      {hasImage
        ? <img src={player.avatar} alt={player.displayName || ''} loading="lazy" />
        : <span className="qb-avatar-letter">{player.avatar || initial}</span>}
    </div>
  );
}

export function QuizBattleLobby({ game, currentPlayerId, onStart, onLeave }: QuizBattleLobbyProps) {
  const players = Object.values(game.players);
  const hostPlayer = players.find(p => p.odinhId === game.hostId) ?? null;
  const challengerPlayer = players.find(p => p.odinhId !== game.hostId) ?? null;
  const bothPresent = !!(hostPlayer && challengerPlayer);
  const isHost = currentPlayerId === game.hostId;

  const lobby = useLobbyState(
    {
      players: game.players,
      hostId: game.hostId,
      currentPlayerId,
      maxPlayers: game.settings.maxPlayers,
      minPlayers: game.settings.minPlayers,
      code: game.code,
    },
    { gameSlug: 'quiz-battle' },
  );

  // ELO preview when both players present
  let eloPreview: { win: number; lose: number; diff: number } | null = null;
  if (bothPresent && hostPlayer && challengerPlayer) {
    const myRating = isHost ? hostPlayer.rating : challengerPlayer.rating;
    const oppRating = isHost ? challengerPlayer.rating : hostPlayer.rating;
    const changes = calculateRatingChanges(myRating, oppRating);
    eloPreview = {
      win: changes.winnerChange,
      lose: changes.loserChange,
      diff: Math.abs(myRating - oppRating),
    };
  }

  return (
    <>
      <div className="qb-lobby">
        {/* Background effects */}
        <div className="qb-lobby-bg">
          <div className="qb-lobby-orb qb-lobby-orb-1" />
          <div className="qb-lobby-orb qb-lobby-orb-2" />
        </div>

        {/* Header */}
        <header className="qb-lobby-header">
          <button className="qb-lobby-leave" onClick={() => { console.log('Leave button clicked, showLeaveConfirm:', lobby.showLeaveConfirm); lobby.openLeaveConfirm(); }} title="Rời phòng">✕</button>
          <h1 className="qb-lobby-title">{game.title}</h1>
          <div className="qb-lobby-tags">
            <span className="qb-tag"><Swords size={12} /> 1v1</span>
            <span className="qb-tag">JLPT {game.jlptLevel}</span>
            <span className="qb-tag">20 câu</span>
            <span className="qb-tag qb-tag-live"><span className="qb-live-dot" />Live</span>
          </div>
        </header>

        {/* ─── Centered Duel Arena ─── */}
        <div className={`qb-arena${bothPresent ? ' qb-arena-live' : ''}`}>
          {/* Host side */}
          <div className="qb-fighter qb-fighter-host">
            <PlayerAvatar player={hostPlayer} side="host" />
            <div className="qb-fighter-info">
              <span className="qb-fighter-name">{hostPlayer?.displayName ?? '...'}</span>
              <span className="qb-badge qb-badge-host">👑 HOST</span>
              {hostPlayer && <span className="qb-elo qb-elo-host">★ {hostPlayer.rating}</span>}
            </div>
          </div>

          {/* VS divider */}
          <div className={`qb-vs${bothPresent ? ' qb-vs-fire' : ''}`}>
            <span className="qb-vs-text">VS</span>
            {bothPresent && <span className="qb-vs-flame">🔥</span>}
          </div>

          {/* Challenger side */}
          <div className="qb-fighter qb-fighter-challenger">
            {challengerPlayer ? (
              <>
                <PlayerAvatar player={challengerPlayer} side="challenger" />
                <div className="qb-fighter-info">
                  <span className="qb-fighter-name">{challengerPlayer.displayName}</span>
                  <span className="qb-elo qb-elo-challenger">★ {challengerPlayer.rating}</span>
                </div>
              </>
            ) : (
              <div className="qb-waiting-slot">
                <div className="qb-waiting-ring">
                  <span>?</span>
                </div>
                <span className="qb-waiting-label">Chờ đối thủ...</span>
              </div>
            )}
          </div>
        </div>

        {/* ELO preview */}
        {eloPreview && (
          <div className="qb-elo-bar">
            <span className="qb-elo-diff">Chênh lệch: {eloPreview.diff} ELO</span>
            <span className="qb-elo-changes">
              <span className="qb-elo-win">Thắng +{eloPreview.win}</span>
              <span className="qb-elo-sep">·</span>
              <span className="qb-elo-lose">Thua {eloPreview.lose}</span>
            </span>
          </div>
        )}

        {/* Status message */}
        <div className="qb-status">
          {bothPresent
            ? <span className="qb-status-ready">⚡ Sẵn sàng chiến!</span>
            : <span className="qb-status-wait">⏳ Chia sẻ mã phòng để mời đối thủ</span>}
        </div>

        {/* Join section */}
        <LobbyJoinSection
          code={game.code}
          joinUrl={lobby.joinUrl}
          shareText={`Tham gia Đấu Trí: ${game.title}`}
          qrVisible={lobby.qrVisible}
          onToggleQr={() => lobby.setQrVisible(v => !v)}
        />

        {/* Rules */}
        <div className="qb-rules">
          <div className="qb-rules-heading"><Swords size={13} /> Luật chiến đấu</div>
          <div className="qb-rules-list">
            <div className="qb-rule"><Zap size={12} className="qb-rule-zap" /> 20 câu JLPT {game.jlptLevel} — nhanh = nhiều điểm</div>
            <div className="qb-rule"><Shield size={12} className="qb-rule-shield" /> 15 giây/câu, không đổi sau khi chọn</div>
            <div className="qb-rule"><span className="qb-rule-emoji">📈</span> Thắng: +ELO · Thua: −ELO</div>
          </div>
        </div>

        {/* Start / waiting footer */}
        <div className="qb-lobby-footer">
          <LobbyStartFooter
            isHost={isHost}
            canStart={lobby.canStart}
            onStart={onStart}
            startIcon={<Play size={20} />}
            startLabel="Bắt Đầu Đấu Trí 🔥"
            disabledLabel="Cần 2 người chơi"
          />
        </div>
      </div>

      <LobbyConfirmModals
        isHost={isHost}
        showLeaveConfirm={lobby.showLeaveConfirm}
        kickTarget={null}
        normalizedPlayers={lobby.normalizedPlayers}
        onLeaveConfirm={onLeave}
        onLeaveCancel={lobby.closeLeaveConfirm}
        onKickConfirm={lobby.handleKickConfirm}
        onKickCancel={lobby.closeKickConfirm}
      />
    </>
  );
}
