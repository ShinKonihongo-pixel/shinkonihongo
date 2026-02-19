// Bingo Skill Picker — glassmorphism overlay for choosing a special skill

import { useState } from 'react';
import type { BingoSkillType, BingoPlayer } from '../../types/bingo-game';
import { BINGO_SKILLS } from '../../types/bingo-game';

interface BingoSkillPickerProps {
  currentPlayer: BingoPlayer;
  opponents: BingoPlayer[];
  onUseSkill: (skillType: BingoSkillType, targetId?: string) => void;
  onSkipSkill: () => void;
}

export function BingoSkillPicker({
  currentPlayer,
  opponents,
  onUseSkill,
  onSkipSkill,
}: BingoSkillPickerProps) {
  const [selectedSkill, setSelectedSkill] = useState<BingoSkillType | null>(null);

  if (!currentPlayer.hasSkillAvailable) return null;

  const handleSkillSelect = (skillType: BingoSkillType) => {
    const skill = BINGO_SKILLS[skillType];
    if (!skill.targetOther) {
      onUseSkill(skillType);
    } else {
      setSelectedSkill(skillType);
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (selectedSkill) {
      onUseSkill(selectedSkill, targetId);
      setSelectedSkill(null);
    }
  };

  return (
    <div className="bingo-skill-picker">
      <div className="bsp-content">
        {!selectedSkill ? (
          <>
            <h3 className="bsp-title">Chọn kỹ năng đặc biệt!</h3>

            <div className="bsp-grid">
              {Object.values(BINGO_SKILLS).map(skill => (
                <button
                  key={skill.type}
                  className="bsp-card"
                  onClick={() => handleSkillSelect(skill.type)}
                >
                  <span className="bsp-emoji">{skill.emoji}</span>
                  <span className="bsp-name">{skill.name}</span>
                  <span className="bsp-desc">{skill.description}</span>
                </button>
              ))}
            </div>

            <button className="bsp-skip" onClick={onSkipSkill}>
              Bỏ Qua
            </button>
          </>
        ) : (
          <>
            <h3 className="bsp-title">
              {BINGO_SKILLS[selectedSkill].emoji} Chọn đối thủ
            </h3>

            <div className="bsp-targets">
              {opponents.map(player => (
                <button
                  key={player.odinhId}
                  className="bsp-target"
                  onClick={() => handleTargetSelect(player.odinhId)}
                >
                  <span className="bsp-target-avatar">{player.avatar}</span>
                  <span className="bsp-target-name">{player.displayName}</span>
                  <span className="bsp-target-stats">
                    ✓{player.markedCount} | 🏆{player.completedRows}
                  </span>
                </button>
              ))}
            </div>

            <button className="bsp-skip" onClick={() => setSelectedSkill(null)}>
              ← Quay lại
            </button>
          </>
        )}
      </div>
    </div>
  );
}
