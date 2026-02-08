// CSS styles for grammar study page
export const styles = `
  .grammar-study-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 0.35rem;
    overflow: hidden;
  }

  .study-header-compact {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.25rem;
    flex-shrink: 0;
  }

  .btn-back {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-back:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .level-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    color: white;
    flex-shrink: 0;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .header-left-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex: 1;
    min-width: 0;
  }

  .filter-chips {
    display: flex;
    gap: 0.2rem;
  }

  .filter-chip {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.65rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    min-width: 4.5rem;
    text-align: center;
    box-sizing: border-box;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .filter-chip:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }

  .filter-chip.active {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.4);
    color: #c4b5fd;
    font-weight: 600;
  }

  .filter-chip.learned.active {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.4);
    color: #86efac;
  }

  .filter-chip.learning.active {
    background: rgba(251, 191, 36, 0.2);
    border-color: rgba(251, 191, 36, 0.4);
    color: #fde047;
  }

  .header-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.7rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .action-btn.shuffle-btn.active {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3));
    border-color: rgba(139, 92, 246, 0.5);
    color: #e9d5ff;
  }

  .action-btn .btn-text {
    display: none;
  }

  @media (min-width: 500px) {
    .action-btn .btn-text {
      display: inline;
    }
  }

  .header-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .header-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .study-content {
    flex: 1;
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    min-height: 0;
    overflow: hidden;
    padding: 0.25rem 0;
  }

  .side-nav-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
    align-self: center;
  }

  .side-nav-btn:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: scale(1.05);
  }

  .side-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .grammar-card-container {
    flex: 1;
    perspective: 1000px;
    cursor: pointer;
    touch-action: pan-y;
    min-height: 0;
  }

  .grammar-card {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    transform-style: preserve-3d;
    transition: transform 0.5s ease;
  }

  .grammar-card-container.flipped .grammar-card {
    transform: rotateY(180deg);
  }

  .grammar-card-front,
  .grammar-card-back {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    overflow: auto;
    transition: box-shadow 0.4s ease;
  }

  .grammar-card:hover .grammar-card-front,
  .grammar-card:hover .grammar-card-back {
    box-shadow: 0 0 40px var(--level-glow);
  }

  .grammar-card-back {
    transform: rotateY(180deg);
  }

  .card-level-badge {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
  }

  .card-lesson-badge {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-size: 0.65rem;
    max-width: 50%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 1rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
  }

  .card-main-content::-webkit-scrollbar {
    width: 4px;
  }

  .card-main-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
  }

  .grammar-card-front .grammar-title {
    font-size: var(--front-font-size, 16px);
  }

  .grammar-card-front .grammar-formula,
  .grammar-card-front .grammar-meaning,
  .grammar-card-front .grammar-explanation,
  .grammar-card-front .example-japanese {
    font-size: var(--front-font-size, 16px);
  }

  .grammar-card-back .grammar-title {
    font-size: var(--back-font-size, 22px);
  }

  .grammar-card-back .grammar-formula,
  .grammar-card-back .grammar-meaning,
  .grammar-card-back .grammar-explanation,
  .grammar-card-back .example-japanese,
  .grammar-card-back .example-vietnamese {
    font-size: var(--back-font-size, 22px);
  }

  ruby {
    ruby-position: over;
    ruby-align: center;
  }

  ruby rt {
    font-size: 0.55em;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 400;
  }

  .example-text {
    flex: 1;
    line-height: 2;
  }

  .grammar-title {
    text-align: center;
    margin: 0 0 0.5rem;
    color: white;
    font-weight: 700;
  }

  .grammar-formula {
    text-align: center;
    color: #c4b5fd;
    font-family: 'SF Mono', 'Consolas', monospace;
    background: rgba(139, 92, 246, 0.15);
    padding: 0.5rem 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    border: 1px solid rgba(139, 92, 246, 0.3);
  }

  .grammar-meaning {
    color: rgba(255, 255, 255, 0.9);
    margin: 0.75rem 0;
    text-align: center;
    line-height: 1.5;
  }

  .grammar-meaning strong {
    color: #c4b5fd;
  }

  .grammar-explanation {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.75rem 1rem;
    border-radius: 10px;
    margin: 0.5rem 0;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    width: 100%;
    text-align: left;
  }

  .grammar-explanation strong {
    color: #c4b5fd;
  }

  .grammar-examples {
    width: 100%;
    margin-top: 0.75rem;
  }

  .grammar-examples > strong {
    font-size: 0.9rem;
    color: #c4b5fd;
  }

  .grammar-example {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.6rem 0.85rem;
    border-radius: 10px;
    margin-top: 0.5rem;
    border-left: 3px solid #8b5cf6;
  }

  .example-japanese {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
  }

  .btn-speak-small {
    background: rgba(139, 92, 246, 0.2);
    border: none;
    color: #c4b5fd;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-speak-small:hover {
    background: rgba(139, 92, 246, 0.4);
  }

  .example-vietnamese {
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.25rem;
  }

  .flip-hint {
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0;
    padding-top: 0.5rem;
    flex-shrink: 0;
  }

  .back-content-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.2) transparent;
  }

  .back-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .study-controls {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-top: 0.5rem;
    position: relative;
  }

  .memorization-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }

  .mem-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.25rem;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    flex: 1;
    max-width: 160px;
    justify-content: center;
  }

  .mem-btn.not-learned {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
  }

  .mem-btn.not-learned:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.25);
    color: white;
  }

  .mem-btn.not-learned.active {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }

  .mem-btn.learned {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
  }

  .mem-btn.learned:hover {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .mem-btn.learned.active {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
  }

  .card-counter-fixed {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    padding: 0.35rem 0.75rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  .swipe-hint {
    display: none;
    text-align: center;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    margin: 0;
  }

  .settings-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settings-modal {
    background: linear-gradient(145deg, #1e1e2f 0%, #151521 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
    animation: slideUp 0.3s ease;
    margin-top: 0;
    margin-bottom: 1rem;
    flex-shrink: 0;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .settings-modal-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;
  }

  .modal-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .settings-modal-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    flex: 1;
  }

  .btn-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: rotate(90deg);
  }

  .settings-modal-content {
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .settings-section {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 0.75rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .section-header svg {
    color: #8b5cf6;
  }

  .section-header h4 {
    margin: 0;
    color: white;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .setting-toggle {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .setting-toggle:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .setting-toggle.active {
    background: rgba(139, 92, 246, 0.1);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .setting-toggle input {
    display: none;
  }

  .toggle-switch {
    width: 36px;
    height: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    position: relative;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: all 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .setting-toggle.active .toggle-switch {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  }

  .setting-toggle.active .toggle-switch::after {
    transform: translateX(16px);
  }

  .toggle-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 500;
  }

  .setting-toggle.active .toggle-label {
    color: #c4b5fd;
  }

  .font-size-control {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
  }

  .font-size-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }

  .font-size-label svg {
    color: #8b5cf6;
  }

  .font-size-slider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .font-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .font-btn:hover {
    background: rgba(139, 92, 246, 0.3);
    border-color: rgba(139, 92, 246, 0.5);
    transform: scale(1.05);
  }

  .font-value {
    min-width: 50px;
    text-align: center;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    background: rgba(139, 92, 246, 0.15);
    padding: 0.35rem 0.5rem;
    border-radius: 6px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    gap: 1rem;
  }

  .empty-state svg {
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0;
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.9rem;
  }

  @media (min-width: 900px) {
    .back-content-wrapper {
      flex-direction: row;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .back-section-left {
      flex: 1;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
      padding-right: 1.5rem;
    }

    .back-section-right {
      flex: 1;
      padding-left: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .study-header-compact {
      padding: 0.35rem;
      gap: 0.35rem;
    }

    .header-left-group {
      gap: 0.3rem;
    }

    .filter-chips {
      gap: 0.15rem;
    }

    .filter-chip {
      font-size: 0.6rem;
      padding: 0.2rem 0.35rem;
      border-radius: 10px;
    }
  }

  @media (max-width: 640px) {
    .grammar-study-page {
      padding: 0.25rem;
    }

    .btn-back {
      width: 28px;
      height: 28px;
    }

    .header-btn {
      width: 28px;
      height: 28px;
    }

    .header-actions {
      gap: 0.2rem;
    }

    .level-badge {
      padding: 0.2rem 0.4rem;
      font-size: 0.65rem;
    }

    .filter-chip {
      font-size: 0.55rem;
      padding: 0.15rem 0.3rem;
    }

    .side-nav-btn {
      display: none;
    }

    .swipe-hint {
      display: block;
    }

    .grammar-card-front,
    .grammar-card-back {
      padding: 0.75rem;
      border-radius: 12px;
    }

    .memorization-buttons {
      gap: 0.35rem;
    }

    .mem-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      max-width: 140px;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }

    .settings-modal {
      max-height: 90vh;
      border-radius: 20px;
    }
  }

  @media (max-height: 700px) {
    .card-main-content,
    .back-content-wrapper {
      padding-top: 0.75rem;
    }

    .mem-btn {
      padding: 0.4rem 0.75rem;
    }

    .study-controls {
      gap: 0.25rem;
      padding-top: 0.35rem;
    }
  }
`;
