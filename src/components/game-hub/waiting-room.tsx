// WaitingRoom - Lobby for browsing available game rooms
// Subscribes to Firestore for real-time room updates across all game types

import { useState, useEffect, useMemo } from 'react';
import { Users, Clock, ArrowRight, RefreshCw, Search, Filter, ArrowLeft, Gamepad2, Plus, Trash2 } from 'lucide-react';
import type { GameType, WaitingRoomGame } from '../../types/game-hub';
import type { UserRole } from '../../types/user';
import { GAMES, getVisibleGames } from '../../types/game-hub';
import { getHiddenGames } from '../../services/game-visibility-storage';
import { subscribeToAllWaitingRooms, deleteWaitingRoom, deleteAllWaitingRooms } from '../../services/game-rooms';
import { isImageAvatar } from '../../utils/avatar-icons';
import { ConfirmModal } from '../ui/confirm-modal';

interface WaitingRoomProps {
  onJoinGame: (gameType: GameType, code: string) => void;
  onBack: () => void;
  onCreateRoom?: () => void;
  filterGameType?: GameType | null;
  userRole?: UserRole;
}

export function WaitingRoom({ onJoinGame, onBack, onCreateRoom, filterGameType, userRole }: WaitingRoomProps) {
  const [rooms, setRooms] = useState<WaitingRoomGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<GameType | 'all'>(filterGameType || 'all');
  const [hiddenGames, setHiddenGames] = useState<GameType[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single'; room: WaitingRoomGame } | { type: 'all' } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const isSuperAdmin = userRole === 'super_admin';

  // Load hidden games
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHiddenGames(getHiddenGames());
  }, []);

  // Get visible games for filter options
  const visibleGames = useMemo(() => getVisibleGames(hiddenGames), [hiddenGames]);

  // Subscribe to Firestore waiting rooms (real-time)
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllWaitingRooms((allRooms) => {
      // Filter out hidden game types
      const visible = allRooms.filter(room => !hiddenGames.includes(room.gameType));
      setRooms(visible);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [hiddenGames]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    let result = rooms;

    // Filter by specific game type
    if (selectedGameFilter !== 'all') {
      result = result.filter(g => g.gameType === selectedGameFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.hostName.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        GAMES[g.gameType]?.name.toLowerCase().includes(q)
      );
    }

    // Sort by newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rooms, selectedGameFilter, searchQuery]);

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Vừa tạo';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút`;
    return `${Math.floor(minutes / 60)} giờ`;
  };

  // Admin: delete single room
  const handleDeleteRoom = async (room: WaitingRoomGame) => {
    setDeleting(true);
    try {
      await deleteWaitingRoom(room.id, room.gameType);
    } catch (err) {
      console.error('Error deleting room:', err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  // Admin: delete all rooms
  const handleDeleteAllRooms = async () => {
    setDeleting(true);
    try {
      await deleteAllWaitingRooms();
    } catch (err) {
      console.error('Error deleting all rooms:', err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="waiting-room-v2">
      {/* Header */}
      <div className="wr-header">
        <button className="wr-back-btn" onClick={() => setShowBackConfirm(true)}>
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
        <button className="wr-refresh-btn" onClick={() => {}} disabled={isLoading} title="Tự động cập nhật">
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
          <div className="wr-filter-select-wrap">
            <Filter size={14} />
            <select
              className="wr-filter-select"
              value={selectedGameFilter}
              onChange={e => setSelectedGameFilter(e.target.value as GameType | 'all')}
            >
              <option value="all">Tất cả game</option>
              {visibleGames.map(game => (
                <option key={game.id} value={game.id}>
                  {game.icon} {game.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="wr-stats-bar">
        <span className="wr-stat">
          <Gamepad2 size={14} />
          {filteredRooms.length} phòng
        </span>
        <span className="wr-stat">
          <Users size={14} />
          {filteredRooms.reduce((sum, g) => sum + g.playerCount, 0)} người chơi
        </span>
        {isSuperAdmin && filteredRooms.length > 0 && (
          <button
            className="wr-admin-delete-all"
            onClick={() => setDeleteConfirm({ type: 'all' })}
            disabled={deleting}
          >
            <Trash2 size={14} />
            Xoá all
          </button>
        )}
      </div>

      {/* Games Grid */}
      <div className="wr-games-container">
        {isLoading ? (
          <div className="wr-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách phòng...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
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
            {filteredRooms.map(game => {
              const gameInfo = GAMES[game.gameType];
              if (!gameInfo) return null;
              const isFull = game.playerCount >= game.maxPlayers;
              const capacityPct = Math.min((game.playerCount / game.maxPlayers) * 100, 100);

              return (
                <div
                  key={game.id}
                  className={`wr-room-card ${isFull ? 'full' : ''}`}
                  style={{ '--card-accent': gameInfo.color, '--card-gradient': gameInfo.gradient } as React.CSSProperties}
                >
                  {/* Header: Game tag + Time */}
                  <div className="wr-card-top">
                    <div className="wr-game-tag">
                      {gameInfo.iconImage ? (
                        <img src={gameInfo.iconImage} alt="" className="wr-tag-icon" />
                      ) : (
                        <span className="wr-tag-emoji">{gameInfo.icon}</span>
                      )}
                      <span>{gameInfo.name}</span>
                    </div>
                    <span className="wr-time">
                      <Clock size={11} />
                      {formatTimeAgo(game.createdAt)}
                    </span>
                  </div>

                  {/* Room Code — hero element */}
                  <div className="wr-code-block">
                    <span className="wr-code-text">{game.code}</span>
                  </div>

                  {/* Host + Capacity */}
                  <div className="wr-card-body">
                    <div className="wr-host">
                      <span className="wr-host-avatar">
                        {isImageAvatar(game.hostAvatar)
                          ? <img src={game.hostAvatar} alt="" className="wr-host-img" />
                          : game.hostAvatar}
                      </span>
                      <span className="wr-host-name">{game.hostName}</span>
                    </div>
                    <div className="wr-capacity">
                      <div className="wr-capacity-track">
                        <div
                          className={`wr-capacity-fill ${capacityPct >= 80 ? 'high' : ''}`}
                          style={{ width: `${capacityPct}%` }}
                        />
                      </div>
                      <span className="wr-capacity-label">
                        <Users size={12} />
                        {game.playerCount}/{game.maxPlayers}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="wr-card-actions">
                    <button
                      className="wr-join-btn"
                      onClick={() => onJoinGame(game.gameType, game.code)}
                      disabled={isFull}
                    >
                      {isFull ? 'Đã đầy' : (
                        <>Tham gia <ArrowRight size={15} /></>
                      )}
                    </button>
                    {isSuperAdmin && (
                      <button
                        className="wr-delete-btn"
                        onClick={() => setDeleteConfirm({ type: 'single', room: game })}
                        disabled={deleting}
                        title="Xoá phòng"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin confirm modals */}
      {deleteConfirm && (
        <ConfirmModal
          isOpen
          title={deleteConfirm.type === 'all' ? 'Xoá tất cả phòng?' : 'Xoá phòng này?'}
          message={deleteConfirm.type === 'all'
            ? `Bạn sắp xoá tất cả ${rooms.length} phòng chờ. Hành động này không thể hoàn tác.`
            : `Xoá phòng "${deleteConfirm.room.title}" (${deleteConfirm.room.code}) với ${deleteConfirm.room.playerCount} người chơi?`}
          confirmText={deleting ? 'Đang xoá...' : 'Xoá'}
          cancelText="Huỷ"
          onConfirm={() => {
            if (deleteConfirm.type === 'all') handleDeleteAllRooms();
            else handleDeleteRoom(deleteConfirm.room);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Back confirm modal */}
      <ConfirmModal
        isOpen={showBackConfirm}
        title="Rời khỏi phòng chờ?"
        message="Bạn có muốn quay lại trang trước?"
        confirmText="Quay lại"
        cancelText="Ở lại"
        variant="info"
        onConfirm={() => { setShowBackConfirm(false); onBack(); }}
        onCancel={() => setShowBackConfirm(false)}
      />
    </div>
  );
}
