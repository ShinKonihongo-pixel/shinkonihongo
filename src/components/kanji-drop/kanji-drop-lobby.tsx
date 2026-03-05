// Kanji Drop Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Purple accent for kanji-drop theme

import { Layers, Target, Hash, Bot, Play } from 'lucide-react';
import type { KanjiDropMultiplayerGame } from '../pages/kanji-drop/kanji-drop-multiplayer-types';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';

const KANJI_DROP_ACCENT = {
  accent: '#8B5CF6',
  accentDark: '#6D28D9',
  accentRgb: '139, 92, 246',
};

interface KanjiDropLobbyProps {
  game: KanjiDropMultiplayerGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export function KanjiDropLobby({
  game, currentPlayerId, onStartGame, onAddBot, onLeave, onKickPlayer,
}: KanjiDropLobbyProps) {
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
    { gameSlug: 'kanji-drop' },
  );

  const levelRange = `Màn ${game.settings.levelStart} → ${game.settings.levelEnd}`;
  const totalLevels = game.settings.levelEnd - game.settings.levelStart + 1;

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Layers size={13} />{totalLevels} màn</span>
      <span className="pl-lobby-tag"><Target size={13} />{game.settings.jlptLevels.join(', ')}</span>
      <span className="pl-lobby-tag"><Hash size={13} />{levelRange}</span>
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={lobby.hostPlayer.role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Kanji Drop: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      {lobby.isHost && lobby.playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}><Bot size={16} />Thêm Bot</button>
      )}
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>Xếp kanji vào hàng, gom 3+ giống nhau để tiêu diệt</li>
          <li>Tất cả người chơi nhận bài giống nhau (cùng seed)</li>
          <li>Ai hoàn thành {totalLevels} màn trước → thắng!</li>
          <li>Power-ups: Xáo trộn, Hoàn tác, Thu hồi</li>
        </ul>
      </div>
      <div className="pl-lobby-rules" style={{ marginTop: '0.75rem' }}>
        <h4>Phạm vi</h4>
        <p style={{ margin: '0.25rem 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
          {levelRange} • JLPT {game.settings.jlptLevels.join(', ')}
        </p>
      </div>
    </>
  );

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={game.settings.minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={lobby.isHost} canStart={lobby.canStart} onStart={onStartGame} startIcon={<Play size={20} />} startLabel="Bắt Đầu Kanji Drop" disabledLabel={`Cần ${game.settings.minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={KANJI_DROP_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
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
