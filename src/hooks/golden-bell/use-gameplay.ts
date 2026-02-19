// Golden Bell Gameplay Logic
// Handles answer submission, reveal, and progression

import { useCallback } from 'react';
import type {
  GoldenBellGame,
  GoldenBellPlayer,
  GoldenBellQuestion,
  GoldenBellResults,
} from '../../types/golden-bell';
import { generateResults, generateTeamResults } from './utils';

interface UseGameplayProps {
  game: GoldenBellGame | null;
  currentPlayer: GoldenBellPlayer | undefined;
  currentQuestion: GoldenBellQuestion | null;
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
  };
  setGame: (updater: (prev: GoldenBellGame | null) => GoldenBellGame | null) => void;
  setGameResults: (results: GoldenBellResults | null) => void;
  isHost: boolean;
}

export function useGameplay({
  game,
  currentPlayer,
  currentQuestion,
  currentUser,
  setGame,
  setGameResults,
  isHost,
}: UseGameplayProps) {
  // Submit answer
  const submitAnswer = useCallback((answerIndex: number) => {
    if (!game || !currentQuestion || game.status !== 'answering') return;
    if (!currentPlayer || currentPlayer.status !== 'alive') return;

    const answerTime = Date.now() - (game.questionStartTime || Date.now());
    const isCorrect = answerIndex === currentQuestion.correctIndex;

    setGame(prev => {
      if (!prev) return null;
      const player = prev.players[currentUser.id];
      if (!player) return prev;

      const newStreak = isCorrect ? player.streak + 1 : 0;

      return {
        ...prev,
        players: {
          ...prev.players,
          [currentUser.id]: {
            ...player,
            currentAnswer: answerIndex,
            answerTime,
            totalAnswers: player.totalAnswers + 1,
            correctAnswers: isCorrect ? player.correctAnswers + 1 : player.correctAnswers,
            streak: newStreak,
          },
        },
      };
    });
  }, [game, currentQuestion, currentPlayer, currentUser, setGame]);

  // Check if current question is a "special skill question" (no elimination, spin eligibility only)
  const isSpecialQuestion = useCallback((questionIndex: number): boolean => {
    if (!game?.settings.skillsEnabled) return false;
    const interval = game.settings.skillInterval || 5;
    // The question right before a skill phase is "special"
    return (questionIndex + 1) % interval === 0;
  }, [game]);

  // Reveal answer and eliminate wrong players (host only)
  // Special skill questions: wrong answer = no elimination, just lose spin eligibility
  const revealAnswer = useCallback(() => {
    if (!game || !isHost || game.status !== 'answering') return;

    const correctIndex = currentQuestion?.correctIndex;
    const qIdx = game.currentQuestionIndex;
    const isSpecial = isSpecialQuestion(qIdx);

    // Track correct/wrong players
    const wrongPlayers: string[] = [];
    const correctPlayers: string[] = [];

    Object.values(game.players).forEach(player => {
      if (player.status === 'alive') {
        const answeredCorrectly = player.currentAnswer === correctIndex;
        if (answeredCorrectly) {
          correctPlayers.push(player.odinhId);
        } else {
          wrongPlayers.push(player.odinhId);
        }
      }
    });

    setGame(prev => {
      if (!prev) return null;

      const updatedPlayers = { ...prev.players };
      const eliminated: string[] = [];

      // On special questions: NO elimination, just track who answered correctly
      if (!isSpecial) {
        wrongPlayers.forEach(id => {
          const player = updatedPlayers[id];
          if (!player) return;

          // Shield check: consume shield instead of eliminating
          if (player.hasShield) {
            const skillIdx = player.skills.indexOf('shield');
            const newSkills = [...player.skills];
            if (skillIdx >= 0) newSkills.splice(skillIdx, 1);
            updatedPlayers[id] = {
              ...player,
              hasShield: false,
              skills: newSkills,
            };
            return; // Skip elimination
          }

          // Eliminate player
          updatedPlayers[id] = {
            ...player,
            status: 'eliminated',
            eliminatedAt: prev.currentQuestionIndex + 1,
          };
          eliminated.push(id);
        });

        // Self-rescue check: auto-revive eliminated players who have self_rescue
        eliminated.forEach(id => {
          const player = updatedPlayers[id];
          if (player?.hasSelfRescue) {
            const skillIdx = player.skills.indexOf('self_rescue');
            const newSkills = [...player.skills];
            if (skillIdx >= 0) newSkills.splice(skillIdx, 1);
            updatedPlayers[id] = {
              ...player,
              status: 'alive',
              eliminatedAt: undefined,
              hasSelfRescue: false,
              skills: newSkills,
            };
            const elIdx = eliminated.indexOf(id);
            if (elIdx >= 0) eliminated.splice(elIdx, 1);
          }
        });
      }

      const newAliveCount = Object.values(updatedPlayers).filter(p => p.status === 'alive').length;

      // Update team stats if team mode
      let updatedTeams = prev.teams ? { ...prev.teams } : undefined;
      if (updatedTeams) {
        Object.keys(updatedTeams).forEach(tid => {
          const team = updatedTeams![tid];
          updatedTeams![tid] = {
            ...team,
            aliveCount: team.members.filter(m => updatedPlayers[m]?.status === 'alive').length,
            totalCorrect: team.members.reduce((sum, m) => sum + (updatedPlayers[m]?.correctAnswers || 0), 0),
          };
        });
      }

      return {
        ...prev,
        status: 'revealing' as const,
        players: updatedPlayers,
        alivePlayers: newAliveCount,
        eliminatedThisRound: eliminated,
        // Store correct players for skill phase eligibility
        ...(isSpecial ? { _skillEligiblePlayers: correctPlayers } : {}),
        teams: updatedTeams || prev.teams,
      };
    });
  }, [game, isHost, currentQuestion, isSpecialQuestion, setGame]);

  // Move to next question or end game (host only)
  const nextQuestion = useCallback(() => {
    if (!game || !isHost || game.status !== 'revealing') return;

    const alivePlayersCount = Object.values(game.players).filter(p => p.status === 'alive').length;
    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    // Team mode: check if only 1 team has alive members
    if (game.settings.gameMode === 'team' && game.teams) {
      const teamsWithAlive = Object.values(game.teams).filter(t =>
        t.members.some(m => game.players[m]?.status === 'alive')
      );
      if (teamsWithAlive.length <= 1 || isLastQuestion) {
        // End game — team mode
        const rankings = generateResults(game);
        const teamRankings = generateTeamResults(game);

        setGame(prev => {
          if (!prev) return null;
          const updatedPlayers = { ...prev.players };
          const alivePlayers = Object.values(updatedPlayers).filter(p => p.status === 'alive');
          if (alivePlayers.length === 1) {
            updatedPlayers[alivePlayers[0].odinhId] = { ...alivePlayers[0], status: 'winner' };
          }
          return { ...prev, status: 'finished', finishedAt: new Date().toISOString(), players: updatedPlayers };
        });

        setGameResults({
          gameId: game.id,
          winner: rankings[0]?.isWinner ? rankings[0] : null,
          rankings,
          totalQuestions: game.currentQuestionIndex + 1,
          totalPlayers: Object.keys(game.players).length,
          gameMode: 'team',
          teamRankings,
        });
        return;
      }
    }

    // End game if only 1 player left or no more questions
    if (alivePlayersCount <= 1 || isLastQuestion) {
      // Generate results
      const rankings = generateResults(game);

      setGame(prev => {
        if (!prev) return null;

        // Mark winner if there's exactly one alive
        const updatedPlayers = { ...prev.players };
        const alivePlayers = Object.values(updatedPlayers).filter(p => p.status === 'alive');
        if (alivePlayers.length === 1) {
          updatedPlayers[alivePlayers[0].odinhId] = {
            ...alivePlayers[0],
            status: 'winner',
          };
        }

        return {
          ...prev,
          status: 'finished',
          finishedAt: new Date().toISOString(),
          players: updatedPlayers,
        };
      });

      setGameResults({
        gameId: game.id,
        winner: rankings[0]?.isWinner ? rankings[0] : null,
        rankings,
        totalQuestions: game.currentQuestionIndex + 1,
        totalPlayers: Object.keys(game.players).length,
        gameMode: game.settings.gameMode,
      });

      return;
    }

    // Check if skill phase should trigger before advancing
    const nextIndex = game.currentQuestionIndex + 1;
    if (game.settings.skillsEnabled && nextIndex < game.questions.length) {
      const interval = game.settings.skillInterval || 5;
      if (nextIndex % interval === 0) {
        // Use _skillEligiblePlayers (correct answerers from special question) if available,
        // otherwise fall back to all alive players
        const eligiblePlayers = game._skillEligiblePlayers ||
          Object.values(game.players)
            .filter(p => p.status === 'alive')
            .map(p => p.odinhId);

        setGame(prev => {
          if (!prev) return null;
          const resetPlayers = { ...prev.players };
          Object.keys(resetPlayers).forEach(id => {
            resetPlayers[id] = {
              ...resetPlayers[id],
              currentAnswer: undefined,
              answerTime: undefined,
              fiftyFiftyExcluded: undefined,
            };
          });

          return {
            ...prev,
            status: 'skill_phase' as const,
            players: resetPlayers,
            eliminatedThisRound: [],
            _skillEligiblePlayers: undefined, // Clean up after use
            skillPhaseData: {
              eligiblePlayers,
              completedPlayers: [],
            },
          };
        });
        return; // Don't advance to next question yet
      }
    }

    // Move to next question
    setGame(prev => {
      if (!prev) return null;

      // Reset player answers for next round
      const resetPlayers = { ...prev.players };
      Object.keys(resetPlayers).forEach(id => {
        resetPlayers[id] = {
          ...resetPlayers[id],
          currentAnswer: undefined,
          answerTime: undefined,
          fiftyFiftyExcluded: undefined,
        };
      });

      return {
        ...prev,
        status: 'question',
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        players: resetPlayers,
        eliminatedThisRound: [],
        _skillEligiblePlayers: undefined,
      };
    });

    // Auto-transition to answering
    setTimeout(() => {
      setGame(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'answering',
          questionStartTime: Date.now(),
        };
      });
    }, 2000);
  }, [game, isHost, setGame, setGameResults]);

  return {
    submitAnswer,
    revealAnswer,
    nextQuestion,
  };
}
