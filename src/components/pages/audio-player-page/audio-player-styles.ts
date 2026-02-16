// Audio Player Page Styles

export const practiceStyles = `
  .listening-practice-page {
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .listening-practice-page .jlpt-level-selector {
    min-height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
  }

  .practice-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 1rem;
  }

  .practice-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-shrink: 0;
  }

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
    flex-shrink: 0;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .page-title {
    flex: 1;
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
  }

  .current-level, .current-type {
    display: flex;
    align-items: center;
    padding: 0.4rem 0.85rem;
    border-radius: 10px;
    font-weight: 600;
    color: white;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  /* Lesson grid */
  .lesson-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 0.65rem;
  }

  @keyframes cardAppear {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lesson-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.85rem 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: cardAppear 0.4s ease backwards;
    animation-delay: var(--card-delay);
  }

  .lesson-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px var(--level-glow, rgba(139, 92, 246, 0.2));
  }

  .lesson-number {
    font-size: 1.15rem;
    font-weight: 700;
    background: var(--level-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .lesson-label {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }

  .lesson-count {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Type grid */
  .type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
  }

  .type-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: cardAppear 0.4s ease backwards;
    animation-delay: var(--card-delay);
    overflow: hidden;
  }

  .type-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.3), 0 0 30px var(--type-glow);
  }

  .type-card:hover .type-arrow {
    color: white;
    transform: translateY(-50%) translateX(3px);
  }

  .type-icon-box {
    width: 52px;
    height: 52px;
    background: var(--type-gradient);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 6px 20px var(--type-glow);
  }

  .type-name {
    font-size: 1.05rem;
    font-weight: 600;
    color: white;
  }

  .type-count {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .type-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }

  /* Audio player */
  .audio-player-mode {
    gap: 0;
  }

  .now-playing {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    margin-bottom: 1rem;
  }

  .now-playing-info {
    text-align: center;
  }

  .now-playing-info h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .now-playing-info p {
    margin: 0.35rem 0 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .track-counter {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 0.25rem;
    display: inline-block;
  }

  .audio-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .progress-slider {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    cursor: pointer;
    accent-color: #8b5cf6;
  }

  .time {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    min-width: 40px;
    text-align: center;
  }

  .playback-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

  .control-btn {
    width: 48px;
    height: 48px;
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

  .control-btn:hover {
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
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.4);
  }

  .control-btn.play-btn:hover { transform: scale(1.05); }

  .speed-indicator {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #c4b5fd;
    cursor: pointer;
    transition: all 0.2s;
  }

  .speed-indicator:hover {
    border-color: rgba(139, 92, 246, 0.5);
    background: rgba(139, 92, 246, 0.15);
  }

  .speed-buttons {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
  }

  .speed-btn {
    padding: 0.4rem 0.65rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    transition: all 0.2s;
  }

  .speed-btn.active {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    border-color: transparent;
    color: white;
  }

  .speed-btn:hover:not(.active) {
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  /* Audio track list */
  .audio-track-list {
    flex: 1;
    min-height: 0;
  }

  .audio-track-list h4 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
  }

  .track-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.35rem;
    text-align: left;
    color: rgba(255, 255, 255, 0.7);
  }

  .track-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    color: white;
  }

  .track-item.active {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
    color: white;
  }

  .track-number {
    width: 24px;
    text-align: center;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }

  .track-item.active .track-number {
    color: #c4b5fd;
  }

  .track-play-icon {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.4);
  }

  .track-item.active .track-play-icon {
    color: #c4b5fd;
  }

  .track-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .track-title {
    font-size: 0.85rem;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-desc {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-duration {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .empty-state svg { margin-bottom: 1rem; opacity: 0.5; }
  .empty-state .hint { font-size: 0.875rem; margin-top: 0.5rem; }

  /* TTS text content display */
  .tts-text-content {
    padding: 1rem 1.25rem;
    background: rgba(6, 182, 212, 0.08);
    border: 1px solid rgba(6, 182, 212, 0.2);
    border-radius: 12px;
    font-size: 1.15rem;
    line-height: 2;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    font-family: 'Noto Sans JP', sans-serif;
  }

  .tts-text-content ruby {
    ruby-position: over;
  }

  .tts-text-content rt {
    font-size: 0.55em;
    color: rgba(6, 182, 212, 0.8);
  }

  .kaiwa-display {
    text-align: left;
  }

  .kaiwa-display-line {
    display: flex;
    gap: 0.75rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .kaiwa-display-line:last-child { border-bottom: none; }

  .kaiwa-speaker {
    color: #f472b6;
    font-weight: 600;
    min-width: 50px;
    flex-shrink: 0;
  }

  .tts-badge {
    background: rgba(6, 182, 212, 0.15);
    color: #06b6d4 !important;
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    font-size: 0.65rem !important;
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .practice-content { padding: 0.65rem; }
    .practice-header { gap: 0.5rem; margin-bottom: 1rem; }
    .lesson-grid { grid-template-columns: repeat(auto-fill, minmax(75px, 1fr)); gap: 0.5rem; }
    .lesson-card { padding: 0.65rem 0.35rem; }
    .type-grid { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; }
    .type-card { padding: 1rem; }
    .now-playing { padding: 1rem; }
    .now-playing-info h3 { font-size: 1.05rem; }
    .playback-controls { gap: 0.5rem; }
    .control-btn { width: 42px; height: 42px; }
    .control-btn.play-btn { width: 56px; height: 56px; }
    .speed-indicator { width: 42px; height: 42px; font-size: 0.7rem; }
  }
`;
