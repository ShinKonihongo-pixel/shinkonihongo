// Login page — premium e-learning split layout
// Design: cultural identity + social proof + polished form

import { useState, useEffect } from 'react';
import { User, Lock, KeyRound, Check, AlertCircle, Eye, EyeOff, ArrowRight, BookOpen, Gamepad2, Headphones } from 'lucide-react';
import './login-page.css';

interface LoginPageProps {
  onLogin: (username: string, password: string) => { success: boolean; error?: string };
  onRegister: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auto-clear error when inputs change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (error) setError('');
  }, [username, password, confirmPassword, isRegisterMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
      const result = await onRegister(username, password);
      if (!result.success) {
        setError(result.error || 'Đăng ký thất bại');
        return;
      }
      setShowSuccessModal(true);
    } else {
      const result = onLogin(username, password);
      if (!result.success) {
        setError(result.error || 'Đăng nhập thất bại');
      }
    }
  };

  const handleGoToLogin = () => {
    setShowSuccessModal(false);
    setIsRegisterMode(false);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="lp">
      {/* ===== LEFT — BRAND SHOWCASE ===== */}
      <div className="lp-brand">
        {/* Background layers: gradient + pattern + orbs */}
        <div className="lp-brand-bg" />
        <div className="lp-brand-pattern" aria-hidden="true" />

        {/* Floating geometric shapes */}
        <div className="lp-brand-shapes" aria-hidden="true">
          <div className="lp-shape" />
          <div className="lp-shape" />
          <div className="lp-shape" />
          <div className="lp-shape" />
        </div>

        <div className="lp-brand-content">
          {/* Logo */}
          <div className="lp-brand-logo">
            <span>学</span>
          </div>

          <h1 className="lp-brand-title">
            Shinko<span className="lp-brand-title-jp">日本語</span>
          </h1>
          <p className="lp-brand-desc">
            Hành trình chinh phục tiếng Nhật<br />bắt đầu từ đây.
          </p>

          {/* Stats — social proof */}
          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-num">10,000+</div>
              <div className="lp-stat-label">Học viên</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">500+</div>
              <div className="lp-stat-label">Bài học</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-num">N5→N1</div>
              <div className="lp-stat-label">Đầy đủ</div>
            </div>
          </div>

          {/* Feature cards — visual storytelling */}
          <div className="lp-feature-cards">
            <div className="lp-fcard">
              <div className="lp-fcard-icon"><BookOpen size={20} /></div>
              <div>
                <div className="lp-fcard-label">Từ vựng & Kanji</div>
                <div className="lp-fcard-sub">Hệ thống flashcard thông minh</div>
              </div>
            </div>
            <div className="lp-fcard">
              <div className="lp-fcard-icon"><Headphones size={20} /></div>
              <div>
                <div className="lp-fcard-label">Nghe & Đọc hiểu</div>
                <div className="lp-fcard-sub">Luyện tập hàng ngày với AI</div>
              </div>
            </div>
            <div className="lp-fcard">
              <div className="lp-fcard-icon"><Gamepad2 size={20} /></div>
              <div>
                <div className="lp-fcard-label">Mini Games</div>
                <div className="lp-fcard-sub">Học mà chơi, chơi mà học</div>
              </div>
            </div>
          </div>

          {/* Decorative watermark */}
          <div className="lp-brand-watermark" aria-hidden="true">学ぶ</div>
        </div>
      </div>

      {/* ===== RIGHT — FORM ===== */}
      <div className="lp-form-panel">
        <div className="lp-form-wrapper">
          {/* Mobile-only logo */}
          <div className="lp-mobile-logo">
            <div className="lp-mobile-logo-icon">学</div>
            <span>Shinko</span>
          </div>

          <div className="lp-form-header">
            <h2>{isRegisterMode ? 'Tạo tài khoản mới' : 'Chào mừng trở lại!'}</h2>
            <p>{isRegisterMode
              ? 'Miễn phí. Bắt đầu ngay trong 30 giây.'
              : 'Đăng nhập để tiếp tục hành trình.'}</p>
          </div>

          <form className="lp-form" onSubmit={handleSubmit}>
            <div className="lp-input-group">
              <label htmlFor="lp-username">Tên đăng nhập</label>
              <div className="lp-input-wrap">
                <User size={16} className="lp-input-icon" />
                <input
                  type="text"
                  id="lp-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="lp-input-group">
              <label htmlFor="lp-password">Mật khẩu</label>
              <div className="lp-input-wrap">
                <Lock size={16} className="lp-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="lp-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  className="lp-input-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegisterMode && (
              <div className="lp-input-group">
                <label htmlFor="lp-confirm">Xác nhận mật khẩu</label>
                <div className="lp-input-wrap">
                  <KeyRound size={16} className="lp-input-icon" />
                  <input
                    type="password"
                    id="lp-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="lp-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="lp-submit">
              <span>{isRegisterMode ? 'Tạo tài khoản' : 'Đăng nhập'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="lp-divider"><span>hoặc</span></div>

          <p className="lp-toggle">
            {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button
              type="button"
              className="lp-toggle-link"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode ? 'Đăng nhập' : 'Đăng ký miễn phí'}
            </button>
          </p>

          {/* Trust footer */}
          <div className="lp-trust">
            Được tin dùng bởi học viên trên toàn quốc
          </div>
        </div>
      </div>

      {/* Success modal */}
      {showSuccessModal && (
        <div className="lp-modal-overlay" onClick={handleGoToLogin}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-modal-icon"><Check size={28} /></div>
            <h3>Chào mừng bạn!</h3>
            <p>Tài khoản đã sẵn sàng. Đăng nhập để bắt đầu hành trình chinh phục tiếng Nhật.</p>
            <button className="lp-modal-btn" onClick={handleGoToLogin}>
              Bắt đầu ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
