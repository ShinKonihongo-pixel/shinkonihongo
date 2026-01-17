// WaitingRoom - Displays available games waiting for players
// Users can browse and join any game from this list

import { useState, useEffect, useMemo } from 'react';
import { Users, Clock, ArrowRight, RefreshCw, Search, Filter } from 'lucide-react';
import type { GameType, WaitingRoomGame } from '../../types/game-hub';
import { GAMES } from '../../types/game-hub';

interface WaitingRoomProps {
  onJoinGame: (gameType: GameType, code: string) => void;
  onBack: () => void;
  filterGameType?: GameType | null;
}

// Mock data for available games (in production, this would come from a server)
const generateMockGames = (): WaitingRoomGame[] => {
  const gameTypes: GameType[] = ['boat-racing', 'horse-racing', 'quiz', 'golden-bell'];
  const hosts = [
    { name: 'Minh', avatar: '👨' },
    { name: 'Linh', avatar: '👩' },
    { name: 'Hùng', avatar: '🧑' },
    { name: 'Mai', avatar: '👧' },
    { name: 'Tuấn', avatar: '👦' },
    { name: 'Hoa', avatar: '🧒' },
  ];

  return Array.from({ length: 8 }, (_, i) => {
    const gameType = gameTypes[i % gameTypes.length];
    const host = hosts[i % hosts.length];
    const maxPlayers = gameType.includes('racing') ? 8 : gameType === 'golden-bell' ? 100 : 20;
    const playerCount = Math.floor(Math.random() * (maxPlayers / 2)) + 1;

    return {
      id: `game-${i + 1}`,
      code: `${String.fromCharCode(65 + i)}${Math.floor(1000 + Math.random() * 9000)}`,
      gameType,
      title: `${GAMES[gameType].name} #${i + 1}`,
      hostName: host.name,
      hostAvatar: host.avatar,
      playerCount,
      maxPlayers,
      createdAt: new Date(Date.now() - Math.random() * 300000).toISOString(),
      status: 'waiting' as const,
    };
  });
};

export function WaitingRoom({ onJoinGame, onBack, filterGameType }: WaitingRoomProps) {
  const [games, setGames] = useState<WaitingRoomGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(filterGameType ? GAMES[filterGameType].category || null : null);

  // Load available games
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      setGames(generateMockGames());
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter games
  const filteredGames = useMemo(() => {
    let result = games;

    // Filter by specific game type if provided
    if (filterGameType) {
      result = result.filter(g => g.gameType === filterGameType);
    } else if (selectedCategory) {
      result = result.filter(g => GAMES[g.gameType].category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.hostName.toLowerCase().includes(query) ||
        g.code.toLowerCase().includes(query)
      );
    }

    return result;
  }, [games, filterGameType, selectedCategory, searchQuery]);

  // Refresh games list
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setGames(generateMockGames());
      setIsLoading(false);
    }, 500);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Vừa tạo';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    return `${Math.floor(minutes / 60)} giờ trước`;
  };

  const categories = [
    { id: null, label: 'Tất cả', icon: '🎮' },
    { id: 'racing', label: 'Đua xe', icon: '🏁' },
    { id: 'quiz', label: 'Quiz', icon: '🎯' },
    { id: 'elimination', label: 'Loại trừ', icon: '🔔' },
  ];

  return (
    <div className="waiting-room">
      <div className="waiting-room-header">
        <button className="waiting-room-back" onClick={onBack}>
          ← Quay lại
        </button>
        <h2 className="waiting-room-title">
          {filterGameType ? (
            <>
              <span className="game-icon">{GAMES[filterGameType].icon}</span>
              Phòng {GAMES[filterGameType].name}
            </>
          ) : (
            <>🏠 Phòng chờ</>
          )}
        </h2>
        <button className="waiting-room-refresh" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Search and filters */}
      <div className="waiting-room-controls">
        <div className="waiting-room-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên, host hoặc mã phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {!filterGameType && (
          <div className="waiting-room-filters">
            <Filter size={14} />
            {categories.map(cat => (
              <button
                key={cat.id || 'all'}
                className={`filter-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Games list */}
      <div className="waiting-room-list">
        {isLoading ? (
          <div className="waiting-room-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách phòng...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="waiting-room-empty">
            <span className="empty-icon">🏠</span>
            <h3>Chưa có phòng nào</h3>
            <p>Hãy tạo phòng mới hoặc đợi người khác tạo</p>
          </div>
        ) : (
          filteredGames.map(game => (
            <div key={game.id} className="waiting-room-card">
              <div className="game-card-header">
                <div className="game-type-badge" style={{ background: GAMES[game.gameType].gradient }}>
                  <span>{GAMES[game.gameType].icon}</span>
                  {GAMES[game.gameType].name}
                </div>
                <span className="game-code">{game.code}</span>
              </div>

              <div className="game-card-body">
                <h3 className="game-title">{game.title}</h3>

                <div className="game-host">
                  <span className="host-avatar">{game.hostAvatar}</span>
                  <span className="host-name">{game.hostName}</span>
                </div>

                <div className="game-meta">
                  <div className="meta-item">
                    <Users size={14} />
                    <span>{game.playerCount}/{game.maxPlayers}</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={14} />
                    <span>{formatTimeAgo(game.createdAt)}</span>
                  </div>
                </div>
              </div>

              <button
                className="game-join-btn"
                onClick={() => onJoinGame(game.gameType, game.code)}
                disabled={game.playerCount >= game.maxPlayers}
              >
                {game.playerCount >= game.maxPlayers ? (
                  'Đã đầy'
                ) : (
                  <>
                    Tham gia
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Stats footer */}
      <div className="waiting-room-footer">
        <span>{filteredGames.length} phòng đang chờ</span>
        <span>•</span>
        <span>{filteredGames.reduce((sum, g) => sum + g.playerCount, 0)} người chơi</span>
      </div>
    </div>
  );
}
