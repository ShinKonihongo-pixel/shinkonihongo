// Friends panel component - manage friends and send requests

import { useState } from 'react';
import type { User } from '../../types/user';
import type { FriendWithUser } from '../../types/friendship';
import { Users, UserPlus, UserMinus, MessageCircle, Gamepad2, Gift, Search } from 'lucide-react';

interface FriendsPanelProps {
  friends: FriendWithUser[];
  pendingRequests: Array<{
    id: string;
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar?: string;
    message?: string;
    createdAt: string;
  }>;
  allUsers: User[];
  currentUserId: string;
  loading: boolean;
  onSendRequest: (toUserId: string, message?: string) => Promise<{ success: boolean; error?: string }>;
  onRespondRequest: (requestId: string, accept: boolean) => Promise<boolean>;
  onRemoveFriend: (friendshipId: string) => Promise<boolean>;
  onSendBadge: (friendId: string) => void;
  onInviteToGame?: (friendId: string) => void;
  isFriend: (userId: string) => boolean;
}

export function FriendsPanel({
  friends,
  pendingRequests,
  allUsers,
  currentUserId,
  loading,
  onSendRequest,
  onRespondRequest,
  onRemoveFriend,
  onSendBadge,
  onInviteToGame,
  isFriend,
}: FriendsPanelProps) {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Filter users for search (exclude self and existing friends)
  const searchableUsers = allUsers.filter(u =>
    u.id !== currentUserId &&
    !isFriend(u.id) &&
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSendRequest = async (userId: string) => {
    setSending(true);
    setError('');
    const result = await onSendRequest(userId, requestMessage || undefined);
    if (!result.success) {
      setError(result.error || 'Lỗi');
    } else {
      setRequestMessage('');
      setSelectedUserId(null);
    }
    setSending(false);
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa ${friendName} khỏi danh sách bạn bè?`)) {
      await onRemoveFriend(friendshipId);
    }
  };

  if (loading) {
    return <div className="friends-panel-loading">Đang tải...</div>;
  }

  return (
    <div className="friends-panel">
      {/* Tabs */}
      <div className="friends-tabs">
        <button
          className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <Users size={16} />
          <span>Bạn bè ({friends.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <UserPlus size={16} />
          <span>Lời mời ({pendingRequests.length})</span>
          {pendingRequests.length > 0 && <span className="badge-count">{pendingRequests.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          <Search size={16} />
          <span>Tìm bạn</span>
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>Chưa có bạn bè</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('find')}>
                Tìm bạn mới
              </button>
            </div>
          ) : (
            friends.map(f => (
              <div key={f.friendship.id} className="friend-item">
                <div className="friend-avatar">
                  {f.friendAvatar || f.friendName.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{f.friendName}</span>
                </div>
                <div className="friend-actions">
                  <button
                    className="btn btn-icon"
                    onClick={() => onSendBadge(f.friendId)}
                    title="Tặng huy hiệu"
                  >
                    <Gift size={16} />
                  </button>
                  {onInviteToGame && (
                    <button
                      className="btn btn-icon"
                      onClick={() => onInviteToGame(f.friendId)}
                      title="Mời chơi game"
                    >
                      <Gamepad2 size={16} />
                    </button>
                  )}
                  <button
                    className="btn btn-icon danger"
                    onClick={() => handleRemoveFriend(f.friendship.id, f.friendName)}
                    title="Xóa bạn"
                  >
                    <UserMinus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === 'requests' && (
        <div className="requests-list">
          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>Không có lời mời kết bạn</p>
            </div>
          ) : (
            pendingRequests.map(req => (
              <div key={req.id} className="request-item">
                <div className="request-avatar">
                  {req.fromUserAvatar || req.fromUserName.charAt(0).toUpperCase()}
                </div>
                <div className="request-info">
                  <span className="request-name">{req.fromUserName}</span>
                  {req.message && <span className="request-message">"{req.message}"</span>}
                  <span className="request-time">
                    {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="request-actions">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => onRespondRequest(req.id, true)}
                  >
                    Chấp nhận
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => onRespondRequest(req.id, false)}
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Find Friends */}
      {activeTab === 'find' && (
        <div className="find-friends">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="users-list">
            {searchQuery.length === 0 ? (
              <p className="hint-text">Nhập tên để tìm bạn bè</p>
            ) : searchableUsers.length === 0 ? (
              <p className="hint-text">Không tìm thấy người dùng</p>
            ) : (
              searchableUsers.slice(0, 10).map(user => (
                <div key={user.id} className="user-search-item">
                  <div className="user-avatar">
                    {user.avatar || (user.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user.displayName || user.username}</span>
                  </div>
                  {selectedUserId === user.id ? (
                    <div className="add-friend-form">
                      <input
                        type="text"
                        placeholder="Lời nhắn (tùy chọn)"
                        value={requestMessage}
                        onChange={e => setRequestMessage(e.target.value)}
                        className="form-input"
                      />
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleSendRequest(user.id)}
                        disabled={sending}
                      >
                        {sending ? '...' : 'Gửi'}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelectedUserId(null)}
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <UserPlus size={14} />
                      Kết bạn
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
