// Game Tab - Manage game questions (Picture Guess, Bingo, etc.)
// Part of the management section for admins

import { useState } from 'react';
import { Gamepad2, Settings, ChevronRight } from 'lucide-react';
import { PictureGuessPuzzleEditor } from '../picture-guess/picture-guess-puzzle-editor';
import { BingoGameManager } from '../bingo-game/bingo-game-manager';
import { SpeedQuizManager } from '../speed-quiz/speed-quiz-manager';
import { WordMatchManager } from '../word-match/word-match-manager';

type GameSection = 'menu' | 'picture-guess' | 'bingo' | 'speed-quiz' | 'word-match';

// Game configurations with gradients and icons
const GAME_CONFIGS = [
  {
    id: 'picture-guess' as const,
    title: 'Đuổi Hình Bắt Chữ',
    description: 'Tạo và quản lý câu hỏi với hình ảnh gợi ý',
    emoji: '🖼️',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    questionCount: 0,
  },
  {
    id: 'bingo' as const,
    title: 'Bingo',
    description: 'Quản lý cài đặt và theo dõi phòng Bingo',
    emoji: '🎱',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    questionCount: null, // Uses numbers, not questions
  },
  {
    id: 'speed-quiz' as const,
    title: 'Ai Nhanh Hơn Ai',
    description: 'Quản lý cài đặt và câu hỏi Speed Quiz',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, #FF5722 0%, #FF9800 100%)',
    questionCount: 0,
  },
  {
    id: 'word-match' as const,
    title: 'Nối Từ Thách Đấu',
    description: 'Quản lý cài đặt game nối cặp từ',
    emoji: '🔗',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    questionCount: 0,
  },
] as const;

// Disabled games (using other tabs)
const DISABLED_GAMES = [
  {
    title: 'Quiz Game',
    description: 'Câu hỏi trắc nghiệm',
    emoji: '❓',
    badge: 'JLPT Tab',
    gradient: 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)',
  },
  {
    title: 'Chạy Đua / Đua Thuyền',
    description: 'Câu hỏi từ vựng',
    emoji: '🏇',
    badge: 'Flash Card Tab',
    gradient: 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)',
  },
];

export function GameTab() {
  const [activeSection, setActiveSection] = useState<GameSection>('menu');

  // Main menu
  if (activeSection === 'menu') {
    return (
      <div className="game-tab">
        <div className="game-tab-header">
          <div className="game-tab-icon">
            <Gamepad2 size={24} />
          </div>
          <div className="game-tab-title">
            <h3>Quản Lý Game</h3>
            <p>Tạo và quản lý câu hỏi cho các game học tập</p>
          </div>
        </div>

        {/* Active Games */}
        <div className="game-tab-section">
          <h4 className="game-tab-section-title">
            <Settings size={16} />
            Có thể quản lý
          </h4>
          <div className="game-tab-cards">
            {GAME_CONFIGS.map((game) => (
              <div
                key={game.id}
                className="game-tab-card"
                onClick={() => setActiveSection(game.id)}
              >
                <div
                  className="game-card-icon"
                  style={{ background: game.gradient }}
                >
                  <span>{game.emoji}</span>
                </div>
                <div className="game-card-content">
                  <h4>{game.title}</h4>
                  <p>{game.description}</p>
                </div>
                <ChevronRight size={20} className="game-card-arrow" />
              </div>
            ))}
          </div>
        </div>

        {/* Disabled Games */}
        <div className="game-tab-section">
          <h4 className="game-tab-section-title disabled">
            Sử dụng tab khác
          </h4>
          <div className="game-tab-cards">
            {DISABLED_GAMES.map((game, idx) => (
              <div key={idx} className="game-tab-card disabled">
                <div
                  className="game-card-icon"
                  style={{ background: game.gradient }}
                >
                  <span>{game.emoji}</span>
                </div>
                <div className="game-card-content">
                  <h4>{game.title}</h4>
                  <p>{game.description}</p>
                </div>
                <span className="game-card-badge">{game.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Picture Guess Editor
  if (activeSection === 'picture-guess') {
    return (
      <PictureGuessPuzzleEditor
        onClose={() => setActiveSection('menu')}
      />
    );
  }

  // Bingo Manager
  if (activeSection === 'bingo') {
    return (
      <BingoGameManager
        onClose={() => setActiveSection('menu')}
      />
    );
  }

  // Speed Quiz Manager
  if (activeSection === 'speed-quiz') {
    return (
      <SpeedQuizManager
        onClose={() => setActiveSection('menu')}
      />
    );
  }

  // Word Match Manager
  if (activeSection === 'word-match') {
    return (
      <WordMatchManager
        onClose={() => setActiveSection('menu')}
      />
    );
  }

  return null;
}
