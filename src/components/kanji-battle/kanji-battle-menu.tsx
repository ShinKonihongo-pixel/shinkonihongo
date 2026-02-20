// Kanji Battle Menu — Premium dark entry point with animated background
// Matches the PremiumLobbyShell aesthetic with battle-red accent

import { useState } from 'react';
import { Swords, Users, BookOpen, PenTool, Sparkles, X, ArrowRight, Keyboard } from 'lucide-react';
import './kanji-battle-menu.css';

interface KanjiBattleMenuProps {
  onCreateGame: () => void;
  onJoinGame: (code: string) => void;
  onShowGuide: () => void;
  onClose: () => void;
}

export const KanjiBattleMenu: React.FC<KanjiBattleMenuProps> = ({
  onCreateGame,
  onJoinGame,
  onShowGuide,
  onClose,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoin = () => {
    if (joinCode.trim().length === 6) {
      onJoinGame(joinCode.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <div className="kb-menu">
      {/* Animated background */}
      <div className="kb-menu-bg">
        <div className="kb-menu-orb kb-menu-orb-1" />
        <div className="kb-menu-orb kb-menu-orb-2" />
        <div className="kb-menu-orb kb-menu-orb-3" />
        <div className="kb-menu-grid" />
      </div>

      {/* Close button */}
      <button className="kb-menu-close" onClick={onClose} title="Đóng">
        <X size={18} />
      </button>

      {/* Content */}
      <div className="kb-menu-content">
        {/* Hero */}
        <div className="kb-menu-hero">
          <div className="kb-menu-icon-wrap">
            <Swords size={48} strokeWidth={1.5} />
          </div>
          <h1 className="kb-menu-title">Đại Chiến Kanji</h1>
          <p className="kb-menu-subtitle">Đọc hoặc viết kanji nhanh nhất để chiến thắng!</p>
        </div>

        {/* Action buttons */}
        <div className="kb-menu-actions">
          <button className="kb-menu-btn kb-menu-btn-primary" onClick={onCreateGame}>
            <div className="kb-menu-btn-icon">
              <Swords size={22} />
            </div>
            <div className="kb-menu-btn-text">
              <span className="kb-menu-btn-label">Tạo Phòng</span>
              <span className="kb-menu-btn-desc">Tạo phòng mới và mời bạn bè</span>
            </div>
            <ArrowRight size={18} className="kb-menu-btn-arrow" />
          </button>

          {!showJoinInput ? (
            <button className="kb-menu-btn kb-menu-btn-secondary" onClick={() => setShowJoinInput(true)}>
              <div className="kb-menu-btn-icon">
                <Users size={22} />
              </div>
              <div className="kb-menu-btn-text">
                <span className="kb-menu-btn-label">Vào Phòng</span>
                <span className="kb-menu-btn-desc">Nhập mã phòng để tham gia</span>
              </div>
              <ArrowRight size={18} className="kb-menu-btn-arrow" />
            </button>
          ) : (
            <div className="kb-menu-join-box">
              <div className="kb-menu-join-header">
                <Keyboard size={16} />
                <span>Nhập mã phòng (6 ký tự)</span>
              </div>
              <div className="kb-menu-join-row">
                <input
                  type="text"
                  className="kb-menu-join-input"
                  placeholder="ABCDEF"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={handleKeyDown}
                  maxLength={6}
                  autoFocus
                />
                <button
                  className="kb-menu-join-go"
                  onClick={handleJoin}
                  disabled={joinCode.length !== 6}
                >
                  Vào
                </button>
              </div>
              <button className="kb-menu-join-cancel" onClick={() => { setShowJoinInput(false); setJoinCode(''); }}>
                Hủy
              </button>
            </div>
          )}

          <button className="kb-menu-btn kb-menu-btn-outline" onClick={onShowGuide}>
            <div className="kb-menu-btn-icon">
              <BookOpen size={22} />
            </div>
            <div className="kb-menu-btn-text">
              <span className="kb-menu-btn-label">Hướng Dẫn</span>
              <span className="kb-menu-btn-desc">Luật chơi và mẹo hay</span>
            </div>
            <ArrowRight size={18} className="kb-menu-btn-arrow" />
          </button>
        </div>

        {/* Feature chips */}
        <div className="kb-menu-features">
          <div className="kb-menu-chip">
            <BookOpen size={14} />
            <span>Đọc Kanji</span>
          </div>
          <div className="kb-menu-chip">
            <PenTool size={14} />
            <span>Viết Kanji</span>
          </div>
          <div className="kb-menu-chip kb-menu-chip-accent">
            <Sparkles size={14} />
            <span>Kỹ năng đặc biệt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
