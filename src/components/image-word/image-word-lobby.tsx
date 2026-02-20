// Image Word Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Green/emerald accent for image-matching theme

import { Image, Clock, Hash, Users, Bot } from 'lucide-react';
import type { ImageWordMultiplayerGame } from '../../types/image-word';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';

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
  game, currentPlayerId, onStartGame, onAddBot, onLeave, onKickPlayer,
}: ImageWordLobbyProps) {
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
    { gameSlug: 'image-word' },
  );

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Hash size={13} />{game.settings.totalPairs} cặp</span>
      {game.settings.timeLimit > 0 && (
        <span className="pl-lobby-tag"><Clock size={13} />{game.settings.timeLimit}s</span>
      )}
      <span className="pl-lobby-tag"><Users size={13} />Tối đa {game.settings.maxPlayers} người</span>
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={(lobby.hostPlayer as any).role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Nối Hình - Từ: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      {lobby.isHost && lobby.playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}><Bot size={16} />Thêm Bot</button>
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

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={game.settings.minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={lobby.isHost} canStart={lobby.canStart} onStart={onStartGame} startIcon={<Image size={20} />} startLabel="Bắt Đầu Nối Hình" disabledLabel={`Cần ${game.settings.minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={IMAGE_WORD_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
      <LobbyConfirmModals
        isHost={lobby.isHost}
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
