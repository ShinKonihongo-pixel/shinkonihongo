/* eslint-disable react-hooks/purity */
// WaitingRoom - Lobby for browsing available game rooms
// Only shows REAL rooms created by users, no virtual/mock rooms

import { useState, useEffect, useMemo } from 'react';
import { Users, Clock, ArrowRight, RefreshCw, Search, Filter, ArrowLeft, Gamepad2, Plus } from 'lucide-react';
import type { GameType, WaitingRoomGame } from '../../types/game-hub';
import { GAMES, getVisibleGames } from '../../types/game-hub';
import { getHiddenGames } from '../../services/game-visibility-storage';

interface WaitingRoomProps {
  onJoinGame: (gameType: GameType, code: string) => void;
  onBack: () => void;
  onCreateRoom?: () => void;
  filterGameType?: GameType | null;
  // Real rooms from server/database
  realRooms?: WaitingRoomGame[];
}

export function WaitingRoom({ onJoinGame, onBack, onCreateRoom, filterGameType, realRooms = [] }: WaitingRoomProps) {
  const [games, setGames] = useState<WaitingRoomGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<GameType | 'all'>(filterGameType || 'all');
  const [hiddenGames, setHiddenGames] = useState<GameType[]>([]);

  // Load hidden games
  useEffect(() => {
    setHiddenGames(getHiddenGames());
  }, []);

  // Get visible games for filter options
  const visibleGames = useMemo(() => getVisibleGames(hiddenGames), [hiddenGames]);

  // Load REAL rooms only - no mock/virtual rooms
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      // Only use real rooms passed from parent, filter out hidden game types
      const filteredRealRooms = realRooms.filter(room => !hiddenGames.includes(room.gameType));
      setGames(filteredRealRooms);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [realRooms, hiddenGames]);

  // Filter games
  const filteredGames = useMemo(() => {
    let result = games;

    // Filter by specific game type
    if (selectedGameFilter !== 'all') {
      result = result.filter(g => g.gameType === selectedGameFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.hostName.toLowerCase().includes(query) ||
        g.code.toLowerCase().includes(query) ||
        GAMES[g.gameType].name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [games, selectedGameFilter, searchQuery]);

  // Refresh games list - re-filter real rooms
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const filteredRealRooms = realRooms.filter(room => !hiddenGames.includes(room.gameType));
      setGames(filteredRealRooms);
      setIsLoading(false);
    }, 300);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Vừa tạo';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    return `${Math.floor(minutes / 60)} giờ`;
  };

  return (
    <div className="waiting-room-v2">
      {/* Header */}
      <div className="wr-header">
        <button className="wr-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <div className="wr-title">
          <Gamepad2 size={24} />
          <h2>Phòng Chờ</h2>
          {filterGameType && (
            <span className="wr-filter-badge" style={{ background: GAMES[filterGameType].gradient }}>
              {GAMES[filterGameType].icon} {GAMES[filterGameType].name}
            </span>
          )}
        </div>
        <button className="wr-refresh-btn" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="wr-controls">
        <div className="wr-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm phòng, host, mã phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="wr-search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {!filterGameType && (
          <div className="wr-filters">
            <Filter size={16} />
            <button
              className={`wr-filter-chip ${selectedGameFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedGameFilter('all')}
            >
              Tất cả
            </button>
            {visibleGames.slice(0, 5).map(game => (
              <button
                key={game.id}
                className={`wr-filter-chip ${selectedGameFilter === game.id ? 'active' : ''}`}
                onClick={() => setSelectedGameFilter(game.id)}
                style={selectedGameFilter === game.id ? { background: game.gradient } : undefined}
              >
                {game.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="wr-stats-bar">
        <span className="wr-stat">
          <Gamepad2 size={14} />
          {filteredGames.length} phòng
        </span>
        <span className="wr-stat">
          <Users size={14} />
          {filteredGames.reduce((sum, g) => sum + g.playerCount, 0)} người chơi
        </span>
      </div>

      {/* Games Grid */}
      <div className="wr-games-container">
        {isLoading ? (
          <div className="wr-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách phòng...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="wr-empty">
            <span className="wr-empty-icon">🎮</span>
            <h3>Chưa có phòng chờ nào</h3>
            <p>Hiện chưa có ai tạo phòng. Hãy là người đầu tiên!</p>
            {onCreateRoom && (
              <button className="wr-create-btn" onClick={onCreateRoom}>
                <Plus size={18} />
                Tạo phòng mới
              </button>
            )}
          </div>
        ) : (
          <div className="wr-games-grid">
            {filteredGames.map(game => {
              const gameInfo = GAMES[game.gameType];
              const isFull = game.playerCount >= game.maxPlayers;

              return (
                <div key={game.id} className={`wr-room-card ${isFull ? 'full' : ''}`}>
                  {/* Game Type Badge */}
                  <div className="wr-room-type" style={{ background: gameInfo.gradient }}>
                    {gameInfo.iconImage ? (
                      <img src={gameInfo.iconImage} alt={gameInfo.name} className="wr-type-icon" />
                    ) : (
                      <span className="wr-type-emoji">{gameInfo.icon}</span>
                    )}
                    <span className="wr-type-name">{gameInfo.name}</span>
                  </div>

                  {/* Room Code */}
                  <div className="wr-room-code">{game.code}</div>

                  {/* Room Info */}
                  <div className="wr-room-info">
                    <div className="wr-room-host">
                      <span className="wr-host-avatar">{game.hostAvatar}</span>
                      <span className="wr-host-name">{game.hostName}</span>
                    </div>
                    <div className="wr-room-meta">
                      <span className="wr-meta-item">
                        <Users size={14} />
                        {game.playerCount}/{game.maxPlayers}
                      </span>
                      <span className="wr-meta-item">
                        <Clock size={14} />
                        {formatTimeAgo(game.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    className="wr-join-btn"
                    onClick={() => onJoinGame(game.gameType, game.code)}
                    disabled={isFull}
                    style={!isFull ? { background: gameInfo.color } : undefined}
                  >
                    {isFull ? (
                      'Đã đầy'
                    ) : (
                      <>
                        Tham gia
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
