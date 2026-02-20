// Word Match Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Teal/cyan accent for word-linking theme

import { Link, Clock, Hash, RotateCw, Bot } from 'lucide-react';
import type { WordMatchGame } from '../../types/word-match';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';

const WORD_MATCH_ACCENT = {
  accent: '#14B8A6',
  accentDark: '#0D9488',
  accentRgb: '20, 184, 166',
};

interface WordMatchLobbyProps {
  game: WordMatchGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export const WordMatchLobby: React.FC<WordMatchLobbyProps> = ({
  game, currentPlayerId, onStartGame, onAddBot, onLeave, onKickPlayer,
}) => {
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
    { gameSlug: 'word-match' },
  );

  const metaTags = (
    <>
      <span className="pl-lobby-tag"><Hash size={13} />{game.settings.totalRounds} câu</span>
      <span className="pl-lobby-tag"><Clock size={13} />{game.settings.timePerRound}s/câu</span>
      <span className="pl-lobby-tag"><Link size={13} />{game.settings.pairsPerRound} cặp/câu</span>
      <span className="pl-lobby-tag pl-lobby-tag-accent"><RotateCw size={13} />Vòng quay mỗi {game.settings.specialInterval} câu</span>
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={(lobby.hostPlayer as any).role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Nối Từ Thách Đấu: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      {lobby.isHost && lobby.playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}><Bot size={16} />Thêm Bot</button>
      )}
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          <li>Mỗi lượt xuất hiện {game.settings.pairsPerRound} cặp từ — nối từ trái với nghĩa phải</li>
          <li>Nối đúng tất cả {game.settings.pairsPerRound} cặp = bonus điểm</li>
          <li>Mỗi {game.settings.specialInterval} lượt: vòng quay hiệu ứng đặc biệt</li>
          <li>Hiệu ứng: ⚔️ Thách đấu, 🔌 Ngắt kết nối, 🛡️ Lá chắn</li>
          <li>Tổng {game.settings.totalRounds} câu — ai nhiều điểm nhất thắng!</li>
        </ul>
      </div>
    </>
  );

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={game.settings.minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={lobby.isHost} canStart={lobby.canStart} onStart={onStartGame} startIcon={<Link size={20} />} startLabel="Bắt Đầu Nối Từ" disabledLabel={`Cần ${game.settings.minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={WORD_MATCH_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
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
};
