import React from 'react';
import { Zap } from 'lucide-react';
import type { GameState } from './word-scramble-types';

interface HintsPanelProps {
  gameState: GameState;
}

export const HintsPanel: React.FC<HintsPanelProps> = ({ gameState }) => {
  return (
    <div className="ws-hints-card">
      <div className="ws-hints-header">
        <Zap size={18} />
        <h3>Gợi ý</h3>
      </div>
      <div className="ws-hints-list">
        <div className={`ws-hint-item ${gameState.hints.hint1Shown ? 'revealed' : 'locked'}`}>
          <div className="hint-number">1</div>
          <div className="hint-content">
            {gameState.hints.hint1Shown ? (
              <>
                <span className="hint-label">Hán Việt / Nghĩa</span>
                <span className="hint-value">{gameState.hints.hint1Content}</span>
              </>
            ) : (
              <span className="hint-locked">45% thời gian</span>
            )}
          </div>
        </div>
        <div className={`ws-hint-item ${gameState.hints.hint2Shown ? 'revealed' : 'locked'}`}>
          <div className="hint-number">2</div>
          <div className="hint-content">
            {gameState.hints.hint2Shown ? (
              <>
                <span className="hint-label">Chữ đầu</span>
                <span className="hint-value">{gameState.hints.hint2Content}</span>
              </>
            ) : (
              <span className="hint-locked">60% thời gian</span>
            )}
          </div>
        </div>
        <div className={`ws-hint-item ${gameState.hints.hint3Shown ? 'revealed' : 'locked'}`}>
          <div className="hint-number">3</div>
          <div className="hint-content">
            {gameState.hints.hint3Shown ? (
              <>
                <span className="hint-label">Chữ cuối</span>
                <span className="hint-value">{gameState.hints.hint3Content}</span>
              </>
            ) : (
              <span className="hint-locked">75% thời gian</span>
            )}
          </div>
        </div>
      </div>
      {/* Streak indicator */}
      {gameState.streak > 0 && (
        <div className="ws-streak">
          🔥 Streak: {gameState.streak}
        </div>
      )}
    </div>
  );
};
