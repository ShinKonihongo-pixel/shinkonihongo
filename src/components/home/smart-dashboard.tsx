// Smart Dashboard section — "Continue where you left off" + "Suggested for today"
// Replaces static activities grid with personalized recommendations

import { useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Headphones,
  BookOpenCheck,
  ClipboardList,
  Gamepad2,
  Award,
  Trophy,
  MessageCircle,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import type { StudySession, GameSession, JLPTSession } from '../../types/user';
import type { LevelProgress } from '../../types/progress';
import './smart-dashboard.css';

interface SmartDashboardProps {
  studySessions: StudySession[];
  gameSessions: GameSession[];
  jlptSessions: JLPTSession[];
  levelProgress: LevelProgress[];
  cardsDue: number;
  onNavigate: (page: string) => void;
}

interface ActivitySuggestion {
  id: string;
  icon: LucideIcon;
  label: string;
  sublabel: string;
  color: string;
  reason: string; // why this is suggested
  priority: number; // higher = show first
}

// Map page IDs to display info
const PAGE_INFO: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  study: { icon: BookOpen, label: 'Từ Vựng', color: '#3b82f6' },
  'grammar-study': { icon: FileText, label: 'Ngữ Pháp', color: '#8b5cf6' },
  'kanji-study': { icon: BookOpenCheck, label: 'Hán Tự', color: '#f59e0b' },
  reading: { icon: BookOpenCheck, label: 'Đọc Hiểu', color: '#22c55e' },
  listening: { icon: Headphones, label: 'Nghe Hiểu', color: '#06b6d4' },
  exercises: { icon: ClipboardList, label: 'Bài Tập', color: '#f59e0b' },
  'game-hub': { icon: Gamepad2, label: 'Trò Chơi', color: '#ec4899' },
  jlpt: { icon: Award, label: 'JLPT', color: '#22c55e' },
  kaiwa: { icon: MessageCircle, label: 'Hội Thoại', color: '#8b5cf6' },
};

// Detect last active mode from sessions
function getLastActivity(
  studySessions: StudySession[],
  gameSessions: GameSession[],
  jlptSessions: JLPTSession[]
): { page: string; timeAgo: string; detail: string } | null {
  const candidates: Array<{ page: string; date: string; detail: string }> = [];

  if (studySessions.length > 0) {
    const s = studySessions[0];
    candidates.push({
      page: 'study',
      date: s.date,
      detail: `${s.cardsStudied} từ, ${Math.round(s.duration / 60)} phút`,
    });
  }
  if (gameSessions.length > 0) {
    const g = gameSessions[0];
    candidates.push({
      page: 'game-hub',
      date: g.date,
      detail: `${g.gameTitle} — Hạng ${g.rank}/${g.totalPlayers}`,
    });
  }
  if (jlptSessions.length > 0) {
    const j = jlptSessions[0];
    candidates.push({
      page: 'jlpt',
      date: j.date,
      detail: `${j.level} — ${j.correctCount}/${j.totalQuestions} đúng`,
    });
  }

  if (candidates.length === 0) return null;

  // Sort by most recent
  candidates.sort((a, b) => b.date.localeCompare(a.date));
  const latest = candidates[0];

  // Calculate time ago
  const diff = Date.now() - new Date(latest.date).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  let timeAgo: string;
  if (hours < 1) timeAgo = 'vừa xong';
  else if (hours < 24) timeAgo = `${hours} giờ trước`;
  else if (days === 1) timeAgo = 'hôm qua';
  else timeAgo = `${days} ngày trước`;

  return { page: latest.page, timeAgo, detail: latest.detail };
}

