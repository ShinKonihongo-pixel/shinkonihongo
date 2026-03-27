// Picture Guess Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Amber/orange accent for picture-guessing theme

import { Image, Clock, Hash, Lightbulb, Zap, Bot } from 'lucide-react';
import type { PictureGuessGame } from '../../types/picture-guess';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';

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
  game, currentPlayerId, onStartGame, onAddBot, onLeave, onKickPlayer,
}: PictureGuessLobbyProps) {
  const minPlayers = game.settings.mode === 'single' ? 1 : 2;

  const lobby = useLobbyState(
    {
      players: game.players,
      hostId: game.hostId,
      currentPlayerId,
      maxPlayers: game.settings.maxPlayers,
      minPlayers,
      code: game.code,
      onKickPlayer,
    },
    { gameSlug: 'picture-guess' },
  );

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Hash size={13} />{game.settings.puzzleCount} câu</span>
      <span className="pl-lobby-tag"><Clock size={13} />{game.settings.timePerPuzzle}s/câu</span>
      <span className="pl-lobby-tag"><Image size={13} />{game.settings.jlptLevel}</span>
      {game.settings.allowHints && (
        <span className="pl-lobby-tag pl-lobby-tag-accent"><Lightbulb size={13} />Gợi ý</span>
      )}
      {game.settings.speedBonus && (
        <span className="pl-lobby-tag pl-lobby-tag-accent"><Zap size={13} />Bonus tốc độ</span>
      )}
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={lobby.hostPlayer.role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Đuổi Hình Bắt Chữ: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      {lobby.isHost && lobby.playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}><Bot size={16} />Thêm Bot</button>
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

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={lobby.isHost || game.settings.mode === 'single'} canStart={lobby.canStart} onStart={onStartGame} startIcon={<Image size={20} />} startLabel="Bắt Đầu Đoán Hình" disabledLabel={`Cần ${minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={PICTURE_GUESS_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
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
