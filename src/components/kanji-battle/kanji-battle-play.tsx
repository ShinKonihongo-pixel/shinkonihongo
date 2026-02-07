// Kanji Battle Play - Orchestrator for read/write modes
import React from 'react';
import type { KanjiBattleGame, KanjiBattleSkillType, StrokeMatchResult } from '../../types/kanji-battle';
import { KanjiBattlePlayRead } from './kanji-battle-play-read';
import { KanjiBattlePlayWrite } from './kanji-battle-play-write';

interface KanjiBattlePlayProps {
  game: KanjiBattleGame;
  currentPlayerId: string;
  onSubmitAnswer: (answer: string) => void;
  onSubmitDrawing: (strokeResults: StrokeMatchResult[], drawingTimeMs: number) => void;
  onUseHint: () => void;
  onSelectSkill: (skillType: KanjiBattleSkillType, targetId?: string) => void;
  onNextRound: () => void;
}

export const KanjiBattlePlay: React.FC<KanjiBattlePlayProps> = (props) => {
  if (props.game.settings.gameMode === 'write') {
    return <KanjiBattlePlayWrite {...props} />;
  }
  return <KanjiBattlePlayRead {...props} />;
};
