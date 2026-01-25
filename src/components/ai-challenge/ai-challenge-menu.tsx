// AI Challenge Menu - PREMIUM DESIGN with 3 Sessions
// 27 AI opponents, 9 per session, premium card styling

import { useState } from 'react';
import { Lock, Swords, ChevronLeft, Crown, Sparkles, Trophy } from 'lucide-react';
import type { AIDifficulty, AIOpponent } from '../../types/ai-challenge';
import { getAllAIsSorted } from '../../types/ai-challenge';
import { useSettings } from '../../hooks/use-settings';

// JLPT levels - each level has 27 AI opponents
const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
type JLPTLevel = typeof JLPT_LEVELS[number];

// Session configuration (sub-tabs within each JLPT level)
const SESSIONS = [
  { id: 1, name: 'Khởi Đầu', range: [0, 9] as const },
  { id: 2, name: 'Thử Thách', range: [9, 18] as const },
  { id: 3, name: 'Huyền Thoại', range: [18, 27] as const },
];

interface AIOpponentWithStatus extends AIOpponent {
  isUnlocked: boolean;
}

interface AIChallengeMenuProps {
  aiOpponents: AIOpponentWithStatus[];
  progress: { totalWins: number; totalGames: number };
  onSelectAI: (difficulty: AIDifficulty) => void;
  onClose: () => void;
}

// AI challenge taunts - unique personality for each (27 total)
const AI_TAUNTS: Record<AIDifficulty, string> = {
  gentle: "Cùng học hỏi nhé!",
  friendly: "Mình chơi vui thôi~",
  curious: "Hmm, thú vị đấy!",
  eager: "Mình sẵn sàng rồi!",
  clever: "Hãy cẩn thận với mình!",
  diligent: "Chăm chỉ là chìa khóa!",
  quick: "Nhanh tay lên nào!",
  smart: "Tôi khá tự tin đấy!",
  sharp: "Đừng đánh giá thấp tôi!",
  skilled: "Chuẩn bị tinh thần chưa?",
  excellent: "Hãy cho tôi thấy thực lực!",
  talented: "Ít ai vượt qua được tôi...",
  brilliant: "Trí tuệ là sức mạnh!",
  genius: "IQ của tôi rất cao~",
  elite: "Chỉ top 1% mới ở đây!",
  master: "Ta đã tu luyện ngàn năm!",
  grandmaster: "Kiến thức vô hạn...",
  sage: "Trí tuệ cổ đại!",
  superior: "Ngươi dám thách đấu?",
  unbeatable: "Ta chưa từng thua!",
  mythical: "Truyền thuyết là có thật...",
  legendary: "Tên ta vang danh thiên hạ!",
  immortal: "Ta bất tử!",
  divine: "Quyền năng thần thánh!",
  celestial: "Ta đến từ thiên giới!",
  supreme: "Ta đứng trên tất cả!",
  champion: "Kẻ mạnh mới sống sót!",
};

// Tier system for visual hierarchy
function getTierInfo(unlockWins: number): { tier: string } {
  if (unlockWins <= 2) return { tier: 'bronze' };
  if (unlockWins <= 5) return { tier: 'silver' };
  if (unlockWins <= 8) return { tier: 'gold' };
  if (unlockWins <= 11) return { tier: 'platinum' };
  if (unlockWins <= 14) return { tier: 'diamond' };
  if (unlockWins <= 17) return { tier: 'master' };
  if (unlockWins <= 20) return { tier: 'grandmaster' };
  if (unlockWins <= 23) return { tier: 'legend' };
  return { tier: 'champion' };
}

