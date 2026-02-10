// Public landing page for a center

import { MapPin, Phone, Users, BookOpen, ArrowRight, LogIn } from 'lucide-react';
import type { Branch } from '../../types/branch';
import { DEFAULT_CENTER_BRANDING } from '../../types/branch';

interface CenterLandingPageProps {
  center: Branch;
  navigate: (path: string) => void;
  isLoggedIn: boolean;
  isMember: boolean;
}

export function CenterLandingPage({ center, navigate, isLoggedIn, isMember }: CenterLandingPageProps) {
  const branding = center.branding || DEFAULT_CENTER_BRANDING;

  const heroStyle: React.CSSProperties = branding.coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, ${branding.primaryColor}cc, ${branding.secondaryColor}cc), url(${branding.coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
      };

  return (
    <div className="center-landing">
      {/* Hero section */}
      <div className="center-landing-hero" style={heroStyle}>
        <div className="center-landing-hero-content">
          {branding.logo && (
            <img src={branding.logo} alt={center.name} className="center-landing-logo" />
          )}
          <h1 className="center-landing-name">{center.name}</h1>
          {center.description && (
            <p className="center-landing-desc">{center.description}</p>
          )}
          <div className="center-landing-actions">
            {isMember ? (
              <button
                className="btn center-landing-btn center-landing-btn-primary"
                onClick={() => navigate(`/center/${center.slug}/app`)}
              >
                Vào trung tâm <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className="btn center-landing-btn center-landing-btn-primary"
                onClick={() => navigate(`/center/${center.slug}/join`)}
              >
                Tham gia ngay <ArrowRight size={18} />
              </button>
            )}
            {!isLoggedIn && (
              <button
                className="btn center-landing-btn center-landing-btn-secondary"
                onClick={() => navigate('/')}
              >
                <LogIn size={18} /> Đăng nhập
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="center-landing-info">
        {center.address && (
          <div className="center-landing-card">
            <MapPin size={24} className="center-landing-card-icon" />
            <div>
              <h3>Địa chỉ</h3>
              <p>{center.address}</p>
            </div>
          </div>
        )}
        {center.phone && (
          <div className="center-landing-card">
            <Phone size={24} className="center-landing-card-icon" />
            <div>
              <h3>Liên hệ</h3>
              <p>{center.phone}</p>
            </div>
          </div>
        )}
        <div className="center-landing-card">
          <Users size={24} className="center-landing-card-icon" />
          <div>
            <h3>Cộng đồng</h3>
            <p>Học viên & giáo viên</p>
          </div>
        </div>
        <div className="center-landing-card">
          <BookOpen size={24} className="center-landing-card-icon" />
          <div>
            <h3>Học liệu</h3>
            <p>Từ vựng, ngữ pháp, Kanji</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="center-landing-footer">
        <p>Powered by <strong>Shinko 日本語</strong></p>
      </div>
    </div>
  );
}
