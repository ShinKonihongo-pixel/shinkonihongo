// Game Selector - Professional game selection interface
// Shows all available games with rich cards and quick actions

import { useState } from 'react';
import { Search, Users, Zap, Star, Sparkles, Trophy, ArrowRight, Plus, Home } from 'lucide-react';
import type { GameType, GameInfo } from '../../types/game-hub';
import { GAMES, getAllGames, getRacingGames } from '../../types/game-hub';
import { WaitingRoom } from './waiting-room';

type SelectorView = 'games' | 'waiting-room' | 'create-room';

interface GameSelectorProps {
  onSelectGame: (game: GameType) => void;
  onQuickJoin: (gameType: GameType, code: string) => void;
}

export function GameSelector({ onSelectGame, onQuickJoin }: GameSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [selectedGameForJoin, setSelectedGameForJoin] = useState<GameType | null>(null);
  const [currentView, setCurrentView] = useState<SelectorView>('games');
  const [filterGameType, setFilterGameType] = useState<GameType | null>(null);

  const allGames = getAllGames();
  const racingGames = getRacingGames();

  // Filter games by search
  const filteredGames = allGames.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate featured and regular games
  const featuredGames = filteredGames.filter(g => g.isPopular || g.isNew);
  const regularGames = filteredGames.filter(g => !g.isPopular && !g.isNew);

  const handleJoinGame = (gameType: GameType) => {
    setSelectedGameForJoin(gameType);
    setShowJoinModal(true);
  };

  const handleSubmitJoin = () => {
    if (joinCode.trim().length >= 4 && selectedGameForJoin) {
      onQuickJoin(selectedGameForJoin, joinCode.trim().toUpperCase());
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  // Open waiting room
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

  // Show waiting room view
  if (currentView === 'waiting-room') {
    return (
      <div className="game-selector">
        <WaitingRoom
          onJoinGame={handleJoinFromWaitingRoom}
          onBack={() => setCurrentView('games')}
          filterGameType={filterGameType}
        />
      </div>
    );
  }

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
            <span>{allGames.length} Games</span>
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
        </div>
      </div>

      {/* Racing Games Section - Special with room options */}
      <section className="game-section racing-section">
        <h2 className="section-title">
          <span className="racing-icon">🏁</span>
          <span>Trò Chơi Đua</span>
        </h2>
        <div className="racing-games-grid">
          {racingGames.map(game => (
            <RacingGameCard
              key={game.id}
              game={game}
              onPlay={() => onSelectGame(game.id)}
              onJoin={() => handleJoinGame(game.id)}
              onBrowseRooms={() => handleOpenWaitingRoom(game.id)}
            />
          ))}
        </div>
      </section>

      {/* Featured Games */}
      {featuredGames.length > 0 && (
        <section className="game-section featured-section">
          <h2 className="section-title">
            <Sparkles size={20} />
            <span>Nổi Bật</span>
          </h2>
          <div className="featured-games-grid">
            {featuredGames.filter(g => g.category !== 'racing').map(game => (
              <GameCardFeatured
                key={game.id}
                game={game}
                onPlay={() => onSelectGame(game.id)}
                onJoin={() => handleJoinGame(game.id)}
                getDifficultyLabel={getDifficultyLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Games (non-racing) */}
      <section className="game-section all-games-section">
        <h2 className="section-title">
          <Star size={20} />
          <span>Các Game Khác</span>
        </h2>
        <div className="all-games-grid">
          {(regularGames.length > 0 ? regularGames : filteredGames)
            .filter(g => g.category !== 'racing')
            .map(game => (
              <GameCard
                key={game.id}
                game={game}
                onPlay={() => onSelectGame(game.id)}
                onJoin={() => handleJoinGame(game.id)}
                getDifficultyLabel={getDifficultyLabel}
              />
            ))}
        </div>
      </section>

      {/* Quick Join Modal */}
      {showJoinModal && selectedGameForJoin && (
        <div className="game-modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="game-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ background: GAMES[selectedGameForJoin].gradient }}>
              <span className="modal-icon">{GAMES[selectedGameForJoin].icon}</span>
              <h3>Tham Gia {GAMES[selectedGameForJoin].name}</h3>
            </div>
            <div className="modal-body">
              <p>Nhập mã phòng để tham gia trò chơi</p>
              <input
                type="text"
                className="join-code-input"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="XXXXXX"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowJoinModal(false)}>
                Hủy
              </button>
              <button
                className="btn-join"
                onClick={handleSubmitJoin}
                disabled={joinCode.length < 4}
                style={{ background: GAMES[selectedGameForJoin].gradient }}
              >
                Tham Gia
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Featured Game Card - Large, prominent display
interface GameCardProps {
  game: GameInfo;
  onPlay: () => void;
  onJoin: () => void;
  getDifficultyLabel: (d: string) => { text: string; color: string };
}

function GameCardFeatured({ game, onPlay, onJoin, getDifficultyLabel }: GameCardProps) {
  const difficulty = getDifficultyLabel(game.difficulty);

  return (
    <div className="game-card-featured" style={{ background: game.gradient }}>
      {game.isNew && <span className="badge-new">MỚI</span>}
      {game.isPopular && !game.isNew && <span className="badge-popular">HOT</span>}

      <div className="card-content">
        <div className="card-icon">{game.icon}</div>
        <h3 className="card-title">{game.name}</h3>
        <p className="card-description">{game.description}</p>

        <div className="card-meta">
          <span className="meta-item">
            <Users size={14} />
            {game.playerRange} người
          </span>
          <span className="meta-item difficulty" style={{ color: difficulty.color }}>
            {difficulty.text}
          </span>
        </div>

        <div className="card-features">
          {game.features.slice(0, 3).map((feature, idx) => (
            <span key={idx} className="feature-tag">{feature}</span>
          ))}
        </div>
      </div>

      <div className="card-actions">
        <button className="btn-play" onClick={onPlay}>
          Chơi Ngay
          <ArrowRight size={18} />
        </button>
        <button className="btn-join-room" onClick={onJoin}>
          Tham Gia Phòng
        </button>
      </div>
    </div>
  );
}

// Regular Game Card - Compact display
function GameCard({ game, onPlay, onJoin, getDifficultyLabel }: GameCardProps) {
  const difficulty = getDifficultyLabel(game.difficulty);

  return (
    <div className="game-card">
      <div className="card-header" style={{ background: game.gradient }}>
        <span className="card-icon">{game.icon}</span>
        {game.isNew && <span className="badge-new small">MỚI</span>}
      </div>

      <div className="card-body">
        <h3 className="card-title">{game.name}</h3>
        <p className="card-description">{game.description}</p>

        <div className="card-meta">
          <span className="meta-item">
            <Users size={12} />
            {game.playerRange}
          </span>
          <span className="meta-item difficulty" style={{ background: difficulty.color }}>
            {difficulty.text}
          </span>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn-play-small" onClick={onPlay} style={{ background: game.color }}>
          Chơi
        </button>
        <button className="btn-join-small" onClick={onJoin}>
          Tham Gia
        </button>
      </div>
    </div>
  );
}

// Racing Game Card - Special card with room options
interface RacingCardProps {
  game: GameInfo;
  onPlay: () => void;
  onJoin: () => void;
  onBrowseRooms: () => void;
}

function RacingGameCard({ game, onPlay, onJoin, onBrowseRooms }: RacingCardProps) {
  return (
    <div className="racing-game-card" style={{ borderColor: game.color }}>
      <div className="racing-card-header" style={{ background: game.gradient }}>
        <span className="racing-card-icon">{game.icon}</span>
        <div className="racing-card-info">
          <h3>{game.name}</h3>
          <p>{game.description}</p>
        </div>
        {game.isNew && <span className="badge-new">MỚI</span>}
      </div>

      <div className="racing-card-features">
        {game.features.map((feature, idx) => (
          <span key={idx} className="feature-chip">{feature}</span>
        ))}
      </div>

      <div className="racing-card-actions">
        <button className="racing-btn primary" onClick={onPlay} style={{ background: game.gradient }}>
          <Plus size={16} />
          Tạo Phòng
        </button>
        <button className="racing-btn secondary" onClick={onJoin}>
          🔑 Nhập Mã
        </button>
        <button className="racing-btn tertiary" onClick={onBrowseRooms}>
          <Home size={16} />
          Phòng Chờ
        </button>
      </div>

      <div className="racing-card-meta">
        <span><Users size={14} /> {game.playerRange} người chơi</span>
        <span>🤖 Bot tự động tham gia</span>
      </div>
    </div>
  );
}
