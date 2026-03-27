// Picture Guess Menu - Main menu with game modes, instructions, and leaderboard
// Players can start single player, create/join multiplayer, or view leaderboard

import { useState } from 'react';
import { Play, Users, BookOpen, Trophy, Image, HelpCircle, Sparkles } from 'lucide-react';
import { ModalShell } from '../ui/modal-shell';

interface PictureGuessMenuProps {
  onStartSingle: () => void;
  onCreateMultiplayer: () => void;
  onJoinGame: (code: string) => void;
  loading: boolean;
  error: string | null;
}

export function PictureGuessMenu({
  onStartSingle,
  onCreateMultiplayer,
  onJoinGame,
  loading,
  error,
}: PictureGuessMenuProps) {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleJoin = () => {
    if (joinCode.trim().length === 6) {
      onJoinGame(joinCode.trim());
      setShowJoinModal(false);
    }
  };

  return (
    <div className="picture-guess-menu">
      {/* Hero Section */}
      <div className="pg-menu-hero">
        <div className="pg-hero-icon">
          <Image size={64} />
          <Sparkles className="sparkle sparkle-1" size={20} />
          <Sparkles className="sparkle sparkle-2" size={16} />
        </div>
        <h1 className="pg-hero-title">Đuổi Hình Bắt Chữ</h1>
        <p className="pg-hero-subtitle">Nhìn hình đoán từ tiếng Nhật</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="pg-error-banner">
          <span>{error}</span>
        </div>
      )}

      {/* Game Mode Cards */}
      <div className="pg-menu-cards">
        {/* Single Player */}
        <div className="pg-menu-card single-player" onClick={onStartSingle}>
          <div className="pg-card-icon">
            <Play size={32} />
          </div>
          <h3>Chơi Một Mình</h3>
          <p>Luyện tập với tốc độ của riêng bạn</p>
          <ul className="pg-card-features">
            <li>Không giới hạn thời gian</li>
            <li>Gợi ý không giới hạn</li>
            <li>Ôn tập từ vựng sau game</li>
          </ul>
          <button className="pg-card-btn" disabled={loading}>
            {loading ? 'Đang tải...' : 'Bắt Đầu'}
          </button>
        </div>

        {/* Multiplayer */}
        <div className="pg-menu-card multiplayer">
          <div className="pg-card-icon">
            <Users size={32} />
          </div>
          <h3>Chơi Nhiều Người</h3>
          <p>Thi đấu với bạn bè trong thời gian thực</p>
          <ul className="pg-card-features">
            <li>2-20 người chơi</li>
            <li>Bảng xếp hạng trực tiếp</li>
            <li>Điểm thưởng tốc độ</li>
          </ul>
          <div className="pg-card-buttons">
            <button className="pg-card-btn primary" onClick={onCreateMultiplayer} disabled={loading}>
              Tạo Phòng
            </button>
            <button className="pg-card-btn secondary" onClick={() => setShowJoinModal(true)} disabled={loading}>
              Tham Gia
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="pg-menu-actions">
        <button className="pg-action-btn" onClick={() => setShowInstructions(true)}>
          <HelpCircle size={20} />
          <span>Hướng Dẫn</span>
        </button>
        <button className="pg-action-btn">
          <Trophy size={20} />
          <span>Bảng Xếp Hạng</span>
        </button>
        <button className="pg-action-btn">
          <BookOpen size={20} />
          <span>Từ Đã Học</span>
        </button>
      </div>

      {/* Join Game Modal */}
      <ModalShell
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Tham Gia Phòng"
        maxWidth={360}
      >
        <p>Nhập mã phòng 6 chữ số</p>
        <input
          type="text"
          className="pg-code-input"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
        <div className="pg-modal-actions">
          <button className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={joinCode.length !== 6 || loading}
          >
            {loading ? 'Đang tham gia...' : 'Tham Gia'}
          </button>
        </div>
      </ModalShell>

      {/* Instructions Modal */}
      <ModalShell
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
        title="Cách Chơi Đuổi Hình Bắt Chữ"
        maxWidth={520}
      >
        <div className="instruction-section">
          <h4>🎯 Mục tiêu</h4>
          <p>Nhìn vào hình ảnh/emoji và đoán từ tiếng Nhật tương ứng.</p>
        </div>

        <div className="instruction-section">
          <h4>🎮 Cách chơi</h4>
          <ol>
            <li>Quan sát hình ảnh/emoji hiển thị trên màn hình</li>
            <li>Gõ từ tiếng Nhật bạn nghĩ là đáp án</li>
            <li>Nhấn Enter hoặc nút "Trả lời" để gửi câu trả lời</li>
            <li>Trả lời đúng để ghi điểm!</li>
          </ol>
        </div>

        <div className="instruction-section">
          <h4>💡 Gợi ý</h4>
          <p>Bạn có thể sử dụng các gợi ý nếu gặp khó khăn:</p>
          <ul>
            <li><strong>🔤 Chữ đầu:</strong> Hiển thị ký tự đầu tiên (-10 điểm)</li>
            <li><strong>📏 Độ dài:</strong> Hiển thị số ký tự của từ (-5 điểm)</li>
            <li><strong>💡 Gợi ý nghĩa:</strong> Hiển thị một phần nghĩa (-15 điểm)</li>
            <li><strong>🈳 Hán Việt:</strong> Hiển thị âm Hán Việt (-10 điểm)</li>
          </ul>
        </div>

        <div className="instruction-section">
          <h4>⭐ Tính điểm</h4>
          <ul>
            <li>Điểm cơ bản: 100-200 điểm tùy độ khó</li>
            <li>Điểm thưởng tốc độ: Trả lời nhanh hơn = nhiều điểm hơn</li>
            <li>Điểm streak: Trả lời đúng liên tiếp để nhận thưởng</li>
          </ul>
        </div>

        <button className="btn btn-primary" onClick={() => setShowInstructions(false)}>
          Đã hiểu!
        </button>
      </ModalShell>
    </div>
  );
}
