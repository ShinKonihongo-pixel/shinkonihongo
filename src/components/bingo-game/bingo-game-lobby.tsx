// Bingo Game Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Thin wrapper: provides Bingo-specific accent color, meta tags, rules, and settings

import { useState, useMemo, useCallback } from 'react';
import { Grid3X3, Clock, Sparkles, Layers } from 'lucide-react';
import type { BingoGame } from '../../types/bingo-game';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  normalizePlayer,
} from '../shared/game-lobby';
import { ConfirmModal } from '../ui/confirm-modal';

// Bingo accent: purple/magenta
const BINGO_ACCENT = {
  accent: '#E040FB',
  accentDark: '#9C27B0',
  accentRgb: '224, 64, 251',
};

interface BingoGameLobbyProps {
  game: BingoGame;
  isHost: boolean;
  currentPlayerId: string;
  loading: boolean;
  onStartGame: () => void;
  onLeaveGame: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function BingoGameLobby({
  game,
  isHost,
  currentPlayerId,
  loading,
  onStartGame,
  onLeaveGame,
  onKickPlayer,
}: BingoGameLobbyProps) {
  const [qrVisible, setQrVisible] = useState(true);
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
  const joinUrl = `${window.location.origin}?game=bingo&join=${game.code}`;

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
        <Grid3X3 size={13} />
        {game.settings.rowsPerPlayer} dãy × {game.settings.numbersPerRow} số
      </span>
      <span className="pl-lobby-tag">
        <Clock size={13} />
        {game.settings.timePerQuestion}s/câu
      </span>
      {game.settings.skillsEnabled && (
        <span className="pl-lobby-tag pl-lobby-tag-accent">
          <Sparkles size={13} />
          Kỹ năng
        </span>
      )}
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
        shareText={`Tham gia Bingo: ${game.title}`}
        qrVisible={qrVisible}
        onToggleQr={() => setQrVisible(v => !v)}
      />
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>Trả lời đúng câu hỏi → Quay số ngẫu nhiên</li>
          <li>Số trúng tự đánh dấu trên thẻ ({game.settings.rowsPerPlayer} dãy × {game.settings.numbersPerRow} số)</li>
          <li>Hoàn thành 1 dãy = Được hô BINGO!</li>
          <li>Ai hô BINGO đầu tiên = Chiến thắng!</li>
          {game.settings.skillsEnabled && (
            <li>Mỗi {game.settings.skillInterval} lượt: người trả lời đúng nhận kỹ năng</li>
          )}
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
      loading={loading}
      onStart={onStartGame}
      startIcon={<Grid3X3 size={20} />}
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
        accent={BINGO_ACCENT}
        onLeave={onLeaveGame}
        qrHidden={!qrVisible}
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
