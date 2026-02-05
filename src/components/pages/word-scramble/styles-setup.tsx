import React from 'react';

export const SetupStyles: React.FC = () => (
  <style>{`
    /* ============ SETUP SCREEN ============ */
    .ws-setup {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .ws-setup-card {
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      overflow: hidden;
    }

    .ws-setup-header {
      padding: 2rem 2rem 1.5rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      text-align: center;
    }

    .ws-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .ws-logo-icon {
      font-size: 2.5rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .ws-logo h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: white;
      margin: 0;
    }

    .ws-subtitle {
      color: rgba(255,255,255,0.9);
      margin: 0.5rem 0 0;
      font-size: 0.95rem;
    }

    .ws-setup-body {
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .ws-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ws-section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #374151;
    }

    .ws-section-header h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }

    .ws-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: #10b981;
      color: white;
      border-radius: 999px;
      font-weight: 600;
    }

    .ws-time-display {
      font-size: 0.9rem;
      font-weight: 700;
      color: #10b981;
    }

    /* Level chips */
    .ws-levels {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .ws-level-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      border: 2px solid var(--level-border);
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .ws-level-chip:hover:not(:disabled) {
      background: var(--level-bg);
    }

    .ws-level-chip.selected {
      background: var(--level-bg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .ws-level-chip:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .ws-level-chip .level-tag {
      font-weight: 700;
      color: var(--level-text);
    }

    .ws-level-chip .level-count {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .ws-level-chip .check-icon {
      color: var(--level-text);
    }

    /* Time options */
    .ws-time-options {
      display: flex;
      gap: 0.5rem;
    }

    .ws-time-btn {
      flex: 1;
      padding: 0.6rem;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 10px;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ws-time-btn:hover {
      border-color: #10b981;
      color: #10b981;
    }

    .ws-time-btn.active {
      background: #10b981;
      border-color: #10b981;
      color: white;
    }

    /* Question count */
    .ws-question-options {
      display: flex;
      gap: 0.5rem;
    }

    .ws-count-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 0.5rem;
      border: 2px solid #e5e7eb;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ws-count-btn:hover {
      border-color: #10b981;
    }

    .ws-count-btn.active {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-color: transparent;
    }

    .ws-count-btn .count-num {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .ws-count-btn .count-label {
      font-size: 0.7rem;
      color: #6b7280;
    }

    .ws-count-btn.active .count-num,
    .ws-count-btn.active .count-label {
      color: white;
    }

    /* Info box */
    .ws-info-box {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 12px;
    }

    .ws-info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .ws-info-item svg {
      color: #10b981;
    }

    /* Setup footer */
    .ws-setup-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
    }
  `}</style>
);
