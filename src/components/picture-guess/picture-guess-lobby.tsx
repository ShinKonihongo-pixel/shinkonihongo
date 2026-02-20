// Picture Guess Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Amber/orange accent for picture-guessing theme, with VIP name glow and avatar border effects

import { useState, useMemo, useCallback } from 'react';
import { Image, Clock, Hash, Lightbulb, Zap, Bot } from 'lucide-react';
import type { PictureGuessGame } from '../../types/picture-guess';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  normalizePlayer,
} from '../shared/game-lobby';
import { ConfirmModal } from '../ui/confirm-modal';

// Picture Guess accent: amber/orange
const PICTURE_GUESS_ACCENT = {
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentRgb: '245, 158, 11',
};

interface PictureGuessLobbyProps {
  game: PictureGuessGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function PictureGuessLobby({
  game,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeave,
  onKickPlayer,
}: PictureGuessLobbyProps) {
  const [qrVisible, setQrVisible] = useState(true);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [kickTarget, setKickTarget] = useState<string | null>(null);

  const isHost = game.hostId === currentPlayerId;
  const minPlayers = game.settings.mode === 'single' ? 1 : 2;

  const { hostPlayer, normalizedPlayers, playerCount, fillPercent } = useMemo(() => {
    const list = Object.values(game.players);
    return {
      hostPlayer: list.find(p => p.odinhId === game.hostId),
      normalizedPlayers: list.map(p => normalizePlayer({
        ...p, odinhId: p.odinhId, isHost: p.odinhId === game.hostId, isBot: (p as any).isBot,
      })),
      playerCount: list.length,
      fillPercent: Math.min(100, (list.length / game.settings.maxPlayers) * 100),
    };
  }, [game.players, game.settings.maxPlayers, game.hostId]);

  const canStart = playerCount >= minPlayers;
  const joinUrl = `${window.location.origin}?game=picture-guess&join=${game.code}`;

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
        {game.settings.puzzleCount} câu
      </span>
      <span className="pl-lobby-tag">
        <Clock size={13} />
        {game.settings.timePerPuzzle}s/câu
      </span>
      <span className="pl-lobby-tag">
        <Image size={13} />
        {game.settings.jlptLevel}
      </span>
      {game.settings.allowHints && (
        <span className="pl-lobby-tag pl-lobby-tag-accent">
          <Lightbulb size={13} />
          Gợi ý
        </span>
      )}
      {game.settings.speedBonus && (
        <span className="pl-lobby-tag pl-lobby-tag-accent">
          <Zap size={13} />
          Bonus tốc độ
        </span>
      )}
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
        shareText={`Tham gia Đuổi Hình Bắt Chữ: ${game.title}`}
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
          <li>Mỗi lượt hiển thị hình ảnh/emoji — đoán từ tiếng Nhật tương ứng</li>
          <li>Trả lời đúng và nhanh nhất sẽ ghi nhiều điểm nhất</li>
          {game.settings.allowHints && <li>Sử dụng gợi ý: chữ đầu, độ dài, nghĩa, Hán Việt (trừ điểm)</li>}
          {game.settings.speedBonus && <li>Trả lời nhanh = bonus điểm tốc độ</li>}
          {game.settings.penaltyWrongAnswer && <li>Trả lời sai bị trừ điểm</li>}
          <li>Tổng {game.settings.puzzleCount} câu — ai nhiều điểm nhất thắng!</li>
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
      minPlayers={minPlayers}
      onKickPlayer={handleKick}
    />
  );

  // Footer
  const footerContent = (
    <LobbyStartFooter
      isHost={isHost || game.settings.mode === 'single'}
      canStart={canStart}
      onStart={onStartGame}
      startIcon={<Image size={20} />}
      startLabel="Bắt Đầu Đoán Hình"
      disabledLabel={`Cần ${minPlayers} người chơi`}
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
        accent={PICTURE_GUESS_ACCENT}
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
