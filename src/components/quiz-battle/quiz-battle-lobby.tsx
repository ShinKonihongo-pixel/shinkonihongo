// Quiz Battle Lobby — 1v1 competitive lobby with red/gold battle theme

import { Play, Swords, UserPlus } from 'lucide-react';
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
import './quiz-battle.css';

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

export function QuizBattleLobby({ game, currentPlayerId, onStart, onLeave }: QuizBattleLobbyProps) {
  const players = Object.values(game.players);
  const hostPlayer = players.find(p => p.odinhId === game.hostId);
  const challengerPlayer = players.find(p => p.odinhId !== game.hostId);

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

      <div className="qb-lobby-players-row">
        {/* Host card */}
        <div className="qb-lobby-player-card qb-lobby-host">
          <div className="qb-lobby-player-avatar">
            {hostPlayer?.avatar && isImageAvatar(hostPlayer.avatar)
              ? <img src={hostPlayer.avatar} alt={hostPlayer.displayName} />
              : <span>{hostPlayer?.avatar || hostPlayer?.displayName.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="qb-lobby-player-name">{hostPlayer?.displayName ?? '...'}</div>
          {hostPlayer && (
            <div className="qb-lobby-rating-badge">
              ★ {hostPlayer.rating}
            </div>
          )}
        </div>

        {/* VS badge */}
        <div className="qb-vs">VS</div>

        {/* Challenger slot */}
        {challengerPlayer ? (
          <div className="qb-lobby-player-card">
            <div className="qb-lobby-player-avatar">
              {challengerPlayer.avatar && isImageAvatar(challengerPlayer.avatar)
                ? <img src={challengerPlayer.avatar} alt={challengerPlayer.displayName} />
                : <span>{challengerPlayer.avatar || challengerPlayer.displayName.charAt(0).toUpperCase()}</span>}
            </div>
            <div className="qb-lobby-player-name">{challengerPlayer.displayName}</div>
            <div className="qb-lobby-rating-badge">★ {challengerPlayer.rating}</div>
          </div>
        ) : (
          <div className="qb-lobby-challenger-slot">
            <UserPlus size={28} />
            <span>Đang chờ...</span>
          </div>
        )}
      </div>

      <LobbyJoinSection
        code={game.code}
        joinUrl={lobby.joinUrl}
        shareText={`Tham gia Đấu Trí: ${game.title}`}
        qrVisible={lobby.qrVisible}
        onToggleQr={() => lobby.setQrVisible(v => !v)}
      />

      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>20 câu JLPT {game.jlptLevel} — trả lời nhanh = nhiều điểm</li>
          <li>Mỗi câu có 15 giây, không thể thay đổi sau khi chọn</li>
          <li>Thắng: +ELO, Thua: −ELO</li>
        </ul>
      </div>
    </>
  );

  const rightContent = (
    <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>
      {players.length < 2
        ? 'Chia sẻ mã phòng để đối thủ tham gia'
        : 'Đã đủ 2 người — Host có thể bắt đầu!'}
    </div>
  );

  const footerContent = (
    <LobbyStartFooter
      isHost={lobby.isHost}
      canStart={lobby.canStart}
      onStart={onStart}
      startIcon={<Play size={20} />}
      startLabel="Bắt Đầu Đấu Trí"
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
