// Golden Bell Skill System Hook
// Manages skill phases, spin wheel, and skill activation

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellSkillType,
  GoldenBellSkill,
  SkillPhaseData,
} from '../../types/golden-bell';
import { ALL_GOLDEN_BELL_SKILLS, GOLDEN_BELL_SOLO_SKILLS, GOLDEN_BELL_TEAM_SKILLS } from '../../types/golden-bell';

interface UseSkillsProps {
  game: GoldenBellGame | null;
  currentUser: { id: string };
  setGame: (updater: (prev: GoldenBellGame | null) => GoldenBellGame | null) => void;
  isHost: boolean;
}

export function useSkills({ game, currentUser, setGame, isHost }: UseSkillsProps) {
  /** Get list of enabled skills based on game settings */
  const getEnabledSkills = useCallback((): GoldenBellSkill[] => {
    if (!game?.settings.skillsEnabled) return [];
    const enabledTypes = game.settings.enabledSkills;
    const isTeamMode = game.settings.gameMode === 'team';

    // If specific skills are configured, use those
    if (enabledTypes && enabledTypes.length > 0) {
      return enabledTypes
        .map(t => ALL_GOLDEN_BELL_SKILLS[t])
        .filter(Boolean);
    }

    // Default: all solo skills + team skills if team mode
    const skills: GoldenBellSkill[] = Object.values(GOLDEN_BELL_SOLO_SKILLS);
    if (isTeamMode) {
      skills.push(...Object.values(GOLDEN_BELL_TEAM_SKILLS));
    }
    return skills;
  }, [game]);

  /** Trigger skill phase (host only) — set status='skill_phase', mark eligible players */
  const triggerSkillPhase = useCallback(() => {
    if (!game || !isHost) return;

    const alivePlayers = Object.values(game.players)
      .filter(p => p.status === 'alive')
      .map(p => p.odinhId);

    const skillPhaseData: SkillPhaseData = {
      eligiblePlayers: alivePlayers,
      completedPlayers: [],
    };

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'skill_phase' as const,
        skillPhaseData,
      };
    });
  }, [game, isHost, setGame]);

  /** Assign a random skill to a player (from spin wheel result) */
  const assignRandomSkill = useCallback((playerId: string): GoldenBellSkillType | null => {
    const skills = getEnabledSkills();
    if (skills.length === 0) return null;

    const randomSkill = skills[Math.floor(Math.random() * skills.length)];
    const skillType = randomSkill.type;

    setGame(prev => {
      if (!prev) return null;
      const player = prev.players[playerId];
      if (!player) return prev;

      const updatedPlayer: GoldenBellPlayer = {
        ...player,
        skills: [...player.skills, skillType],
      };

      // Set the specific flag
      switch (skillType) {
        case 'shield':
          updatedPlayer.hasShield = true;
          break;
        case 'self_rescue':
          updatedPlayer.hasSelfRescue = true;
          break;
        case 'double_time':
          updatedPlayer.hasDoubleTime = true;
          break;
        case 'fifty_fifty':
          updatedPlayer.hasFiftyFifty = true;
          break;
      }

      // Mark player as completed in skill phase
      const completedPlayers = [...(prev.skillPhaseData?.completedPlayers || []), playerId];

      return {
        ...prev,
        players: { ...prev.players, [playerId]: updatedPlayer },
        skillPhaseData: {
          ...prev.skillPhaseData!,
          completedPlayers,
          currentSpinner: undefined,
        },
      };
    });

    return skillType;
  }, [getEnabledSkills, setGame]);

  /** Use (activate) a skill — called during gameplay */
  const useSkill = useCallback((skillType: GoldenBellSkillType) => {
    const playerId = currentUser.id;

    setGame(prev => {
      if (!prev) return null;
      const player = prev.players[playerId];
      if (!player) return prev;

      const updatedPlayer = { ...player };

      switch (skillType) {
        case 'fifty_fifty': {
          if (!updatedPlayer.hasFiftyFifty) return prev;
          updatedPlayer.hasFiftyFifty = false;
          // Determine which 2 wrong options to hide
          const currentQ = prev.questions[prev.currentQuestionIndex];
          if (currentQ) {
            const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQ.correctIndex);
            // Shuffle and pick 2
            const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
            updatedPlayer.fiftyFiftyExcluded = [shuffled[0], shuffled[1]];
          }
          break;
        }
        case 'double_time':
          if (!updatedPlayer.hasDoubleTime) return prev;
          updatedPlayer.hasDoubleTime = false;
          break;
        case 'shield':
          // Shield is consumed automatically during reveal
          break;
        case 'self_rescue':
          // Self-rescue is consumed automatically during reveal
          break;
      }

      // Remove from skills array
      const skillIdx = updatedPlayer.skills.indexOf(skillType);
      if (skillIdx >= 0) {
        updatedPlayer.skills = [...updatedPlayer.skills];
        updatedPlayer.skills.splice(skillIdx, 1);
      }

      return {
        ...prev,
        players: { ...prev.players, [playerId]: updatedPlayer },
      };
    });
  }, [currentUser.id, setGame]);

  /** Complete the skill phase → transition back to next question (host only) */
  const completeSkillPhase = useCallback(() => {
    if (!game || !isHost || game.status !== 'skill_phase') return;

    // Auto-assign skills to bots who haven't spun
    setGame(prev => {
      if (!prev) return null;

      const updatedPlayers = { ...prev.players };
      const eligible = prev.skillPhaseData?.eligiblePlayers || [];
      const completed = prev.skillPhaseData?.completedPlayers || [];
      const skills = getEnabledSkills();

      // Auto-assign for players who didn't spin (bots)
      eligible.forEach(pid => {
        if (!completed.includes(pid) && updatedPlayers[pid]?.isBot && skills.length > 0) {
          const randomSkill = skills[Math.floor(Math.random() * skills.length)];
          const player = updatedPlayers[pid];
          updatedPlayers[pid] = {
            ...player,
            skills: [...player.skills, randomSkill.type],
            ...(randomSkill.type === 'shield' ? { hasShield: true } : {}),
            ...(randomSkill.type === 'self_rescue' ? { hasSelfRescue: true } : {}),
            ...(randomSkill.type === 'double_time' ? { hasDoubleTime: true } : {}),
            ...(randomSkill.type === 'fifty_fifty' ? { hasFiftyFifty: true } : {}),
          };
        }
      });

      // Reset player answers for next round
      Object.keys(updatedPlayers).forEach(id => {
        updatedPlayers[id] = {
          ...updatedPlayers[id],
          currentAnswer: undefined,
          answerTime: undefined,
          fiftyFiftyExcluded: undefined,
        };
      });

      return {
        ...prev,
        status: 'question' as const,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        players: updatedPlayers,
        eliminatedThisRound: [],
        skillPhaseData: undefined,
        _skillEligiblePlayers: undefined,
      };
    });

    // Auto-transition to answering after question display
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'answering' as const,
          questionStartTime: Date.now(),
        };
      });
    }, 2000);
  }, [game, isHost, getEnabledSkills, setGame]);

  /** Check if skill phase should trigger (called after revealAnswer) */
  const shouldTriggerSkillPhase = useCallback((questionIndex: number): boolean => {
    if (!game?.settings.skillsEnabled) return false;
    const interval = game.settings.skillInterval || 5;
    // Trigger after every N questions (1-indexed: after question 5, 10, 15, ...)
    return (questionIndex + 1) % interval === 0;
  }, [game]);

  /** Set current spinner (for UI coordination) */
  const setCurrentSpinner = useCallback((playerId: string | undefined) => {
    setGame(prev => {
      if (!prev || !prev.skillPhaseData) return prev;
      return {
        ...prev,
        skillPhaseData: {
          ...prev.skillPhaseData,
          currentSpinner: playerId,
        },
      };
    });
  }, [setGame]);

  return {
    getEnabledSkills,
    triggerSkillPhase,
    assignRandomSkill,
    useSkill,
    completeSkillPhase,
    shouldTriggerSkillPhase,
    setCurrentSpinner,
  };
}
