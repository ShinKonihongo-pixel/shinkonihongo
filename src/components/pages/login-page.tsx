// Login page component

import { useState } from 'react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      // Auto login after register
      onLogin(username, password);
    } else {
      const result = onLogin(username, password);
      if (!result.success) {
        setError(result.error || 'Đăng nhập thất bại');
      }
    }
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
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
          >
            {isRegisterMode ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </p>

        {!isRegisterMode && (
          <p className="login-hint">
            Tài khoản demo: admin / admin
          </p>
        )}
      </div>
    </div>
  );
}
