// Floating chat & AI tutor panels — shown on all pages except game-hub
// Extracted from AppContent to keep AppChrome under 200 LOC

import { lazy, Suspense } from 'react';
import { ErrorBoundary } from '../common/error-boundary';
import { FloatingChatButton } from '../common/floating-chat-button';
import type { CurrentUser } from '../../types/user';

const FloatingChatPanel = lazy(() => import('../common/floating-chat-panel').then(m => ({ default: m.FloatingChatPanel })));
const AiTutorPanel = lazy(() => import('../common/ai-tutor-panel').then(m => ({ default: m.AiTutorPanel })));

interface FloatingPanelsProps {
  currentUser: CurrentUser;
  currentPage: string;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
}

export function FloatingPanels({
  currentUser, currentPage,
  isChatOpen, setIsChatOpen,
  isAiChatOpen, setIsAiChatOpen,
}: FloatingPanelsProps) {
  // Hidden on game-hub page
  if (currentPage === 'game-hub') return null;

  return (
    <>
      {/* AI Tutor button */}
      <button
        className={`floating-ai-btn ${isAiChatOpen ? 'floating-ai-btn--active' : ''}`}
        onClick={() => { setIsAiChatOpen(!isAiChatOpen); if (isChatOpen) setIsChatOpen(false); }}
        title="AI Gia sư"
      >
        🤖
      </button>

      {/* User chat button */}
      <FloatingChatButton
        onClick={() => { setIsChatOpen(!isChatOpen); if (isAiChatOpen) setIsAiChatOpen(false); }}
        isActive={isChatOpen}
      />

      {/* User chat panel */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <FloatingChatPanel
            currentUser={currentUser}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </Suspense>
      </ErrorBoundary>

      {/* AI Tutor panel */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <AiTutorPanel
            isOpen={isAiChatOpen}
            onClose={() => setIsAiChatOpen(false)}
            userJlptLevel={currentUser.jlptLevel}
          />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
