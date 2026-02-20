// Word Scramble Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Indigo accent for word-scrambling theme, with VIP name glow and avatar border effects

import { useState, useMemo, useCallback } from 'react';
import { Shuffle, Clock, Hash, Target, Bot } from 'lucide-react';
import type { WordScrambleMultiplayerGame } from '../pages/word-scramble/word-scramble-types';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  normalizePlayer,
} from '../shared/game-lobby';
import { ConfirmModal } from '../ui/confirm-modal';

// Word Scramble accent: indigo
const WORD_SCRAMBLE_ACCENT = {
  accent: '#6366F1',
  accentDark: '#4F46E5',
  accentRgb: '99, 102, 241',
};

interface WordScrambleLobbyProps {
  game: WordScrambleMultiplayerGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function WordScrambleLobby({
  game,
  currentPlayerId,
  onStartGame,
  onAddBot,
  onLeave,
  onKickPlayer,
}: WordScrambleLobbyProps) {
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
  const joinUrl = `${window.location.origin}?game=word-scramble&join=${game.code}`;

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
        {game.settings.totalQuestions} câu
      </span>
      <span className="pl-lobby-tag">
        <Clock size={13} />
        {game.settings.timePerQuestion}s/câu
      </span>
      <span className="pl-lobby-tag">
        <Target size={13} />
        {game.settings.jlptLevel}
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
        shareText={`Tham gia Sắp Xếp Từ: ${game.title}`}
        qrVisible={qrVisible}
        onToggleQr={() => setQrVisible(v => !v)}
      />
      {isHost && playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}>
          <Bot size={16} />
          Thêm Bot
        </button>
      )}
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>Sắp xếp các chữ cái bị xáo trộn thành từ vựng đúng</li>
          <li>Trả lời đúng và nhanh = điểm cao hơn</li>
          <li>Có gợi ý thông minh (trừ điểm khi dùng)</li>
          <li>Tổng {game.settings.totalQuestions} câu — ai nhiều điểm nhất thắng!</li>
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
      startIcon={<Shuffle size={20} />}
      startLabel="Bắt Đầu Sắp Xếp"
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
        accent={WORD_SCRAMBLE_ACCENT}
        onLeave={() => setShowLeaveConfirm(true)}
        qrHidden={!qrVisible}
      />

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
