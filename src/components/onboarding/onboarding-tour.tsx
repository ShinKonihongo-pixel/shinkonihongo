// Onboarding tour modal - introduces app features step by step
// Shows on first login, re-accessible from home page

import { useState, useCallback, useRef, type PointerEvent, useEffect } from 'react';
import {
  Home,
  Layers,
  FileText,
  BookOpen,
  BookOpenCheck,
  Headphones,
  ClipboardList,
  School,
  Award,
  MessageCircle,
  Gamepad2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  // Decorative icons per step
  Flame,
  Zap,
  Trophy,
  Clock,
  Star,
  Users,
  Mic,
  Brain,
  Target,
  Music,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import { ModalShell } from '../ui/modal-shell';
import './onboarding-tour.css';

interface TourStep {
  icon: LucideIcon;
  decoIcons: LucideIcon[];
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
}

// 11 tour steps matching sidebar features
const TOUR_STEPS: TourStep[] = [
  {
    icon: Home,
    decoIcons: [Flame, Zap, Trophy],
    title: 'Trang Chủ',
    subtitle: 'ホーム',
    description: 'Theo dõi tiến độ học tập, streak hàng ngày, và XP tích lũy. Bắt đầu hành trình chinh phục tiếng Nhật từ đây!',
    accentColor: '#3b82f6',
  },
  {
    icon: Layers,
    decoIcons: [Star, Clock, Brain],
    title: 'Từ Vựng',
    subtitle: '単語',
    description: 'Học từ vựng qua flashcard thông minh với hệ thống lặp lại cách quãng (SRS). Từ vựng được phân theo cấp độ JLPT.',
    accentColor: '#8b5cf6',
  },
  {
    icon: FileText,
    decoIcons: [BookOpen, Pencil, Star],
    title: 'Ngữ Pháp',
    subtitle: '文法',
    description: 'Học ngữ pháp theo từng bài, từng cấp độ JLPT. Mỗi mẫu ngữ pháp có giải thích chi tiết và ví dụ minh họa.',
    accentColor: '#a855f7',
  },
  {
    icon: BookOpen,
    decoIcons: [Pencil, Target, Star],
    title: 'Hán Tự',
    subtitle: '漢字',
    description: 'Học viết Kanji với HanziWriter tương tác. Xem nét viết, bộ thủ phân tích, và nghĩa Hán Việt cho từng chữ.',
    accentColor: '#f59e0b',
  },
  {
    icon: BookOpenCheck,
    decoIcons: [FileText, Brain, Target],
    title: 'Đọc Hiểu',
    subtitle: '読解',
    description: 'Luyện đọc hiểu với các bài đọc phân theo cấp độ. Có furigana hỗ trợ và câu hỏi kiểm tra độ hiểu.',
    accentColor: '#22c55e',
  },
  {
    icon: Headphones,
    decoIcons: [Music, Mic, Star],
    title: 'Nghe Hiểu',
    subtitle: '聴解',
    description: 'Nghe và luyện phát âm với audio player. Hỗ trợ điều chỉnh tốc độ, lặp lại từng đoạn để nghe rõ hơn.',
    accentColor: '#06b6d4',
  },
  {
    icon: ClipboardList,
    decoIcons: [Pencil, Target, Award],
    title: 'Bài Tập',
    subtitle: '練習',
    description: 'Làm bài tập tổng hợp để kiểm tra kiến thức. Nhiều dạng bài: trắc nghiệm, điền từ, sắp xếp câu.',
    accentColor: '#f59e0b',
  },
  {
    icon: School,
    decoIcons: [Users, Star, Trophy],
    title: 'Lớp Học',
    subtitle: '教室',
    description: 'Tham gia lớp học trực tuyến với giáo viên và bạn học. Trao đổi bài, nhận thông báo từ lớp.',
    accentColor: '#ec4899',
  },
  {
    icon: Award,
    decoIcons: [Trophy, Target, Star],
    title: 'Luyện Thi JLPT',
    subtitle: '試験対策',
    description: 'Ôn luyện đề thi JLPT với ngân hàng câu hỏi phong phú. Phân loại theo N5 đến N1, theo từng phần thi.',
    accentColor: '#22c55e',
  },
  {
    icon: MessageCircle,
    decoIcons: [Mic, Users, Brain],
    title: 'Hội Thoại',
    subtitle: '会話',
    description: 'Luyện hội thoại tiếng Nhật với nhiều chủ đề thực tế. Từ giao tiếp hàng ngày đến các tình huống nâng cao.',
    accentColor: '#8b5cf6',
  },
  {
    icon: Gamepad2,
    decoIcons: [Trophy, Zap, Users],
    title: 'Trò Chơi',
    subtitle: 'ゲーム',
    description: 'Học mà chơi, chơi mà học! Quiz Battle đối kháng, Golden Bell, đoán hình, và nhiều mini-game hấp dẫn.',
    accentColor: '#ec4899',
  },
];

const SWIPE_THRESHOLD = 50;

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const totalSteps = TOUR_STEPS.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
      else if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
    else onComplete();
  }, [currentStep, totalSteps, onComplete]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  }, [currentStep]);

  // Swipe handlers
  const onPointerDown = (e: PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    setIsSwiping(true);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!pointerStart.current || !isSwiping) return;
    const dx = e.clientX - pointerStart.current.x;
    // Clamp: don't allow swipe past first/last
    if ((currentStep === 0 && dx > 0) || (currentStep === totalSteps - 1 && dx < 0)) {
      setSwipeOffset(dx * 0.3); // resistance
    } else {
      setSwipeOffset(dx);
    }
  };

  const onPointerUp = () => {
    if (!pointerStart.current) return;
    if (swipeOffset < -SWIPE_THRESHOLD) goNext();
    else if (swipeOffset > SWIPE_THRESHOLD) goPrev();
    setSwipeOffset(0);
    setIsSwiping(false);
    pointerStart.current = null;
  };

  const isLast = currentStep === totalSteps - 1;
  const isFirst = currentStep === 0;

  return (
    <ModalShell isOpen onClose={onComplete} maxWidth={480} hideClose className="ob-modal-shell">
      <div className="ob-modal">
        {/* Close button */}
        <button className="ob-close" onClick={onComplete} aria-label="Đóng">
          <X size={18} />
        </button>

        {/* Swipeable steps area */}
        <div
          className="ob-steps"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className={`ob-track ${isSwiping ? 'ob-swiping' : ''}`}
            style={{ transform: `translateX(calc(-${currentStep * 100}% + ${swipeOffset}px))` }}
          >
            {TOUR_STEPS.map((s, i) => {
              const StepIcon = s.icon;
              return (
                <div key={i} className="ob-step">
                  {/* Step counter */}
                  <span className="ob-step-counter">{i + 1} / {totalSteps}</span>

                  {/* Illustration */}
                  <div className="ob-illustration">
                    <div className="ob-illust-bg" style={{ background: s.accentColor }} />
                    <div className="ob-illust-glass" />
                    <div className="ob-illust-icon">
                      <StepIcon size={48} strokeWidth={1.5} />
                    </div>
                    {s.decoIcons.map((Deco, di) => (
                      <div key={di} className={`ob-deco ob-deco-${di + 1}`} style={{ color: s.accentColor }}>
                        <Deco size={18} />
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="ob-content">
                    {i === 0 && (
                      <div className="ob-welcome-badge">
                        <Sparkles size={14} />
                        Chào mừng bạn đến Shinko!
                      </div>
                    )}
                    <h2 className="ob-title">{s.title}</h2>
                    <span className="ob-subtitle">{s.subtitle}</span>
                    <p className="ob-description">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: dots + nav */}
        <div className="ob-footer">
          <div className="ob-dots">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                className={`ob-dot ${i === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(i)}
                aria-label={`Bước ${i + 1}`}
              />
            ))}
          </div>

          <div className="ob-nav">
            {!isFirst && (
              <button className="ob-btn ob-btn-prev" onClick={goPrev}>
                <ChevronLeft size={18} />
                Trước
              </button>
            )}
            <button className="ob-btn ob-btn-next" onClick={goNext}>
              {isLast ? 'Bắt đầu học!' : 'Tiếp theo'}
              {!isLast && <ChevronRight size={18} />}
              {isLast && <Sparkles size={18} />}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
