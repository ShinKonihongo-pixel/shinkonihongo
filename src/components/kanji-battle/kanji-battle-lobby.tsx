// Kanji Battle Lobby — Premium full-screen lobby using shared PremiumLobbyShell
// Fiery red/crimson accent for battle theme

import { Swords, Clock, Sparkles, Layers, BookOpen, PenTool, Hash, Bot } from 'lucide-react';
import type { KanjiBattleGame } from '../../types/kanji-battle';
import {
  PremiumLobbyShell,
  LobbyHostCard,
  LobbyJoinSection,
  LobbyPlayersPanel,
  LobbyStartFooter,
  LobbyConfirmModals,
} from '../shared/game-lobby';
import { useLobbyState } from '../../hooks/shared/use-lobby-state';

const KANJI_BATTLE_ACCENT = {
  accent: '#EF4444',
  accentDark: '#B91C1C',
  accentRgb: '239, 68, 68',
};

interface KanjiBattleLobbyProps {
  game: KanjiBattleGame;
  currentPlayerId: string;
  onStartGame: () => void;
  onAddBot: () => void;
  onLeave: () => void;
  onKickPlayer?: (playerId: string) => void;
}

export const KanjiBattleLobby: React.FC<KanjiBattleLobbyProps> = ({
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
    { gameSlug: 'kanji-battle' },
  );

  const metaTags = (
    <>
      <span className="pl-lobby-tag">
        {game.settings.gameMode === 'read'
          ? <><BookOpen size={13} /> Đọc Kanji</>
          : <><PenTool size={13} /> Viết Kanji</>
        }
      </span>
      <span className="pl-lobby-tag"><Layers size={13} />{game.settings.selectedLevels.join(', ')}</span>
      <span className="pl-lobby-tag"><Hash size={13} />{game.settings.totalRounds} câu</span>
      <span className="pl-lobby-tag"><Clock size={13} />{game.settings.timePerQuestion}s/câu</span>
      {game.settings.skillsEnabled && (
        <span className="pl-lobby-tag pl-lobby-tag-accent"><Sparkles size={13} />Kỹ năng</span>
      )}
      <span className="pl-lobby-tag pl-lobby-tag-live"><span className="pl-lobby-live-dot" />Live</span>
    </>
  );

  const leftContent = (
    <>
      {lobby.hostPlayer && (
        <LobbyHostCard displayName={lobby.hostPlayer.displayName} avatar={lobby.hostPlayer.avatar} role={(lobby.hostPlayer as any).role} />
      )}
      <LobbyJoinSection code={game.code} joinUrl={lobby.joinUrl} shareText={`Tham gia Đại chiến Kanji: ${game.title}`} qrVisible={lobby.qrVisible} onToggleQr={() => lobby.setQrVisible(v => !v)} />
      {lobby.isHost && lobby.playerCount < game.settings.maxPlayers && (
        <button className="pl-lobby-add-bot-btn" onClick={onAddBot}><Bot size={16} />Thêm Bot</button>
      )}
      <div className="pl-lobby-rules">
        <h4>Luật chơi</h4>
        <ul>
          {game.settings.gameMode === 'read' ? (
            <>
              <li>Mỗi lượt xuất hiện 1 Kanji → nhập nghĩa / Hán Việt / On / Kun</li>
              <li>Trả lời đúng & nhanh nhất → được nhiều điểm hơn</li>
            </>
          ) : (
            <>
              <li>Mỗi lượt xuất hiện nghĩa → vẽ Kanji đúng thứ tự nét</li>
              <li>Chấm điểm theo độ chính xác nét viết</li>
            </>
          )}
          <li>Trả lời sai bị trừ {game.settings.pointsPenalty} điểm</li>
          <li>Mỗi người có {game.settings.hintsPerPlayer} lượt gợi ý</li>
          {game.settings.skillsEnabled && (
            <li>Mỗi {game.settings.skillInterval} lượt: người đúng nhận kỹ năng đặc biệt</li>
          )}
          <li>Tổng {game.settings.totalRounds} câu — ai nhiều điểm nhất thắng!</li>
        </ul>
      </div>
    </>
  );

  const rightContent = (
    <LobbyPlayersPanel players={lobby.normalizedPlayers} hostId={game.hostId} currentPlayerId={currentPlayerId} maxPlayers={game.settings.maxPlayers} playerCount={lobby.playerCount} fillPercent={lobby.fillPercent} minPlayers={game.settings.minPlayers} onKickPlayer={lobby.handleKick} />
  );

  const footerContent = (
    <LobbyStartFooter isHost={lobby.isHost} canStart={lobby.canStart} onStart={onStartGame} startIcon={<Swords size={20} />} startLabel="Bắt Đầu Đại Chiến" disabledLabel={`Cần ${game.settings.minPlayers} người chơi`} />
  );

  return (
    <>
      <PremiumLobbyShell title={game.title} metaTags={metaTags} leftContent={leftContent} rightContent={rightContent} footerContent={footerContent} accent={KANJI_BATTLE_ACCENT} onLeave={onLeave} qrHidden={!lobby.qrVisible} />
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
