// Golden Bell Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Thin wrapper: provides Golden Bell-specific accent color, meta tags, rules, and settings
// Routes to GoldenBellTeamLobby when in team mode

import { useState, useMemo, useCallback } from 'react';
import { Bell, Clock, HelpCircle, Layers } from 'lucide-react';
import type { GoldenBellGame } from '../../types/golden-bell';
import { CATEGORY_INFO } from '../../types/golden-bell';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  normalizePlayer,
} from '../shared/game-lobby';
import { ConfirmModal } from '../ui/confirm-modal';
import { GoldenBellTeamLobby } from './golden-bell-team-lobby';

// Golden Bell accent: gold/amber
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
  game,
  isHost,
  currentPlayerId,
  onStart,
  onLeave,
  onKickPlayer,
  onJoinTeam,
  onShuffleTeams,
}: GoldenBellLobbyProps) {
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

  const [qrVisible, setQrVisible] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const { hostPlayer, normalizedPlayers, playerCount, fillPercent } = useMemo(() => {
    const list = Object.values(game.players);
    return {
      hostPlayer: list.find(p => p.odinhId === game.hostId),
      normalizedPlayers: list.map(p => normalizePlayer({
        ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId,
      })),
      playerCount: list.length,
      fillPercent: Math.min(100, (list.length / game.settings.maxPlayers) * 100),
    };
  }, [game.players, game.settings.maxPlayers, game.hostId]);

  const canStart = playerCount >= game.settings.minPlayers;
  const joinUrl = `${window.location.origin}?game=golden-bell&join=${game.code}`;

  const handleKick = useCallback((id: string) => setKickTarget(id), []);
  const handleKickConfirm = useCallback(() => {
    if (!kickTarget || !onKickPlayer) return;
    onKickPlayer(kickTarget);
    setKickTarget(null);
  }, [kickTarget, onKickPlayer]);

  // Meta tags
  const metaTags = (
    <>
      <span className="pl-lobby-tag">
        <Layers size={13} />
        {game.settings.jlptLevel}
      </span>
      <span className="pl-lobby-tag">
        <HelpCircle size={13} />
        {game.settings.questionCount} câu
      </span>
      <span className="pl-lobby-tag">
        <Clock size={13} />
        {game.settings.timePerQuestion}s
      </span>
      {game.settings.categories.map(cat => (
        <span key={cat} className="pl-lobby-tag pl-lobby-tag-accent">
          {CATEGORY_INFO[cat].emoji} {CATEGORY_INFO[cat].name}
        </span>
      ))}
      <span className="pl-lobby-tag pl-lobby-tag-live">
        <span className="pl-lobby-live-dot" />
        Live
      </span>
    </>
  );

  // Left column: host card, QR/join, rules
  const leftContent = (
    <>
      {hostPlayer && (
        <LobbyHostCard
          displayName={hostPlayer.displayName}
          avatar={hostPlayer.avatar}
          role={(hostPlayer as any).role}
        />
      )}
      <LobbyJoinSection
        code={game.code}
        joinUrl={joinUrl}
        shareText={`Tham gia Rung Chuông Vàng: ${game.title}`}
        qrVisible={qrVisible}
        onToggleQr={() => setQrVisible(v => !v)}
      />
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

  // Right column: players panel
  const rightContent = (
    <LobbyPlayersPanel
      players={normalizedPlayers}
      hostId={game.hostId}
      currentPlayerId={currentPlayerId}
      maxPlayers={game.settings.maxPlayers}
      playerCount={playerCount}
      fillPercent={fillPercent}
      minPlayers={game.settings.minPlayers}
      onKickPlayer={handleKick}
    />
  );

  // Footer
  const footerContent = (
    <LobbyStartFooter
      isHost={isHost}
      canStart={canStart}
      loading={false}
      onStart={onStart}
      startIcon={<Bell size={20} />}
      startLabel="Bắt Đầu Game"
      disabledLabel={`Cần ${game.settings.minPlayers} người chơi`}
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
        accent={GB_ACCENT}
        onLeave={() => setShowLeaveConfirm(true)}
        qrHidden={!qrVisible}
      />

      {/* Leave confirmation modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi phòng?"
        message={isHost
          ? 'Bạn là host. Nếu bạn rời đi, phòng sẽ bị huỷ và tất cả người chơi sẽ bị đuổi ra.'
          : 'Bạn có chắc muốn rời khỏi phòng chơi này?'}
        confirmText="Rời phòng"
        cancelText="Ở lại"
        onConfirm={() => { setShowLeaveConfirm(false); onLeave(); }}
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
    </>
  );
}
