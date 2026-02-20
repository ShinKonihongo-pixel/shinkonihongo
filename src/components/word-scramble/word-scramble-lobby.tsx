// Word Scramble Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Indigo accent for word-scrambling theme

import { Shuffle, Clock, Hash, Target, Bot } from 'lucide-react';
import type { WordScrambleMultiplayerGame } from '../pages/word-scramble/word-scramble-types';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';

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
  game, currentPlayerId, onStartGame, onAddBot, onLeave, onKickPlayer,
}: WordScrambleLobbyProps) {
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
    { gameSlug: 'word-scramble' },
  );

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Hash size={13} />{game.settings.totalQuestions} câu</span>
      <span className="pl-lobby-tag"><Clock size={13} />{game.settings.timePerQuestion}s/câu</span>
      <span className="pl-lobby-tag"><Target size={13} />{game.settings.jlptLevel}</span>
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={(lobby.hostPlayer as any).role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Sắp Xếp Từ: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      {lobby.isHost && lobby.playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}><Bot size={16} />Thêm Bot</button>
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

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={game.settings.minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={lobby.isHost} canStart={lobby.canStart} onStart={onStartGame} startIcon={<Shuffle size={20} />} startLabel="Bắt Đầu Sắp Xếp" disabledLabel={`Cần ${game.settings.minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={WORD_SCRAMBLE_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
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
