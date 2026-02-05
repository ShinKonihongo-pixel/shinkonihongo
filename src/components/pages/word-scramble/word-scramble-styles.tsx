import React from 'react';

export const WordScrambleStyles: React.FC = () => (
  <style>{`
    .ws-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      font-family: system-ui, -apple-system, sans-serif;
    }

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

    /* ============ BUTTONS ============ */
    .ws-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1.25rem;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ws-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .ws-btn-primary {
      flex: 1;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(16,185,129,0.4);
    }

    .ws-btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16,185,129,0.5);
    }

    .ws-btn-secondary {
      flex: 1;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(59,130,246,0.4);
    }

    .ws-btn-secondary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59,130,246,0.5);
    }

    .ws-btn-ghost {
      background: transparent;
      color: #6b7280;
      border: 2px solid #e5e7eb;
    }

    .ws-btn-ghost:hover {
      background: #f3f4f6;
    }

    .ws-btn-check {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-size: 1.1rem;
      box-shadow: 0 4px 14px rgba(16,185,129,0.4);
    }

    .ws-btn-next {
      padding: 0.85rem 1.5rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    /* ============ GAME LAYOUT ============ */
    .ws-game-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 1rem;
      min-height: 100vh;
      padding: 1rem;
    }

    @media (max-width: 1024px) {
      .ws-game-layout {
        grid-template-columns: 1fr;
      }
      .ws-left-panel {
        display: none;
      }
    }

    /* Left Panel - Hints & Leaderboard */
    .ws-left-panel {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .ws-hints-card, .ws-leaderboard-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 1.25rem;
      color: white;
    }

    .ws-hints-header, .ws-leaderboard-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .ws-hints-header h3, .ws-leaderboard-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .ws-hints-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ws-hint-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.85rem;
      background: rgba(0,0,0,0.2);
      border-radius: 10px;
      transition: all 0.3s;
    }

    .ws-hint-item.revealed {
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.3);
    }

    .ws-hint-item.locked {
      opacity: 0.6;
    }

    .hint-number {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .hint-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .hint-label {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hint-value {
      font-weight: 600;
      font-size: 1rem;
    }

    .hint-locked {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
    }

    .ws-streak {
      margin-top: 1rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 10px;
      text-align: center;
      font-weight: 700;
    }

    /* Leaderboard */
    .ws-leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .ws-player-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      transition: all 0.2s;
    }

    .ws-player-row.current-user {
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.3);
    }

    .ws-player-row.top-3 {
      background: rgba(251,191,36,0.1);
    }

    .player-rank {
      width: 32px;
      text-align: center;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .player-avatar {
      font-size: 1.5rem;
    }

    .player-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .player-name {
      font-weight: 600;
      font-size: 1rem;
    }

    .player-correct {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.6);
    }

    .player-score {
      font-weight: 700;
      font-size: 1.1rem;
      color: #fbbf24;
    }

    .ws-your-rank {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.85rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 10px;
      font-weight: 600;
    }

    /* Center Panel */
    .ws-center-panel {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ws-game-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
    }

    .ws-progress-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .ws-q-num {
      color: white;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .ws-level-badge {
      padding: 0.3rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .ws-close-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border: none;
      border-radius: 10px;
      color: white;
      cursor: pointer;
    }

    .ws-close-btn:hover {
      background: rgba(239,68,68,0.3);
    }

    /* Timer */
    .ws-timer-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .ws-timer-bar {
      flex: 1;
      height: 10px;
      background: rgba(255,255,255,0.1);
      border-radius: 5px;
      overflow: hidden;
    }

    .ws-timer-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 1s linear, background 0.3s;
    }

    .ws-timer-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      font-size: 1.1rem;
      min-width: 60px;
    }

    /* Question Area */
    .ws-question-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }

    .ws-word-info {
      text-align: center;
    }

    .ws-word-count {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #f3f4f6;
      border-radius: 999px;
      font-weight: 600;
      color: #6b7280;
      font-size: 1rem;
    }

    /* Big scrambled letters - 3x bigger */
    .ws-letters-container-big {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding: 1rem 0;
    }

    .ws-letter-big {
      width: 72px;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #10b981;
      background: white;
      border-radius: 16px;
      font-size: 2.5rem;
      font-weight: 700;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .ws-letter-big:hover:not(:disabled):not(.selected) {
      background: #ecfdf5;
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(16,185,129,0.3);
    }

    .ws-letter-big.selected {
      opacity: 0.3;
      border-style: dashed;
      transform: scale(0.95);
    }

    .ws-letter-big:disabled {
      cursor: not-allowed;
    }

    /* Answer section */
    .ws-answer-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: auto;
    }

    /* Slots */
    .ws-slots-container {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      padding: 1rem 0;
    }

    .ws-slot {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      cursor: pointer;
      transition: all 0.2s;
      background: white;
    }

    .ws-slot.filled {
      border-style: solid;
      border-color: #10b981;
      background: #ecfdf5;
    }

    .ws-slot.auto-filled {
      border-color: #f59e0b;
      background: #fef3c7;
    }

    .ws-slot.correct {
      border-color: #10b981;
      background: #d1fae5;
    }

    .ws-slot.wrong {
      border-color: #ef4444;
      background: #fee2e2;
    }

    .ws-slot .slot-correct {
      color: #10b981;
    }

    /* Auto-fill section */
    .ws-autofill-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .ws-autofill-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ws-autofill-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(245,158,11,0.4);
    }

    .ws-autofill-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .autofill-count {
      opacity: 0.8;
      font-size: 0.85rem;
    }

    .ws-penalty-info {
      color: #ef4444;
      font-weight: 600;
      font-size: 0.9rem;
    }

    /* Result inline */
    .ws-result-inline {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .ws-feedback {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1.1rem;
    }

    .ws-feedback.correct {
      background: #d1fae5;
      color: #059669;
    }

    .ws-feedback.wrong {
      background: #fee2e2;
      color: #dc2626;
    }

    /* Game footer */
    .ws-game-footer {
      display: flex;
      justify-content: center;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
    }

    .ws-score-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #fbbf24;
    }

    .ws-score-display .score-value {
      font-size: 2rem;
      font-weight: 800;
    }

    .ws-score-display .score-label {
      font-size: 1rem;
      opacity: 0.8;
    }

    /* ============ RESULT SCREEN ============ */
    .ws-result-screen {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .ws-result-card {
      width: 100%;
      max-width: 520px;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }

    .ws-result-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .ws-result-trophy {
      font-size: 4rem;
      margin-bottom: 0.5rem;
    }

    .ws-result-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1f2937;
      margin: 0;
    }

    .ws-rank-text {
      font-size: 1.1rem;
      color: #10b981;
      font-weight: 600;
      margin: 0.5rem 0 0;
    }

    .ws-result-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .ws-stat-card {
      padding: 1rem 0.5rem;
      background: #f3f4f6;
      border-radius: 12px;
      text-align: center;
    }

    .ws-stat-card.primary {
      grid-column: span 3;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .ws-stat-card.primary .stat-label {
      color: rgba(255,255,255,0.8);
    }

    .stat-icon {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1f2937;
    }

    .ws-stat-card.primary .stat-value {
      color: white;
      font-size: 2rem;
    }

    .stat-label {
      font-size: 0.7rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Final leaderboard */
    .ws-final-leaderboard {
      margin-bottom: 1.5rem;
    }

    .ws-final-leaderboard h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      color: #374151;
      margin: 0 0 0.75rem;
    }

    .ws-final-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ws-final-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 1rem;
      background: #f3f4f6;
      border-radius: 10px;
    }

    .ws-final-row.you {
      background: #ecfdf5;
      border: 2px solid #10b981;
    }

    .final-rank {
      width: 32px;
      font-weight: 700;
    }

    .final-avatar {
      font-size: 1.25rem;
    }

    .final-name {
      flex: 1;
      font-weight: 600;
    }

    .final-score {
      font-weight: 700;
      color: #10b981;
    }

    .ws-result-actions {
      display: flex;
      gap: 1rem;
    }

    .ws-result-actions .ws-btn {
      flex: 1;
    }

    /* ============ RESPONSIVE ============ */
    @media (max-width: 640px) {
      .ws-setup-card {
        border-radius: 16px;
      }

      .ws-setup-header {
        padding: 1.5rem;
      }

      .ws-setup-body {
        padding: 1rem 1.5rem;
      }

      .ws-setup-footer {
        flex-direction: column;
      }

      .ws-setup-footer .ws-btn {
        flex: none;
        width: 100%;
      }

      .ws-letter-big {
        width: 56px;
        height: 56px;
        font-size: 1.75rem;
      }

      .ws-slot {
        width: 44px;
        height: 44px;
        font-size: 1.25rem;
      }

      .ws-result-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .ws-stat-card.primary {
        grid-column: span 2;
      }
    }
  `}</style>
);
