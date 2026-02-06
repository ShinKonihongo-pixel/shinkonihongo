export const styles = `
/* ========== Premium Selector Base ========== */
.premium-selector {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 60px);
  max-height: calc(100vh - 60px);
  overflow: hidden;
  background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  display: flex;
  flex-direction: column;
}

/* ========== Animated Background ========== */
.bg-aurora {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 50%);
  animation: aurora 15s ease-in-out infinite alternate;
}

@keyframes aurora {
  0% { opacity: 0.8; transform: scale(1) rotate(0deg); }
  100% { opacity: 1; transform: scale(1.1) rotate(3deg); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* ========== Level Selection Container ========== */
.selector-container {
  position: relative;
  z-index: 10;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 100px 2rem 1rem;
  gap: 1rem;
}

/* ========== Premium Header ========== */
.premium-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: fadeInDown 0.6s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.header-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.header-icon-wrapper {
  position: relative;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow:
    0 8px 32px rgba(99, 102, 241, 0.3),
    inset 0 0 32px rgba(255,255,255,0.05);
}

.sparkle-effect {
  position: absolute;
  color: #fbbf24;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle-1 {
  top: -8px;
  right: -8px;
}

.sparkle-2 {
  bottom: -4px;
  left: -6px;
  animation-delay: 0.5s;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.3) rotate(15deg); opacity: 0.7; }
}

.header-title {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.03em;
}

.header-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1rem;
  margin: 0;
}

/* ========== Level Cards Grid (3+2 layout) ========== */
.levels-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.25rem;
  max-width: 1000px;
  width: 100%;
  margin-top: 3rem;
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

/* Row 1: N5, N4, N3 = 2 cols each */
.levels-grid .level-card:nth-child(1),
.levels-grid .level-card:nth-child(2),
.levels-grid .level-card:nth-child(3) {
  grid-column: span 2;
}

/* Row 2: N2, N1 = 3 cols each (centered) */
.levels-grid .level-card:nth-child(4) {
  grid-column: 1 / span 3;
}

.levels-grid .level-card:nth-child(5) {
  grid-column: 4 / span 3;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ========== Level Card ========== */
.level-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: cardAppear 0.5s ease-out var(--delay) both;
}

@keyframes cardAppear {
  from { opacity: 0; transform: translateY(30px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.level-card .card-glow {
  position: absolute;
  inset: -2px;
  background: var(--card-gradient);
  border-radius: 22px;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.level-card:hover:not(:disabled) .card-glow {
  opacity: 0.4;
}

.level-card:hover:not(:disabled) {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow:
    0 20px 40px -10px var(--card-glow),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.level-card:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.level-card .card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.level-card .card-level {
  font-size: 2.5rem;
  font-weight: 900;
  background: var(--card-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  text-align: center;
}

.level-card .card-count {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-align: center;
}

.level-card .card-arrow {
  position: absolute;
  bottom: -30px;
  opacity: 0;
  color: var(--card-accent);
  transition: all 0.3s ease;
}

.level-card:hover:not(:disabled) .card-arrow {
  bottom: -20px;
  opacity: 1;
}

.level-card .card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.6s ease;
}

.level-card:hover:not(:disabled) .card-shine {
  left: 100%;
}

/* ========== Lesson Container ========== */
.lesson-container {
  position: relative;
  z-index: 10;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.4s ease-out;
  background: linear-gradient(135deg, #0c0a1d 0%, #1a1333 50%, #0f172a 100%);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ========== Premium Lesson Header ========== */
.lesson-header {
  position: relative;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
}

.lesson-header::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--header-gradient);
  box-shadow: 0 0 20px var(--header-glow);
}

.lesson-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(-2px);
}

.level-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
  padding: 0 0.75rem;
  background: var(--header-gradient);
  border-radius: 12px;
  box-shadow:
    0 4px 15px -3px var(--header-glow),
    inset 0 1px 0 rgba(255,255,255,0.2);
}

.level-text {
  font-weight: 900;
  font-size: 1rem;
  color: white;
  letter-spacing: -0.02em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.lesson-header .header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
  margin: 0;
  letter-spacing: -0.01em;
}

.lesson-header .header-subtitle {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.875rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.header-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.header-btn.select-all {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.header-btn.select-all:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%);
  border-color: rgba(16, 185, 129, 0.5);
  color: #a7f3d0;
}

.header-btn.select-all.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.4);
}

.header-btn.deselect {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
}

.header-btn.deselect:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.25);
  color: #fca5a5;
}

.header-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ========== Lessons Grid - Premium ========== */
.lessons-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  align-content: start;
}

.lessons-grid::-webkit-scrollbar {
  width: 6px;
}

.lessons-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.lessons-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.4);
  gap: 1rem;
}

/* ========== Lesson Card - Premium ========== */
.lesson-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  animation: lessonAppear 0.3s ease-out var(--delay) both;
  overflow: hidden;
}

.lesson-card::before {
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

.lesson-card:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px -10px rgba(0,0,0,0.5);
}

.lesson-card:hover:not(:disabled)::before {
  opacity: 1;
}

.lesson-card.selected {
  background: linear-gradient(135deg, rgba(var(--accent-rgb, 16, 185, 129), 0.15) 0%, rgba(var(--accent-rgb, 16, 185, 129), 0.08) 100%);
  border-color: var(--accent);
  box-shadow:
    0 0 0 1px var(--accent),
    0 4px 20px -5px var(--glow);
}

.lesson-card.selected::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
}

.lesson-card:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.check-box {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.03);
}

.check-box.checked {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 3px 12px var(--glow);
  transform: scale(1.05);
}

.lesson-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.lesson-name {
  font-weight: 700;
  color: white;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
}

.lesson-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ========== Footer ========== */
.lesson-footer {
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.start-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.85rem 1.5rem;
  background: var(--btn-gradient);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px -5px var(--btn-glow);
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px -5px var(--btn-glow);
}

.start-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.btn-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .selector-container {
    padding: 100px 1rem 1rem;
    gap: 0.75rem;
  }

  .header-title {
    font-size: 1.75rem;
  }

  .header-icon {
    width: 60px;
    height: 60px;
  }

  .levels-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .levels-grid .level-card:nth-child(1),
  .levels-grid .level-card:nth-child(2),
  .levels-grid .level-card:nth-child(3) {
    grid-column: span 2;
  }

  .levels-grid .level-card:nth-child(4) {
    grid-column: 1 / span 3;
  }

  .levels-grid .level-card:nth-child(5) {
    grid-column: 4 / span 3;
  }

  .level-card {
    padding: 1.5rem 0.75rem;
    border-radius: 16px;
  }

  .level-card .card-level {
    font-size: 2.5rem;
  }

  .level-card .card-count {
    font-size: 0.65rem;
  }

  .lessons-grid {
    grid-template-columns: repeat(3, 1fr);
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .lesson-card {
    padding: 1rem 0.5rem;
  }

  .lesson-name {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .selector-container {
    padding: 100px 0.75rem 0.5rem;
    gap: 0.5rem;
  }

  .header-title {
    font-size: 1.5rem;
  }

  .header-subtitle {
    font-size: 0.85rem;
  }

  .levels-grid {
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .level-card {
    padding: 1.25rem 0.5rem;
    border-radius: 14px;
  }

  .level-card .card-level {
    font-size: 2.2rem;
  }

  .level-card .card-count {
    font-size: 0.6rem;
  }

  .lesson-header {
    padding: 0.6rem 0.75rem;
  }

  .header-left {
    gap: 0.4rem;
  }

  .back-btn {
    width: 30px;
    height: 30px;
  }

  .level-badge {
    min-width: 34px;
    height: 34px;
    padding: 0 0.4rem;
    border-radius: 8px;
  }

  .level-text {
    font-size: 0.8rem;
  }

  .header-info {
    display: none;
  }

  .header-actions {
    gap: 0.3rem;
  }

  .header-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.65rem;
    gap: 0.2rem;
  }

  .header-btn.select-all svg {
    display: none;
  }

  .lessons-grid {
    grid-template-columns: repeat(3, 1fr);
    padding: 0.5rem;
    gap: 0.35rem;
  }

  .lesson-card {
    padding: 0.7rem 0.4rem;
    border-radius: 10px;
  }

  .check-box {
    width: 18px;
    height: 18px;
  }

  .lesson-name {
    font-size: 0.75rem;
  }

  .lesson-count {
    font-size: 0.6rem;
  }

  .lesson-footer {
    padding: 0.5rem 0.75rem;
  }

  .start-btn {
    padding: 0.65rem 1rem;
    font-size: 0.85rem;
    border-radius: 10px;
  }
}
`;