export function AIChallengeMenu({
  aiOpponents,
  progress,
  onSelectAI,
  onClose,
}: AIChallengeMenuProps) {
  const { settings, updateSetting } = useSettings();
  const [selectedAI, setSelectedAI] = useState<AIDifficulty | null>(null);
  const [hoveredAI, setHoveredAI] = useState<AIDifficulty | null>(null);
  const [currentSession, setCurrentSession] = useState(1);

  // Current JLPT level (default to N5 if 'all' was previously set)
  const currentLevel = (settings.aiChallengeLevel === 'all' ? 'N5' : settings.aiChallengeLevel) as JLPTLevel;

  const selectedOpponent = selectedAI ? aiOpponents.find(ai => ai.id === selectedAI) : null;

  // Handle JLPT level change
  const handleLevelChange = (level: JLPTLevel) => {
    updateSetting('aiChallengeLevel', level);
    setSelectedAI(null); // Clear selection when changing level
    setCurrentSession(1); // Reset to first session
  };

  // Get all AIs sorted by unlock order
  const allAIs = getAllAIsSorted().map(ai => {
    const withStatus = aiOpponents.find(a => a.id === ai.id);
    return withStatus || { ...ai, isUnlocked: false };
  });

  // Get AIs for current session
  const session = SESSIONS.find(s => s.id === currentSession)!;
  const sessionAIs = allAIs.slice(session.range[0], session.range[1]);

  const handleStart = () => {
    if (selectedAI) {
      onSelectAI(selectedAI);
    }
  };

  return (
    <div className="ai-select-premium">
      {/* Background */}
      <div className="asp-background">
        <div className="asp-gradient" />
        <div className="asp-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="asp-particle" style={{
              '--delay': `${Math.random() * 5}s`,
              '--x': `${Math.random() * 100}%`,
              '--duration': `${3 + Math.random() * 4}s`,
            } as React.CSSProperties} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="asp-container">
        {/* Header */}
        <header className="asp-header">
          <button className="asp-back-btn" onClick={onClose}>
            <ChevronLeft size={22} />
          </button>
          <div className="asp-title-block">
            <div className="asp-title-line">
              <Swords className="asp-title-icon" size={24} />
              <h1>CHỌN ĐỐI THỦ</h1>
            </div>
            <p className="asp-subtitle">Chiến thắng để mở khóa đối thủ mới</p>
          </div>
          <div className="asp-player-stats">
            <div className="asp-stat">
              <span className="asp-stat-value">{progress.totalWins}</span>
              <span className="asp-stat-label">Thắng</span>
            </div>
            <div className="asp-stat-divider" />
            <div className="asp-stat">
              <Trophy size={16} className="asp-stat-icon" />
              <span className="asp-stat-label">Rank</span>
            </div>
          </div>
        </header>

        {/* JLPT Level Tabs - Main Navigation */}
        <div className="asp-level-tabs">
          {JLPT_LEVELS.map(level => (
            <button
              key={level}
              className={`asp-level-tab ${currentLevel === level ? 'active' : ''}`}
              onClick={() => handleLevelChange(level)}
            >
              <span className="asp-level-name">{level}</span>
            </button>
          ))}
        </div>

        {/* Session Tabs - Sub Navigation */}
        <div className="asp-session-tabs">
          {SESSIONS.map(s => (
            <button
              key={s.id}
              className={`asp-session-tab ${currentSession === s.id ? 'active' : ''}`}
              onClick={() => setCurrentSession(s.id)}
            >
              <span className="asp-session-num">{s.id}</span>
              <span className="asp-session-name">{s.name}</span>
            </button>
          ))}
        </div>

        {/* AI Grid - 9 per session */}
        <div className="asp-grid-wrapper">
          <div className="asp-grid">
            {sessionAIs.map((ai, index) => {
              const isSelected = selectedAI === ai.id;
              const isHovered = hoveredAI === ai.id;
              const taunt = AI_TAUNTS[ai.id];
              const tierInfo = getTierInfo(ai.unlockWins);
              const globalIndex = session.range[0] + index + 1;

              return (
                <button
                  key={ai.id}
                  className={`asp-card ${ai.isUnlocked ? '' : 'locked'} ${isSelected ? 'selected' : ''} tier-${tierInfo.tier}`}
                  style={{ '--ai-color': ai.color } as React.CSSProperties}
                  onClick={() => ai.isUnlocked && setSelectedAI(ai.id)}
                  onMouseEnter={() => setHoveredAI(ai.id)}
                  onMouseLeave={() => setHoveredAI(null)}
                  disabled={!ai.isUnlocked}
                >
                  {/* Card border glow */}
                  <div className="asp-card-border" />

                  {/* Card shine effect */}
                  <div className="asp-card-shine" />

                  {/* Card content */}
                  <div className="asp-card-content">
                    <div className="asp-avatar-wrapper">
                      <div className="asp-avatar-glow" />
                      <div className="asp-avatar">
                        <span>{ai.emoji}</span>
                      </div>
                      <div className={`asp-tier-badge tier-${tierInfo.tier}`}>
                        {tierInfo.tier === 'champion' ? <Crown size={12} /> : globalIndex}
                      </div>
                    </div>
                    <div className="asp-card-info">
                      <span className="asp-card-name">{ai.name}</span>
                      <span className="asp-card-taunt">"{taunt}"</span>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="asp-selected-ring">
                      <div className="ring-pulse" />
                    </div>
                  )}

                  {/* Sparkles on hover */}
                  {(isHovered || isSelected) && ai.isUnlocked && (
                    <div className="asp-card-particles">
                      <Sparkles size={14} className="sparkle s1" />
                      <Sparkles size={10} className="sparkle s2" />
                    </div>
                  )}

                  {/* Lock overlay */}
                  {!ai.isUnlocked && (
                    <div className="asp-lock-overlay">
                      <Lock size={24} />
                      <span className="asp-lock-text">Thắng #{globalIndex - 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Bar - Bottom */}
        <div className="asp-action-bar">
          {selectedOpponent ? (
            <button className="asp-battle-btn-pro" onClick={handleStart}>
              <div className="asp-btn-glow" />
              <div className="asp-btn-content">
                <div className="asp-btn-left">
                  <div className="asp-btn-avatar">
                    <span>{selectedOpponent.emoji}</span>
                  </div>
                  <div className="asp-btn-info">
                    <span className="asp-btn-vs">VS</span>
                    <span className="asp-btn-name">{selectedOpponent.name}</span>
                  </div>
                </div>
                <div className="asp-btn-right">
                  <div className="asp-btn-action">
                    <Swords size={20} />
                    <span>BẮT ĐẦU</span>
                  </div>
                  <div className="asp-btn-level">{currentLevel}</div>
                </div>
              </div>
            </button>
          ) : (
            <div className="asp-hint">
              <Sparkles size={18} />
              <span>Chọn đối thủ để bắt đầu trận đấu</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
