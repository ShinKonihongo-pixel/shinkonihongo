// Pricing page — Freemium comparison (Free vs VIP)

import { useNavigate } from 'react-router-dom';
import { Check, X, Crown, Sparkles } from 'lucide-react';
import { useUserData } from '../../contexts/user-data-context';
import './pricing-page.css';

interface Feature {
  label: string;
  free: boolean;
  vip: boolean;
}

const FEATURES: Feature[] = [
  { label: 'Học từ vựng N5', free: true, vip: true },
  { label: 'Học ngữ pháp N5', free: true, vip: true },
  { label: 'Hán tự cơ bản', free: true, vip: true },
  { label: 'Bài tập & luyện đề', free: true, vip: true },
  { label: '3 trò chơi cơ bản', free: true, vip: true },
  { label: 'Streak & XP tracking', free: true, vip: true },
  { label: 'Tất cả cấp độ (N5-N1)', free: false, vip: true },
  { label: 'Tất cả 11 trò chơi', free: false, vip: true },
  { label: 'Hội thoại (会話)', free: false, vip: true },
  { label: 'Đọc hiểu nâng cao', free: false, vip: true },
  { label: 'Nghe hiểu nâng cao', free: false, vip: true },
  { label: 'Luyện thi JLPT đầy đủ', free: false, vip: true },
  { label: 'Bài học bị khóa', free: false, vip: true },
  { label: 'AI Tutor Chat', free: false, vip: true },
  { label: 'Thành tựu đặc biệt', free: false, vip: true },
];

const FAQ = [
  {
    q: 'VIP kéo dài bao lâu?',
    a: 'Gói VIP được kích hoạt theo thời hạn do quản trị viên cấp. Liên hệ giáo viên hoặc admin để được nâng cấp.',
  },
  {
    q: 'Tôi có mất dữ liệu khi hết VIP không?',
    a: 'Không. Tất cả dữ liệu học tập, streak, XP đều được giữ nguyên. Bạn chỉ bị giới hạn truy cập nội dung nâng cao.',
  },
  {
    q: 'Học sinh trong lớp học có cần VIP không?',
    a: 'Học sinh được giáo viên thêm vào lớp sẽ tự động được mở khóa nội dung theo chương trình lớp.',
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const { canAccessLocked: isVip } = useUserData();
  const onUpgrade = () => navigate('/settings');
  return (
    <div className="pricing">
      <div className="pricing-header">
        <h1 className="pricing-title">Chọn gói phù hợp</h1>
        <p className="pricing-subtitle">Nâng cấp để mở khóa toàn bộ nội dung học tập</p>
      </div>

      <div className="pricing-plans">
        {/* Free Plan */}
        <div className="pricing-plan">
          <div className="pricing-plan-name">Miễn phí</div>
          <div className="pricing-plan-price free">0đ</div>
          <div className="pricing-plan-period">Mãi mãi</div>
          <div className="pricing-divider" />
          <ul className="pricing-features">
            {FEATURES.map((f, i) => (
              <li key={i} className={`pricing-feature ${!f.free ? 'excluded' : ''}`}>
                <span className={`pricing-feature-icon ${f.free ? 'included' : 'excluded'}`}>
                  {f.free ? <Check size={14} /> : <X size={14} />}
                </span>
                {f.label}
              </li>
            ))}
          </ul>
          <button className="pricing-cta current" disabled>
            {!isVip ? 'Gói hiện tại' : 'Gói cơ bản'}
          </button>
        </div>

        {/* VIP Plan */}
        <div className="pricing-plan recommended">
          <span className="pricing-plan-badge">
            <Crown size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
            Phổ biến nhất
          </span>
          <div className="pricing-plan-name">VIP</div>
          <div className="pricing-plan-price vip">Premium</div>
          <div className="pricing-plan-period">Liên hệ admin để nâng cấp</div>
          <div className="pricing-divider" />
          <ul className="pricing-features">
            {FEATURES.map((f, i) => (
              <li key={i} className="pricing-feature">
                <span className="pricing-feature-icon included">
                  <Check size={14} />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
          {isVip ? (
            <button className="pricing-cta current" disabled>
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Đang sử dụng
            </button>
          ) : (
            <button className="pricing-cta upgrade" onClick={onUpgrade}>
              Nâng cấp VIP
            </button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="pricing-faq">
        <h3 className="pricing-faq-title">Câu hỏi thường gặp</h3>
        {FAQ.map((item, i) => (
          <div key={i} className="pricing-faq-item">
            <div className="pricing-faq-q">{item.q}</div>
            <div className="pricing-faq-a">{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
