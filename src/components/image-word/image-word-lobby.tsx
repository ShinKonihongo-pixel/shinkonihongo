// Image Word Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Green/emerald accent for image-matching theme, with VIP name glow and avatar border effects

import { useState, useMemo, useCallback } from 'react';
import { Image, Clock, Hash, Users, Bot } from 'lucide-react';
import type { ImageWordMultiplayerGame } from '../../types/image-word';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  normalizePlayer,
} from '../shared/game-lobby';
import { ConfirmModal } from '../ui/confirm-modal';

// Image Word accent: green/emerald
const IMAGE_WORD_ACCENT = {
  accent: '#10B981',
  accentDark: '#059669',
  accentRgb: '16, 185, 129',
};

interface ImageWordLobbyProps {
  game: ImageWordMultiplayerGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function ImageWordLobby({
  game,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeave,
  onKickPlayer,
}: ImageWordLobbyProps) {
  const [qrVisible, setQrVisible] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const isHost = game.hostId === currentPlayerId;

  const { hostPlayer, normalizedPlayers, playerCount, fillPercent } = useMemo(() => {
    const list = Object.values(game.players);
    return {
      hostPlayer: list.find(p => p.odinhId === game.hostId),
      normalizedPlayers: list.map(p =>
        normalizePlayer({
          ...p,
          odinhId: p.odinhId,
          isHost: p.odinhId === game.hostId,
          isBot: (p as any).isBot,
          role: p.role,
        })
      ),
      playerCount: list.length,
      fillPercent: Math.min(100, (list.length / game.settings.maxPlayers) * 100),
    };
  }, [game.players, game.settings.maxPlayers, game.hostId]);

  const canStart = playerCount >= game.settings.minPlayers;
  const joinUrl = `${window.location.origin}?game=image-word&join=${game.code}`;

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
        <Hash size={13} />
        {game.settings.totalPairs} cặp
      </span>
      {game.settings.timeLimit > 0 && (
        <span className="pl-lobby-tag">
          <Clock size={13} />
          {game.settings.timeLimit}s
        </span>
      )}
      <span className="pl-lobby-tag">
        <Users size={13} />
        Tối đa {game.settings.maxPlayers} người
      </span>
      <span className="pl-lobby-tag pl-lobby-tag-live">
        <span className="pl-lobby-live-dot" />
        Live
      </span>
    </>
  );

  // Left column: host card, QR/join, add bot, rules
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
        shareText={`Tham gia Nối Hình - Từ: ${game.title}`}
        qrVisible={qrVisible}
        onToggleQr={() => setQrVisible(v => !v)}
      />
      {/* Add Bot button for host */}
      {isHost && playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}>
          <Bot size={16} />
          Thêm Bot
        </button>
      )}
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>Nối hình ảnh bên trái với từ vựng tương ứng bên phải</li>
          <li>Nối đúng = +100 điểm, nối sai = -10 điểm</li>
          <li>Hoàn thành nhanh = bonus điểm thời gian</li>
          <li>Ai hoàn thành tất cả các cặp nhanh nhất thắng!</li>
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
      onStart={onStartGame}
      startIcon={<Image size={20} />}
      startLabel="Bắt Đầu Nối Hình"
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
        accent={IMAGE_WORD_ACCENT}
        onLeave={() => setShowLeaveConfirm(true)}
        qrHidden={!qrVisible}
      />

      {/* Leave confirmation modal */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Rời khỏi phòng?"
        message={
          isHost
            ? 'Bạn là host. Nếu bạn rời đi, phòng sẽ bị huỷ và tất cả người chơi sẽ bị đuổi ra.'
            : 'Bạn có chắc muốn rời khỏi phòng chơi này?'
        }
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
