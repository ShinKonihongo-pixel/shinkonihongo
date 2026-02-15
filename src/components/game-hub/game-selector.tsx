// Game Selector - Modern game selection interface with 3-column grid
// Shows all available games with clean minimal cards

import { useState, useEffect, useMemo } from 'react';
import { Search, Users, Zap, Trophy, Home, EyeOff, Plus, DoorOpen } from 'lucide-react';
import type { GameType, GameInfo } from '../../types/game-hub';
import type { UserRole } from '../../types/user';
import { getVisibleGames } from '../../types/game-hub';
import { getHiddenGames } from '../../services/game-visibility-storage';
import { WaitingRoom } from './waiting-room';

type SelectorView = 'games' | 'waiting-room';

interface GameSelectorProps {
  onSelectGame: (game: GameType) => void;
  onQuickJoin: (gameType: GameType, code: string) => void;
  onSetupGame: (game: GameType) => void;
  userRole?: UserRole;
  initialView?: SelectorView;
}

export function GameSelector({ onSelectGame, onQuickJoin, onSetupGame, userRole, initialView = 'games' }: GameSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<SelectorView>(initialView);
  const [filterGameType, setFilterGameType] = useState<GameType | null>(null);
  const [hiddenGames, setHiddenGames] = useState<GameType[]>([]);

  // Load hidden games on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHiddenGames(getHiddenGames());
  }, []);

  // Get visible games only
  const visibleGames = useMemo(() => getVisibleGames(hiddenGames), [hiddenGames]);

  // Filter games by search
  const filteredGames = useMemo(() => {
    return visibleGames.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [visibleGames, searchQuery]);

  // Open waiting room with specific game filter
  const handleOpenWaitingRoom = (gameType?: GameType) => {
    setFilterGameType(gameType || null);
    setCurrentView('waiting-room');
  };

  // Handle join from waiting room
  const handleJoinFromWaitingRoom = (gameType: GameType, code: string) => {
    onQuickJoin(gameType, code);
    setCurrentView('games');
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { text: 'Dễ', color: '#4CAF50' };
      case 'medium': return { text: 'Vừa', color: '#FF9800' };
      case 'hard': return { text: 'Khó', color: '#F44336' };
      default: return { text: 'Vừa', color: '#FF9800' };
    }
  };

  // Show waiting room view - only real rooms, no virtual/mock rooms
  if (currentView === 'waiting-room') {
    return (
      <div className="game-selector">
        <WaitingRoom
          onJoinGame={handleJoinFromWaitingRoom}
          onBack={() => setCurrentView('games')}
          onCreateRoom={() => setCurrentView('games')}
          filterGameType={filterGameType}
          userRole={userRole}
        />
      </div>
    );
  }

  // Check if all games are hidden
  const noGamesAvailable = visibleGames.length === 0;

  return (
    <div className="game-selector">
      {/* Hero Header */}
      <div className="game-hub-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-icon">🎮</span>
            Game Center
          </h1>
          <p className="hero-subtitle">Học tiếng Nhật qua các trò chơi thú vị</p>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <Trophy size={20} />
            <span>{visibleGames.length} Games</span>
          </div>
          <div className="stat-item">
            <Users size={20} />
            <span>Multiplayer</span>
          </div>
          <div className="stat-item">
            <Zap size={20} />
            <span>Realtime</span>
          </div>
        </div>
        <div className="hero-actions">
          <button className="hero-btn browse-rooms" onClick={() => handleOpenWaitingRoom()}>
            <Home size={18} />
            Duyệt Phòng Chờ
          </button>
        </div>
      </div>

      {/* No Games Available State */}
      {noGamesAvailable ? (
        <div className="game-empty-state">
          <div className="empty-icon">
            <EyeOff size={48} />
          </div>
          <h3>Không có game nào</h3>
          <p>Tất cả games đã bị ẩn bởi quản trị viên.</p>
          <p className="empty-hint">Vui lòng liên hệ giáo viên để mở game.</p>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="game-search-section">
            <div className="game-search-wrapper">
              <Search size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm trò chơi..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            {hiddenGames.length > 0 && (
              <div className="hidden-games-notice">
                <EyeOff size={14} />
                <span>{hiddenGames.length} game đang bị ẩn</span>
              </div>
            )}
          </div>

          {/* Games Grid - 3 columns */}
          <div className="games-grid-3col">
            {filteredGames.map(game => (
              <GameCardMinimal
                key={game.id}
                game={game}
                onCreateRoom={() => {
                  if (game.id === 'ai-challenge') {
                    onSelectGame(game.id);
                  } else {
                    onSetupGame(game.id);
                  }
                }}
                onJoinWaitingRoom={() => handleOpenWaitingRoom(game.id)}
                getDifficultyLabel={getDifficultyLabel}
              />
            ))}
          </div>

          {/* No Results State */}
          {filteredGames.length === 0 && searchQuery && (
            <div className="game-no-results">
              <Search size={32} />
              <h3>Không tìm thấy game</h3>
              <p>Thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Minimal Game Card - Clean design without content overlay
interface GameCardMinimalProps {
  game: GameInfo;
  onCreateRoom: () => void;
  onJoinWaitingRoom: () => void;
  getDifficultyLabel: (d: string) => { text: string; color: string };
}

function GameCardMinimal({ game, onCreateRoom, onJoinWaitingRoom, getDifficultyLabel }: GameCardMinimalProps) {
  const difficulty = getDifficultyLabel(game.difficulty);
  const isAIChallenge = game.id === 'ai-challenge';

  return (
    <div className="game-card-minimal">
      {/* Badge */}
      {game.isNew && <span className="card-badge new">MỚI</span>}
      {game.isPopular && !game.isNew && <span className="card-badge hot">HOT</span>}

      {/* Icon Area */}
      <div className="card-icon-area" style={{ background: game.gradient }}>
        {game.iconImage ? (
          <img src={game.iconImage} alt={game.name} className="game-icon-img" />
        ) : (
          <span className="game-icon-emoji">{game.icon}</span>
        )}
      </div>

      {/* Info */}
      <div className="card-info">
        <h3 className="card-name">{game.name}</h3>
        <div className="card-meta-row">
          <span className="meta-players">
            <Users size={14} />
            {game.playerRange}
          </span>
          <span className="meta-difficulty" style={{ background: difficulty.color }}>
            {difficulty.text}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="card-actions-row">
        {isAIChallenge ? (
          <button className="btn-create-room" onClick={onCreateRoom} style={{ background: game.color, flex: 1 }}>
            <Zap size={16} />
            Choi ngay
          </button>
        ) : (
          <>
            <button className="btn-create-room" onClick={onCreateRoom} style={{ background: game.color }}>
              <Plus size={16} />
              Tao phong
            </button>
            <button className="btn-join-waiting" onClick={onJoinWaitingRoom}>
              <DoorOpen size={16} />
              Tham gia
            </button>
          </>
        )}
      </div>
    </div>
  );
}
