import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Sentry } from '../../lib/sentry';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to Sentry if configured
    try {
      Sentry?.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    } catch { /* Sentry not initialized */ }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          gap: '1rem',
          minHeight: '200px',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Đã xảy ra lỗi</h2>
          <p style={{ margin: 0, color: '#666', textAlign: 'center' }}>
            {this.state.error?.message || 'Có lỗi không mong muốn. Vui lòng thử lại.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
