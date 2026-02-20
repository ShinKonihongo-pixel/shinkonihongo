// Golden Bell Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Routes to GoldenBellTeamLobby when in team mode

import { Bell, Clock, HelpCircle, Layers } from 'lucide-react';
import type { GoldenBellGame } from '../../types/golden-bell';
import { CATEGORY_INFO } from '../../types/golden-bell';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';
import { GoldenBellTeamLobby } from './golden-bell-team-lobby';

const GB_ACCENT = {
  accent: '#f4c430',
  accentDark: '#d4a420',
  accentRgb: '244, 196, 48',
};

interface GoldenBellLobbyProps {
  game: GoldenBellGame;
  isHost: boolean;
  currentPlayerId: string;
  onStart: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
  onJoinTeam?: (playerId: string, teamId: string) => void;
  onShuffleTeams?: () => void;
}

export function GoldenBellLobby({
  game, isHost, currentPlayerId, onStart, onLeave,
  onKickPlayer, onJoinTeam, onShuffleTeams,
}: GoldenBellLobbyProps) {
  // Call hooks unconditionally (before any early return)
  const lobby = useLobbyState(
    {
      players: game.players,
      hostId: game.hostId,
      currentPlayerId,
      maxPlayers: game.settings.maxPlayers,
      minPlayers: game.settings.minPlayers,
      code: game.code,
      onKickPlayer,
    },
    { gameSlug: 'golden-bell' },
  );

  // Route to team lobby when in team mode
  if (game.settings.gameMode === 'team' && game.teams && onJoinTeam && onShuffleTeams) {
    return (
      <GoldenBellTeamLobby
        game={game}
        isHost={isHost}
        currentPlayerId={currentPlayerId}
        onStart={onStart}
        onLeave={onLeave}
        onJoinTeam={onJoinTeam}
        onShuffleTeams={onShuffleTeams}
      />
    );
  }

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Layers size={13} />{game.settings.jlptLevel}</span>
      <span className="pl-lobby-tag"><HelpCircle size={13} />{game.settings.questionCount} câu</span>
      <span className="pl-lobby-tag"><Clock size={13} />{game.settings.timePerQuestion}s</span>
      {game.settings.categories.map(cat => (
        <span key={cat} className="pl-lobby-tag pl-lobby-tag-accent">
          {CATEGORY_INFO[cat].emoji} {CATEGORY_INFO[cat].name}
        </span>
      ))}
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={(lobby.hostPlayer as any).role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Rung Chuông Vàng: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>Trả lời sai = Bị loại khỏi game</li>
          <li>Không trả lời = Bị loại</li>
          <li>Người cuối cùng tồn tại = Chiến thắng</li>
          <li>Hết câu hỏi, còn nhiều người = Ai đúng nhiều nhất thắng</li>
        </ul>
      </div>
    </>
  );

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={game.settings.minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={isHost} canStart={lobby.canStart} loading={false} onStart={onStart} startIcon={<Bell size={20} />} startLabel="Bắt Đầu Game" disabledLabel={`Cần ${game.settings.minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={GB_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
      <LobbyConfirmModals
        isHost={isHost}
        showLeaveConfirm={false}
        kickTarget={lobby.kickTarget}
        normalizedPlayers={lobby.normalizedPlayers}
        onLeaveConfirm={onLeave}
        onLeaveCancel={lobby.closeLeaveConfirm}
        onKickConfirm={lobby.handleKickConfirm}
        onKickCancel={lobby.closeKickConfirm}
      />
    </>
  );
}