// Generate personalized suggestions based on user activity patterns
function getSuggestions(
  studySessions: StudySession[],
  gameSessions: GameSession[],
  jlptSessions: JLPTSession[],
  levelProgress: LevelProgress[],
  cardsDue: number,
): ActivitySuggestion[] {
  const suggestions: ActivitySuggestion[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Count today's activities
  const todayStudy = studySessions.filter(s => s.date.startsWith(today)).length;
  const todayGames = gameSessions.filter(g => g.date.startsWith(today)).length;
  const todayJlpt = jlptSessions.filter(j => j.date.startsWith(today)).length;

  // 1. Cards due for review — highest priority
  if (cardsDue > 0) {
    suggestions.push({
      id: 'study',
      icon: BookOpen,
      label: 'Ôn tập từ vựng',
      sublabel: `${cardsDue} từ cần ôn`,
      color: '#3b82f6',
      reason: 'Đến lúc ôn rồi!',
      priority: 100,
    });
  }

  // 2. Suggest weakest JLPT level
  const weakest = [...levelProgress]
    .filter(l => l.totalCards > 0 && l.masteryPercent < 80)
    .sort((a, b) => a.masteryPercent - b.masteryPercent)[0];
  if (weakest) {
    suggestions.push({
      id: 'study',
      icon: Trophy,
      label: `Cải thiện ${weakest.level}`,
      sublabel: `${weakest.masteryPercent}% — cần ôn thêm`,
      color: '#f59e0b',
      reason: 'Cấp độ yếu nhất',
      priority: 80,
    });
  }

  // 3. Haven't played games today
  if (todayGames === 0) {
    suggestions.push({
      id: 'game-hub',
      icon: Gamepad2,
      label: 'Chơi trò chơi',
      sublabel: 'Học mà chơi, chơi mà học',
      color: '#ec4899',
      reason: 'Chưa chơi hôm nay',
      priority: 60,
    });
  }

  // 4. Haven't done JLPT today
  if (todayJlpt === 0) {
    suggestions.push({
      id: 'jlpt',
      icon: Award,
      label: 'Luyện thi JLPT',
      sublabel: 'Ôn luyện đề thi',
      color: '#22c55e',
      reason: 'Chưa luyện hôm nay',
      priority: 50,
    });
  }

  // 5. Suggest grammar if no study today
  if (todayStudy === 0) {
    suggestions.push({
      id: 'grammar-study',
      icon: FileText,
      label: 'Học ngữ pháp',
      sublabel: 'Nâng cao khả năng ngữ pháp',
      color: '#8b5cf6',
      reason: 'Chưa học hôm nay',
      priority: 40,
    });
  }

  // 6. Always suggest listening/reading as variety
  suggestions.push({
    id: 'listening',
    icon: Headphones,
    label: 'Luyện nghe',
    sublabel: 'Cải thiện kỹ năng nghe',
    color: '#06b6d4',
    reason: 'Kỹ năng đa dạng',
    priority: 30,
  });

  // Sort by priority and take top 4
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
}

export function SmartDashboard({
  studySessions,
  gameSessions,
  jlptSessions,
  levelProgress,
  cardsDue,
  onNavigate,
}: SmartDashboardProps) {
  const lastActivity = useMemo(
    () => getLastActivity(studySessions, gameSessions, jlptSessions),
    [studySessions, gameSessions, jlptSessions]
  );

  const suggestions = useMemo(
    () => getSuggestions(studySessions, gameSessions, jlptSessions, levelProgress, cardsDue),
    [studySessions, gameSessions, jlptSessions, levelProgress, cardsDue]
  );

  return (
    <>
      {/* Continue from last session */}
      {lastActivity && (
        <section className="hp-section">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              <span className="hp-section-jp">続ける</span>
              Tiếp tục
            </h2>
          </div>
          <button
            className="sd-continue"
            onClick={() => onNavigate(lastActivity.page)}
          >
            <div className="sd-continue-icon" style={{ backgroundColor: PAGE_INFO[lastActivity.page]?.color || '#8b5cf6' }}>
              <RotateCcw size={20} />
            </div>
            <div className="sd-continue-info">
              <span className="sd-continue-label">
                {PAGE_INFO[lastActivity.page]?.label || 'Tiếp tục'}
              </span>
              <span className="sd-continue-detail">{lastActivity.detail}</span>
              <span className="sd-continue-time">{lastActivity.timeAgo}</span>
            </div>
            <ArrowRight size={18} className="sd-continue-arrow" />
          </button>
        </section>
      )}

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-header">
            <h2 className="hp-section-title">
              <span className="hp-section-jp">おすすめ</span>
              Đề xuất hôm nay
            </h2>
          </div>
          <div className="sd-suggestions">
            {suggestions.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={`${s.id}-${s.priority}`}
                  className="sd-suggestion"
                  onClick={() => onNavigate(s.id)}
                >
                  <div className="sd-suggestion-icon" style={{ backgroundColor: s.color }}>
                    <Icon size={18} />
                  </div>
                  <div className="sd-suggestion-info">
                    <span className="sd-suggestion-label">{s.label}</span>
                    <span className="sd-suggestion-sub">{s.sublabel}</span>
                  </div>
                  <span className="sd-suggestion-reason">
                    <Lightbulb size={10} />
                    {s.reason}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
