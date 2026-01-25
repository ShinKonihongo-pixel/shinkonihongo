// App header with navigation and user info

import { useState } from 'react';
import type { CurrentUser } from '../../types/user';

export type Page = 'home' | 'cards' | 'study' | 'grammar-study' | 'reading' | 'progress' | 'game-hub' | 'quiz' | 'racing' | 'golden-bell' | 'picture-guess' | 'jlpt' | 'kaiwa' | 'lectures' | 'lecture-editor' | 'chat' | 'settings' | 'profile' | 'classroom' | 'branches' | 'teachers' | 'salary' | 'my-teaching' | 'notifications' | 'daily-words' | 'listening';

// Helper to get role display name
const getRoleBadge = (role: string): { label: string; className: string } | null => {
  switch (role) {
    case 'super_admin': return { label: 'Super Admin', className: 'role-badge super-admin' };
    case 'admin': return { label: 'Admin', className: 'role-badge admin' };
    case 'vip_user': return { label: 'VIP', className: 'role-badge vip' };
    default: return null;
  }
};

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: CurrentUser | null;
  onLogout: () => void;
}

export function Header({ currentPage, onNavigate, currentUser, onLogout }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title">日本語 Flashcards</h1>
        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          {/* User info and logout at top of mobile menu */}
          {currentUser && (
            <div className="nav-user-section">
              <div className="nav-user-info">
                <div className="user-avatar-small">
                  {currentUser.avatar || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
                </div>
                <span className="username">
                  {currentUser.displayName || currentUser.username}
                  {getRoleBadge(currentUser.role) && (
                    <span className={getRoleBadge(currentUser.role)!.className}>
                      {getRoleBadge(currentUser.role)!.label}
                    </span>
                  )}
                </span>
              </div>
              <button className="nav-btn nav-logout-btn" onClick={onLogout}>
                Đăng xuất
              </button>
            </div>
          )}
          <button
            className={`nav-btn ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleNavigate('home')}
          >
            Trang chủ
          </button>
          {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
            <button
              className={`nav-btn ${currentPage === 'cards' ? 'active' : ''}`}
              onClick={() => handleNavigate('cards')}
            >
              Quản Lí
            </button>
          )}
          <button
            className={`nav-btn ${currentPage === 'study' ? 'active' : ''}`}
            onClick={() => handleNavigate('study')}
          >
            Học
          </button>
          <button
            className={`nav-btn ${currentPage === 'progress' ? 'active' : ''}`}
            onClick={() => handleNavigate('progress')}
          >
            Tiến độ
          </button>
          <button
            className={`nav-btn ${currentPage === 'quiz' ? 'active' : ''}`}
            onClick={() => handleNavigate('quiz')}
          >
            Game
          </button>
          <button
            className={`nav-btn ${currentPage === 'jlpt' ? 'active' : ''}`}
            onClick={() => handleNavigate('jlpt')}
          >
            JLPT
          </button>
          <button
            className={`nav-btn ${currentPage === 'lectures' ? 'active' : ''}`}
            onClick={() => handleNavigate('lectures')}
          >
            Bài giảng
          </button>
          {(currentUser?.role === 'vip_user' || currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
            <button
              className={`nav-btn ${currentPage === 'kaiwa' ? 'active' : ''}`}
              onClick={() => handleNavigate('kaiwa')}
            >
              会話
            </button>
          )}
          <button
            className={`nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavigate('settings')}
          >
            Cài đặt
          </button>
        </nav>
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-icon ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
      {/* Desktop user info */}
      {currentUser && (
        <div className="user-info desktop-user-info">
          <div className="user-avatar-small">
            {currentUser.avatar || (currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
          </div>
          <span className="username">
            {currentUser.displayName || currentUser.username}
            {getRoleBadge(currentUser.role) && (
              <span className={getRoleBadge(currentUser.role)!.className}>
                {getRoleBadge(currentUser.role)!.label}
              </span>
            )}
          </span>
          <button className="btn btn-logout" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}
