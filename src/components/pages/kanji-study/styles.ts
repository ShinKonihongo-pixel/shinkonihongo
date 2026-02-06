export const styles = `
  .kanji-study-page {
    display: flex; flex-direction: column; height: 100vh; height: 100dvh;
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
    padding: 0.35rem; overflow: hidden;
  }
  .study-header-compact {
    display: flex; align-items: center; gap: 0.5rem;
    background: rgba(255,255,255,0.03); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    padding: 0.4rem 0.5rem; margin-bottom: 0.25rem; flex-shrink: 0;
  }
  .btn-back {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7); cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
  }
  .btn-back:hover { background: rgba(255,255,255,0.1); color: white; }
  .level-badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600; font-size: 0.75rem; color: white; flex-shrink: 0; }
  .header-left-group { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0; }
  .filter-chips { display: flex; gap: 0.2rem; }
  .filter-chip {
    padding: 0.25rem 0.5rem; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.5); font-size: 0.65rem; font-weight: 500;
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .filter-chip:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
  .filter-chip.active { background: rgba(139,92,246,0.2); border-color: rgba(139,92,246,0.4); color: #c4b5fd; font-weight: 600; }
  .filter-chip.learned.active { background: rgba(34,197,94,0.2); border-color: rgba(34,197,94,0.4); color: #86efac; }
  .filter-chip.learning.active { background: rgba(251,191,36,0.2); border-color: rgba(251,191,36,0.4); color: #fde047; }
  .header-actions { display: flex; gap: 0.35rem; flex-shrink: 0; }
  .action-btn {
    display: flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.6rem;
    border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7);
    font-size: 0.7rem; font-weight: 500; cursor: pointer; transition: all 0.2s;
  }
  .action-btn:hover { background: rgba(255,255,255,0.1); color: white; }
  .action-btn.shuffle-btn.active {
    background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3));
    border-color: rgba(139,92,246,0.5); color: #e9d5ff;
  }
  .action-btn .btn-text { display: none; }
  @media (min-width: 500px) { .action-btn .btn-text { display: inline; } }
  .header-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.7); cursor: pointer; display: flex;
    align-items: center; justify-content: center; transition: all 0.2s;
  }
  .header-btn:hover { background: rgba(255,255,255,0.1); color: white; }
  .study-content {
    flex: 1; display: flex; align-items: stretch; gap: 0.5rem;
    min-height: 0; overflow: hidden; padding: 0.25rem 0;
  }
  .side-nav-btn {
    width: 44px; height: 44px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.3s; color: rgba(255,255,255,0.8); flex-shrink: 0; align-self: center;
  }
  .side-nav-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.1); color: white; transform: scale(1.05); }
  .side-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .kanji-card-container { flex: 1; perspective: 1000px; cursor: pointer; touch-action: pan-y; min-height: 0; }
  .kanji-card { position: relative; width: 100%; height: 100%; min-height: 400px; transform-style: preserve-3d; transition: transform 0.5s ease; }
  .kanji-card-container.flipped .kanji-card { transform: rotateY(180deg); }
  .kanji-card-front, .kanji-card-back {
    position: absolute; inset: 0; backface-visibility: hidden;
    background: rgba(255,255,255,0.03); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
    padding: 1.5rem; display: flex; flex-direction: column;
    overflow: auto; transition: box-shadow 0.4s;
  }
  .kanji-card:hover .kanji-card-front, .kanji-card:hover .kanji-card-back { box-shadow: 0 0 40px var(--level-glow); }
  .kanji-card-back { transform: rotateY(180deg); }
  .card-level-badge { position: absolute; top: 0.6rem; left: 0.6rem; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600; color: white; }
  .card-lesson-badge { position: absolute; top: 0.6rem; right: 0.6rem; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.65rem; max-width: 50%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .card-main-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 1rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; }
  .stroke-order-container { position: relative; display: flex; flex-direction: column; align-items: center; margin-bottom: 0.5rem; }
  .hanzi-writer-target { border-radius: 12px; }
  .hanzi-writer-target svg { filter: drop-shadow(0 0 20px rgba(139,92,246,0.3)); }
  .replay-btn { position: absolute; bottom: -8px; right: -8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(139,92,246,0.3); border: 1px solid rgba(139,92,246,0.5); color: #e9d5ff; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .replay-btn:hover { background: rgba(139,92,246,0.5); transform: scale(1.1); }
  .kanji-large-character { font-size: 120px; line-height: 1; color: #e9d5ff; font-family: 'Noto Serif JP', 'MS Mincho', serif; text-shadow: 0 0 40px rgba(139,92,246,0.4); margin-bottom: 0.5rem; }
  .reading-line { font-size: 1rem; color: rgba(255,255,255,0.8); margin: 0.2rem 0; display: flex; align-items: center; gap: 0.5rem; }
  .reading-label { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; background: rgba(139,92,246,0.2); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); }
  .on-yomi .reading-label { background: rgba(236,72,153,0.2); color: #f9a8d4; border-color: rgba(236,72,153,0.3); }
  .sino-vietnamese { font-size: 1.1rem; font-weight: 700; color: #fbbf24; margin: 0.3rem 0; letter-spacing: 0.05em; }
  .kanji-meaning-front { font-size: 1rem; color: rgba(255,255,255,0.7); margin-top: 0.3rem; }
  .back-content-wrapper { flex: 1; display: flex; flex-direction: column; gap: 1rem; padding-top: 0.5rem; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent; }
  .kanji-back-character { font-size: 72px; line-height: 1; color: #e9d5ff; text-align: center; font-family: 'Noto Serif JP', 'MS Mincho', serif; margin-bottom: 0.75rem; }
  .reading-section { display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .reading-label-back { font-size: 0.75rem; color: rgba(255,255,255,0.5); min-width: 55px; font-weight: 500; }
  .reading-value { color: rgba(255,255,255,0.9); font-size: 1rem; }
  .reading-value.sino { color: #fbbf24; font-weight: 600; }
  .kanji-meaning-back { font-size: 1.1rem; color: white; font-weight: 600; text-align: center; margin: 0.75rem 0; padding: 0.5rem; background: rgba(139,92,246,0.1); border-radius: 10px; border: 1px solid rgba(139,92,246,0.2); }
  .mnemonic-section { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 10px; padding: 0.75rem; margin-top: 0.5rem; }
  .mnemonic-label { color: #fbbf24; font-size: 0.8rem; font-weight: 600; }
  .mnemonic-text { color: rgba(255,255,255,0.8); font-size: 0.9rem; margin: 0.3rem 0 0; line-height: 1.5; }
  .radicals-section { margin-top: 0.5rem; }
  .radicals-label { color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 500; }
  .radicals-list { display: flex; gap: 0.4rem; margin-top: 0.3rem; flex-wrap: wrap; }
  .radical-chip { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: #e9d5ff; font-size: 1.2rem; font-family: 'Noto Serif JP', serif; }
  .sample-words-label { color: #c4b5fd; font-size: 0.9rem; display: block; margin-bottom: 0.5rem; }
  .sample-word { background: rgba(255,255,255,0.05); border-radius: 10px; padding: 0.6rem 0.85rem; margin-bottom: 0.4rem; border-left: 3px solid #8b5cf6; }
  .sample-word-main { display: flex; align-items: baseline; gap: 0.5rem; }
  .sample-word-text { color: white; font-size: 1rem; font-weight: 600; }
  .sample-word-reading { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
  .sample-word-meaning { color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-top: 0.2rem; }
  .flip-hint { text-align: center; color: rgba(255,255,255,0.4); font-size: 0.7rem; margin: 0; padding-top: 0.5rem; flex-shrink: 0; }
  .study-controls { flex-shrink: 0; display: flex; flex-direction: column; gap: 0.35rem; padding-top: 0.5rem; position: relative; }
  .memorization-buttons { display: flex; gap: 0.5rem; justify-content: center; }
  .mem-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; border-radius: 10px; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.3s; flex: 1; max-width: 160px; justify-content: center; }
  .mem-btn.not-learned { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
  .mem-btn.not-learned:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); color: white; }
  .mem-btn.not-learned.active { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.5); color: #fca5a5; }
  .mem-btn.learned { background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.7); }
  .mem-btn.learned:hover { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: #86efac; }
  .mem-btn.learned.active { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-color: transparent; color: white; box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
  .card-counter-fixed { position: absolute; bottom: 0.5rem; right: 0.5rem; padding: 0.35rem 0.75rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; font-size: 0.75rem; color: rgba(255,255,255,0.6); font-weight: 500; }
  .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: rgba(255,255,255,0.5); gap: 1rem; }
  .empty-state svg { opacity: 0.5; }
  .empty-state h3 { margin: 0; font-size: 1.25rem; color: rgba(255,255,255,0.7); }
  .empty-state p { margin: 0; font-size: 0.9rem; }
  .settings-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding: 1rem; animation: fadeIn 0.2s; overflow-y: auto; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .settings-modal { background: linear-gradient(145deg, #1e1e2f 0%, #151521 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; width: 100%; max-width: 400px; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.5); animation: slideUp 0.3s; margin-bottom: 1rem; flex-shrink: 0; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .settings-modal-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); flex-shrink: 0; }
  .settings-modal-header h3 { margin: 0; color: white; font-size: 1.1rem; font-weight: 600; flex: 1; }
  .btn-close { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .btn-close:hover { background: rgba(255,255,255,0.1); color: white; transform: rotate(90deg); }
  .settings-modal-content { padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .settings-section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 0.75rem; }
  .section-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .section-header svg { color: #8b5cf6; }
  .section-header h4 { margin: 0; color: white; font-size: 0.95rem; font-weight: 600; }
  .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
  .setting-toggle { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
  .setting-toggle:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
  .setting-toggle.active { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.3); }
  .setting-toggle input { display: none; }
  .toggle-switch { width: 36px; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; position: relative; transition: all 0.3s; flex-shrink: 0; }
  .toggle-switch::after { content: ''; position: absolute; width: 16px; height: 16px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: all 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
  .setting-toggle.active .toggle-switch { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); }
  .setting-toggle.active .toggle-switch::after { transform: translateX(16px); }
  .toggle-label { color: rgba(255,255,255,0.8); font-size: 0.85rem; font-weight: 500; }
  .setting-toggle.active .toggle-label { color: #c4b5fd; }
  @media (min-width: 900px) { .back-content-wrapper { flex-direction: row; gap: 1.5rem; padding: 1.5rem; } .back-section-left { flex: 1; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 1.5rem; } .back-section-right { flex: 1; padding-left: 0.5rem; } }
  @media (max-width: 768px) { .study-header-compact { padding: 0.35rem; gap: 0.35rem; } .header-left-group { gap: 0.3rem; } .filter-chips { gap: 0.15rem; } .filter-chip { font-size: 0.6rem; padding: 0.2rem 0.35rem; border-radius: 10px; } }
  @media (max-width: 640px) { .kanji-study-page { padding: 0.25rem; } .btn-back, .header-btn { width: 28px; height: 28px; } .header-actions { gap: 0.2rem; } .level-badge { padding: 0.2rem 0.4rem; font-size: 0.65rem; } .filter-chip { font-size: 0.55rem; padding: 0.15rem 0.3rem; } .side-nav-btn { display: none; } .kanji-card-front, .kanji-card-back { padding: 0.75rem; border-radius: 12px; } .memorization-buttons { gap: 0.35rem; } .mem-btn { padding: 0.5rem 0.75rem; font-size: 0.8rem; max-width: 140px; } .kanji-large-character { font-size: 80px; } .settings-grid { grid-template-columns: 1fr; } }
`;
