// Analysis modal for Kaiwa - shows translation and grammar breakdown

import { BookOpen, X } from 'lucide-react';

interface KaiwaAnalysisModalProps {
  text: string;
  result: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export function KaiwaAnalysisModal({
  text,
  result,
  isLoading,
  onClose,
}: KaiwaAnalysisModalProps) {
  return (
    <div className="kaiwa-analysis-overlay">
      <div className="kaiwa-analysis-modal">
        <h3><BookOpen size={18} /> Dịch & Phân tích</h3>
        <p className="kaiwa-analysis-original">{text}</p>

        {isLoading ? (
          <div className="kaiwa-analysis-loading">
            <div className="kaiwa-typing">
              <span></span><span></span><span></span>
            </div>
            <p>Đang phân tích...</p>
          </div>
        ) : result ? (
          <div className="kaiwa-analysis-result">
            <pre>{result}</pre>
          </div>
        ) : null}

        <button className="kaiwa-analysis-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
