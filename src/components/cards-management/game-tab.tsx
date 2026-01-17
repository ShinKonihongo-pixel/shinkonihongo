// Game Tab - Manage game questions (Picture Guess, etc.)
// Part of the management section for admins

import { useState } from 'react';
import { Image, Gamepad2 } from 'lucide-react';
import { PictureGuessPuzzleEditor } from '../picture-guess/picture-guess-puzzle-editor';

type GameSection = 'menu' | 'picture-guess';

export function GameTab() {
  const [activeSection, setActiveSection] = useState<GameSection>('menu');

  // Main menu
  if (activeSection === 'menu') {
    return (
      <div className="game-tab">
        <div className="game-tab-header">
          <Gamepad2 size={28} />
          <h3>Quản Lý Câu Hỏi Game</h3>
        </div>

        <div className="game-tab-cards">
          {/* Picture Guess */}
          <div
            className="game-tab-card"
            onClick={() => setActiveSection('picture-guess')}
          >
            <div className="game-card-icon">
              <Image size={40} />
            </div>
            <div className="game-card-info">
              <h4>Đuổi Hình Bắt Chữ</h4>
              <p>Tạo và quản lý câu hỏi với emoji gợi ý</p>
            </div>
            <span className="game-card-arrow">→</span>
          </div>

          {/* Future game types can be added here */}
          <div className="game-tab-card disabled">
            <div className="game-card-icon">
              <Gamepad2 size={40} />
            </div>
            <div className="game-card-info">
              <h4>Quiz Game</h4>
              <p>Câu hỏi trắc nghiệm (Sử dụng JLPT)</p>
            </div>
            <span className="game-card-badge">JLPT Tab</span>
          </div>

          <div className="game-tab-card disabled">
            <div className="game-card-icon">
              <span style={{ fontSize: '2rem' }}>🏇</span>
            </div>
            <div className="game-card-info">
              <h4>Đua Ngựa / Đua Thuyền</h4>
              <p>Câu hỏi từ vựng (Sử dụng Flash Card)</p>
            </div>
            <span className="game-card-badge">Flash Card Tab</span>
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

  return null;
}
