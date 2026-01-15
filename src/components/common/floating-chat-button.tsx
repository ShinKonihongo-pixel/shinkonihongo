// Floating AI chat button - bottom right corner

import { useState } from 'react';

interface FloatingChatButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function FloatingChatButton({ onClick, isActive }: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`floating-chat-btn ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Thảo luận với AI"
      aria-label="Mở chat AI"
    >
      {/* Chat Bubble Icon */}
      <svg
        className="chat-icon"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main chat bubble */}
        <path
          d="M8 12C8 8.68629 10.6863 6 14 6H50C53.3137 6 56 8.68629 56 12V36C56 39.3137 53.3137 42 50 42H20L10 52V42H14C10.6863 42 8 39.3137 8 36V12Z"
          fill="currentColor"
        />
        {/* Three dots */}
        <circle cx="22" cy="24" r="4" fill="white" />
        <circle cx="32" cy="24" r="4" fill="white" />
        <circle cx="42" cy="24" r="4" fill="white" />
      </svg>

      {/* Tooltip on hover */}
      {isHovered && !isActive && (
        <span className="chat-tooltip">Thảo luận</span>
      )}
    </button>
  );
}
