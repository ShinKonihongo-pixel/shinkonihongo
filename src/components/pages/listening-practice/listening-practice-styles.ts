// Styles for Listening Practice components
export const listeningPracticeStyles = `
  .listening-practice-page {
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .listening-level-select-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .listening-level-select-wrapper .jlpt-level-selector {
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
  }

  .level-select-custom-audio {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
  }

  .level-select-custom-audio .btn-glass {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .level-select-custom-audio .btn-glass:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
    color: white;
    transform: translateY(-2px);
  }

  .lesson-list-mode {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .lesson-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    flex-shrink: 0;
  }

  .lesson-list-header::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--header-gradient);
    box-shadow: 0 0 20px var(--header-glow);
  }

  .lesson-list-header .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .lesson-list-header .level-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    padding: 0 0.75rem;
    background: var(--header-gradient);
    border-radius: 12px;
    font-weight: 900;
    font-size: 1rem;
    color: white;
    box-shadow: 0 4px 15px -3px var(--header-glow);
  }

  .lesson-list-header .header-info h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
  }

  .lesson-list-header .header-info p {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .lessons-premium-grid {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1.25rem;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
    align-content: start;
  }

  .lessons-premium-grid::-webkit-scrollbar { width: 6px; }
  .lessons-premium-grid::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
  .lessons-premium-grid::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }

  .lesson-premium-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
    animation: lessonAppear 0.3s ease-out var(--card-delay) both;
    overflow: hidden;
  }

  .lesson-premium-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  @keyframes lessonAppear {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .lesson-premium-card:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: 0 8px 25px -10px var(--glow);
  }

  .lesson-premium-card:hover:not(:disabled)::before { opacity: 1; }
  .lesson-premium-card:disabled { opacity: 0.35; cursor: not-allowed; }
  .lesson-premium-card.complete { border-color: rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.05); }

  .lesson-premium-card .card-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 0.75rem;
    position: relative;
  }

  .lesson-premium-card .lesson-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .lesson-premium-card .complete-badge {
    position: absolute;
    top: -4px;
    right: calc(50% - 32px);
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
  }

  .lesson-premium-card .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .lesson-premium-card .lesson-name { font-weight: 700; color: white; font-size: 0.9rem; }
  .lesson-premium-card .lesson-count { font-size: 0.7rem; color: rgba(255, 255, 255, 0.5); }

  .lesson-premium-card .card-footer {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .lesson-premium-card .progress-bar-mini {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .lesson-premium-card .progress-fill-mini {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), #22c55e);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .lesson-premium-card .progress-label { font-size: 0.65rem; color: rgba(255, 255, 255, 0.4); }

  .vocabulary-mode, .custom-audio-mode {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .vocabulary-mode .vocab-header,
  .vocabulary-mode .filter-buttons,
  .vocabulary-mode .vocab-stats,
  .vocabulary-mode .playback-controls,
  .vocabulary-mode .inline-settings { flex-shrink: 0; }

  .vocabulary-mode .current-word-display {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }

  .vocabulary-mode .word-card { max-height: 100%; overflow-y: auto; }

  .vocab-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .page-title, .lesson-title {
    flex: 1;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
  }

  .desktop-level { display: flex; }
  .mobile-lesson-info { display: none; }

  .mobile-lesson-info {
    align-items: center;
    gap: 0.5rem;
    color: white;
    font-size: 0.95rem;
    font-weight: 500;
    flex: 1;
    min-width: 0;
  }

  .mobile-lesson-info svg { flex-shrink: 0; color: rgba(255, 255, 255, 0.7); }
  .mobile-lesson-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .btn-back {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .btn-back:hover { background: rgba(255, 255, 255, 0.1); color: white; }

  .current-level {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    color: white;
    font-size: 1rem;
  }

  .current-level.audio-mode { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }

  .filter-buttons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .filter-btn {
    flex: 0 0 auto;
    min-width: 5.5rem;
    padding: 0.6rem 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    background: transparent !important;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;
    text-align: center;
    white-space: nowrap;
  }

  .filter-btn:hover { border-color: rgba(255, 255, 255, 0.35) !important; color: rgba(255, 255, 255, 0.8); }

  .filter-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%) !important;
    border-color: transparent !important;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  }

  .vocab-stats {
    text-align: center;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 1.5rem;
  }

  .current-word-display { text-align: center; margin-bottom: 2rem; }

  .word-counter {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 1rem;
  }

  .word-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 2.5rem 2rem;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.4s ease;
  }

  .word-card:hover { box-shadow: 0 0 40px var(--level-glow); }

  .vocabulary-text { font-size: 2.5rem; font-weight: bold; color: white; }
  .kanji-text { font-size: 1.5rem; color: rgba(255, 255, 255, 0.6); }
  .meaning-text { font-size: 1.25rem; color: rgba(255, 255, 255, 0.9); margin-top: 0.5rem; }
  .sino-text { font-size: 1rem; color: rgba(255, 255, 255, 0.5); }
  .lesson-info { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.5rem; }

  .memorization-toggle {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .mem-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .mem-btn.learned {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: rgba(34, 197, 94, 0.7);
  }

  .mem-btn.learned.active {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
  }

  .mem-btn.not-learned {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.6);
  }

  .mem-btn.not-learned.active {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #f87171;
  }

  .mem-btn:hover { transform: scale(1.02); }

  .playback-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .control-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);
  }

  .control-btn:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .control-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
  }

  .control-btn.play-btn {
    width: 68px;
    height: 68px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
  }

  .control-btn.play-btn:hover:not(:disabled) { transform: scale(1.05); }
  .control-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .inline-settings-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .settings-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    align-self: center;
  }

  .settings-toggle-btn:hover { background: rgba(255, 255, 255, 0.08); color: white; }

  .inline-settings {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.875rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .settings-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

  .settings-row.numeric-settings { gap: 1rem; }
  .settings-row.checkbox-settings { gap: 1.5rem; padding-top: 0.25rem; border-top: 1px solid rgba(255, 255, 255, 0.06); }

  .setting-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 10px;
  }

  .setting-group label { min-width: 55px; font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    user-select: none;
  }

  .checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #8b5cf6; cursor: pointer; }

  .setting-control {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
  }

  .setting-control button {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    cursor: pointer;
    color: white;
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .setting-control button:hover { background: rgba(139, 92, 246, 0.3); border-color: rgba(139, 92, 246, 0.5); }
  .setting-control button:active { transform: scale(0.95); }
  .setting-control span { min-width: 50px; text-align: center; font-size: 0.85rem; font-weight: 600; color: #c4b5fd; }

  .upload-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .upload-btn { display: flex; align-items: center; gap: 0.5rem; }
  .file-name { color: rgba(255, 255, 255, 0.6); font-size: 0.875rem; }

  .audio-progress {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .progress-slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    cursor: pointer;
    accent-color: #8b5cf6;
  }

  .time { font-size: 0.875rem; color: rgba(255, 255, 255, 0.5); min-width: 45px; }

  .ab-markers {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #c4b5fd;
  }

  .ab-controls {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .speed-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
  }

  .speed-section label { color: rgba(255, 255, 255, 0.7); }
  .speed-buttons { display: flex; gap: 0.5rem; }

  .speed-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s;
  }

  .speed-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state svg { margin-bottom: 1rem; opacity: 0.5; }
  .empty-state .hint { font-size: 0.875rem; margin-top: 0.5rem; }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
  }

  .btn-glass {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-glass:hover { background: rgba(255, 255, 255, 0.12); }
  .btn-glass:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-primary {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    color: white;
  }

  .btn-primary:hover {
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .lessons-premium-grid {
      grid-template-columns: repeat(3, 1fr);
      padding: 0.75rem;
      gap: 0.5rem;
    }
    .lesson-premium-card { padding: 0.75rem; }
    .lesson-premium-card .lesson-icon-wrapper { width: 32px; height: 32px; }
    .lesson-premium-card .lesson-name { font-size: 0.8rem; }
    .lesson-list-header .header-info { display: none; }
  }

  @media (max-width: 640px) {
    .vocabulary-mode, .custom-audio-mode { padding: 0.5rem; }
    .vocab-header { gap: 0.5rem; margin-bottom: 1rem; }
    .desktop-level { display: none; }
    .lesson-title { display: none; }
    .mobile-lesson-info { display: flex; }
    .filter-buttons { max-width: 100%; }
    .filter-btn { padding: 0.45rem 0.4rem; font-size: 0.7rem; }
    .memorization-toggle { gap: 0.5rem; }
    .mem-btn { padding: 0.5rem 0.75rem; font-size: 0.8rem; flex: 1; justify-content: center; }
    .mem-btn svg { width: 16px; height: 16px; }
    .inline-settings { padding: 0.75rem; gap: 0.5rem; }
    .settings-row.numeric-settings { flex-direction: column; gap: 0.5rem; }
    .setting-group { width: 100%; justify-content: space-between; }
    .settings-row.checkbox-settings { justify-content: space-around; gap: 1rem; }
    .settings-toggle-btn { padding: 0.4rem 0.75rem; font-size: 0.75rem; }
    .lessons-premium-grid { grid-template-columns: repeat(3, 1fr); gap: 0.35rem; }
    .lesson-premium-card .lesson-name { font-size: 0.7rem; }
    .lesson-premium-card .lesson-count { font-size: 0.6rem; }
    .lesson-list-header { padding: 0.5rem 0.75rem; }
    .lesson-list-header .level-badge { min-width: 36px; height: 36px; font-size: 0.85rem; }
    .lesson-list-header .level-badge.desktop-level { display: none; }
    .lesson-list-header .mobile-lesson-info { display: flex; }
    .lesson-list-header .header-info { display: none; }
    .vocabulary-text { font-size: 2rem; }
    .playback-controls { flex-wrap: wrap; gap: 0.5rem; }
  }

  @media (max-width: 480px) {
    .lessons-premium-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;
