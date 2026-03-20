// Quiz Battle Lobby — dramatic 1v1 battle lobby

import { Play, Swords, Shield, Zap } from 'lucide-react';
import type { QuizBattleGame } from '../pages/quiz-battle/quiz-battle-types';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';
import { isImageAvatar } from '../../utils/avatar-icons';
import { calculateRatingChanges } from '../../utils/elo-rating';
import './quiz-battle-common.css';
import './quiz-battle-lobby.css';

const QB_ACCENT = {
  accent: '#ef4444',
  accentDark: '#b91c1c',
  accentRgb: '239, 68, 68',
};

interface QuizBattleLobbyProps {
  game: QuizBattleGame;
  currentPlayerId: string;
  onStart: () => void;
  onLeave: () => void;
}

function PlayerAvatar({ player, side }: { player: { avatar?: string; displayName: string } | null; side: 'host' | 'challenger' }) {
  if (!player) return null;
  return (
    <div className={`qb-duel-avatar qb-duel-avatar-${side}`}>
      {player.avatar && isImageAvatar(player.avatar)
        ? <img src={player.avatar} alt={player.displayName} />
        : <span>{player.avatar || player.displayName.charAt(0).toUpperCase()}</span>}
    </div>
  );
}

export function QuizBattleLobby({ game, currentPlayerId, onStart, onLeave }: QuizBattleLobbyProps) {
  const players = Object.values(game.players);
  const hostPlayer = players.find(p => p.odinhId === game.hostId);
  const challengerPlayer = players.find(p => p.odinhId !== game.hostId);
  const bothPresent = !!(hostPlayer && challengerPlayer);

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
    const isHost = currentPlayerId === game.hostId;
    const myRating = isHost ? hostPlayer.rating : challengerPlayer.rating;
    const oppRating = isHost ? challengerPlayer.rating : hostPlayer.rating;
    const changes = calculateRatingChanges(myRating, oppRating);
    eloPreview = {
      win: changes.winnerChange,
      lose: changes.loserChange,
      diff: Math.abs(myRating - oppRating),
    };
  }

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Swords size={13} />1v1</span>
      <span className="pl-lobby-tag">JLPT {game.jlptLevel}</span>
      <span className="pl-lobby-tag">20 câu</span>
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {hostPlayer && (
        <LobbyHostCard
          displayName={hostPlayer.displayName}
          avatar={hostPlayer.avatar}
          role={hostPlayer.role}
        />
      )}

      {/* Dramatic VS arena */}
      <div className={`qb-duel-arena${bothPresent ? ' qb-duel-arena-live' : ''}`}>
        {/* Host side */}
        <div className="qb-duel-side qb-duel-side-host">
          <PlayerAvatar player={hostPlayer ?? null} side="host" />
          <div className="qb-duel-name">{hostPlayer?.displayName ?? '...'}</div>
          <div className="qb-duel-badges">
            <span className="qb-duel-crown">👑 HOST</span>
            {hostPlayer && <span className="qb-duel-elo qb-duel-elo-host">★ {hostPlayer.rating}</span>}
          </div>
        </div>

        {/* Center VS */}
        <div className={`qb-duel-vs${bothPresent ? ' qb-duel-vs-ignite' : ''}`}>
          <span className="qb-duel-vs-text">VS</span>
          {bothPresent && <span className="qb-duel-vs-fire">🔥</span>}
        </div>

        {/* Challenger side */}
        <div className="qb-duel-side qb-duel-side-challenger">
          {challengerPlayer ? (
            <>
              <PlayerAvatar player={challengerPlayer} side="challenger" />
              <div className="qb-duel-name">{challengerPlayer.displayName}</div>
              <div className="qb-duel-badges">
                <span className="qb-duel-elo qb-duel-elo-challenger">★ {challengerPlayer.rating}</span>
              </div>
            </>
          ) : (
            <div className="qb-duel-waiting">
              <div className="qb-duel-waiting-icon">⚔️</div>
              <div className="qb-duel-waiting-text">Đang chờ đối thủ...</div>
            </div>
          )}
        </div>
      </div>

      {/* ELO preview — shown when both present */}
      {eloPreview && (
        <div className="qb-elo-preview">
          <span className="qb-elo-diff">Chênh lệch: {eloPreview.diff} ELO</span>
          <span className="qb-elo-reward">
            <span className="qb-elo-win">Thắng: ~+{eloPreview.win}</span>
            <span className="qb-elo-sep">|</span>
            <span className="qb-elo-lose">Thua: ~{eloPreview.lose}</span>
          </span>
        </div>
      )}

      <LobbyJoinSection
        code={game.code}
        joinUrl={lobby.joinUrl}
        shareText={`Tham gia Đấu Trí: ${game.title}`}
        qrVisible={lobby.qrVisible}
        onToggleQr={() => lobby.setQrVisible(v => !v)}
      />

      {/* Rules */}
      <div className="qb-rules-card">
        <div className="qb-rules-title"><Swords size={14} /> Luật chiến đấu</div>
        <div className="qb-rules-list">
          <div className="qb-rule-item"><Zap size={12} className="qb-rule-icon-zap" />20 câu JLPT {game.jlptLevel} — trả lời nhanh = nhiều điểm hơn</div>
          <div className="qb-rule-item"><Shield size={12} className="qb-rule-icon-shield" />Mỗi câu 15 giây, không đổi sau khi chọn</div>
          <div className="qb-rule-item"><span className="qb-rule-icon-text">📈</span>Thắng: +ELO &nbsp;·&nbsp; Thua: −ELO</div>
        </div>
      </div>
    </>
  );

  const rightContent = (
    <div className="qb-right-status">
      {bothPresent
        ? <><span className="qb-status-ready">⚡ Sẵn sàng chiến!</span><span className="qb-status-sub">Host có thể bắt đầu trận đấu</span></>
        : <><span className="qb-status-wait">⏳ Chờ đối thủ...</span><span className="qb-status-sub">Chia sẻ mã phòng để đối thủ tham gia</span></>}
    </div>
  );

  const footerContent = (
    <LobbyStartFooter
      isHost={lobby.isHost}
      canStart={lobby.canStart}
      onStart={onStart}
      startIcon={<Play size={20} />}
      startLabel="Bắt Đầu Đấu Trí 🔥"
      disabledLabel="Cần 2 người chơi"
    />
  );

  return (
    <>
      <PremiumLobbyShell
        title={game.title}
        metaTags={metaTags}
        leftContent={leftContent}
        rightContent={rightContent}
        footerContent={footerContent}
        accent={QB_ACCENT}
        onLeave={onLeave}
        qrHidden={!lobby.qrVisible}
      />
      <LobbyConfirmModals
        isHost={lobby.isHost}
        showLeaveConfirm={false}
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
