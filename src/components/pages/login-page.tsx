// Login page component

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => { success: boolean; error?: string };
  onRegister: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auto-clear error when inputs change
  useEffect(() => {
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
      // Show success modal
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
    <div className="login-page">
      <div className="login-card">
        <h2>{isRegisterMode ? 'Đăng ký' : 'Đăng nhập'}</h2>
        <p className="login-subtitle">Ứng dụng học từ vựng tiếng Nhật</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn btn-primary btn-large btn-full">
            {isRegisterMode ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <p className="login-toggle">
          {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          <button
            type="button"
            className="btn-link"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
          >
            {isRegisterMode ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </p>

      </div>

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="success-icon"><Check size={32} /></div>
            <h3 className="modal-title">Đăng ký thành công!</h3>
            <p className="modal-message">Tài khoản của bạn đã được tạo. Hãy đăng nhập để bắt đầu.</p>
            <button className="btn btn-primary btn-full" onClick={handleGoToLogin}>
              Đăng nhập ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
