// Game draw logic — Question → Answer → Spin → Mark flow

import { useCallback } from 'react';
import type { BingoGame, BingoPlayer } from '../../types/bingo-game';
import type { UseBingoGameProps, BingoGameState } from './types';

/** Mark a drawn number for all players and update their stats */
function markNumberForAllPlayers(
  players: Record<string, BingoPlayer>,
  drawnNumber: number
): Record<string, BingoPlayer> {
  const newPlayers: Record<string, BingoPlayer> = {};

  Object.entries(players).forEach(([id, player]) => {
    const updatedRows = player.rows.map(row => {
      const updatedCells = row.cells.map(cell => {
        if (cell.number === drawnNumber && !cell.marked) {
          return { ...cell, marked: true };
        }
        return cell;
      });
      return {
        ...row,
        cells: updatedCells,
        isComplete: updatedCells.every(c => c.marked),
      };
    });

    const markedCount = updatedRows.reduce(
      (sum, row) => sum + row.cells.filter(c => c.marked).length, 0
    );
    const completedRows = updatedRows.filter(r => r.isComplete).length;
    const canBingo = completedRows > 0 && !player.hasBingoed;

    // Decrease luck turns
    let newLuckBonus = player.luckBonus;
    let newLuckTurns = player.luckTurnsLeft;
    if (player.luckTurnsLeft > 0) {
      newLuckTurns--;
      if (newLuckTurns === 0) newLuckBonus = 1.0;
    }

    newPlayers[id] = {
      ...player,
      rows: updatedRows,
      markedCount,
      completedRows,
      canBingo,
      isBlocked: false,
      luckBonus: newLuckBonus,
      luckTurnsLeft: newLuckTurns,
    };
  });

  return newPlayers;
}

export function useGameDraw(
  state: BingoGameState,
  setGame: (updater: (prev: BingoGame | null) => BingoGame | null) => void,
  _setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  currentUser: UseBingoGameProps['currentUser'],
  _currentPlayer: BingoPlayer | undefined
) {
  // 1. Host starts a question round
  const startQuestion = useCallback(() => {
    if (!state.game || state.game.status !== 'playing') return;

    setGame(prev => {
      if (!prev) return null;
      const nextIdx = prev.currentQuestionIndex + 1;
      if (nextIdx >= prev.questions.length) return prev; // No more questions

      return {
        ...prev,
        status: 'question_phase',
        currentQuestionIndex: nextIdx,
        currentQuestionAnswers: {},
        correctAnswerPlayerId: null,
      };
    });
  }, [state.game, setGame]);

  // 2. Player submits an answer
  const submitAnswer = useCallback((selectedIndex: number) => {
    if (!state.game || state.game.status !== 'question_phase') return;

    setGame(prev => {
      if (!prev) return null;
      // Already answered
      if (prev.currentQuestionAnswers[currentUser.id]) return prev;

      const question = prev.questions[prev.currentQuestionIndex];
      if (!question) return prev;

      const correct = selectedIndex === question.correctIndex;
      const newAnswers = {
        ...prev.currentQuestionAnswers,
        [currentUser.id]: {
          selectedIndex,
          correct,
          answeredAt: Date.now(),
        },
      };

      // Update player stats
      const newPlayers = { ...prev.players };
      if (newPlayers[currentUser.id]) {
        newPlayers[currentUser.id] = {
          ...newPlayers[currentUser.id],
          totalAnswers: newPlayers[currentUser.id].totalAnswers + 1,
          correctAnswers: newPlayers[currentUser.id].correctAnswers + (correct ? 1 : 0),
        };
      }

      return {
        ...prev,
        currentQuestionAnswers: newAnswers,
        players: newPlayers,
      };
    });
  }, [state.game, currentUser.id, setGame]);

  // 3. Host reveals answer and triggers spin (if someone got it right)
  const revealAndSpin = useCallback(() => {
    if (!state.game || state.game.status !== 'question_phase') return;

    setGame(prev => {
      if (!prev) return null;

      // Find fastest correct answerer
      const correctAnswers = Object.entries(prev.currentQuestionAnswers)
        .filter(([, a]) => a.correct)
        .sort((a, b) => a[1].answeredAt - b[1].answeredAt);

      const newTurn = prev.currentTurn + 1;

      if (correctAnswers.length === 0) {
        // No correct answers → skip spin, go back to playing
        return {
          ...prev,
          currentTurn: newTurn,
          status: 'playing',
          correctAnswerPlayerId: null,
        };
      }

      const winnerId = correctAnswers[0][0];

      // Pick a random number for the spin
      if (prev.availableNumbers.length === 0) {
        return { ...prev, currentTurn: newTurn, status: 'playing', correctAnswerPlayerId: winnerId };
      }

      // Apply luck bonus for the winner
      const winnerPlayer = prev.players[winnerId];
      const luckBonus = winnerPlayer?.luckBonus || 1.0;
      let drawnNumber: number;

      // Find numbers that would benefit the winner
      const beneficialNumbers = new Set<number>();
      winnerPlayer?.rows.forEach(row => {
        row.cells.forEach(cell => {
          if (!cell.marked) beneficialNumbers.add(cell.number);
        });
      });

      if (luckBonus > 1 && Math.random() < (luckBonus - 1)) {
        const lucky = prev.availableNumbers.filter(n => beneficialNumbers.has(n));
        drawnNumber = lucky.length > 0
          ? lucky[Math.floor(Math.random() * lucky.length)]
          : prev.availableNumbers[Math.floor(Math.random() * prev.availableNumbers.length)];
      } else {
        drawnNumber = prev.availableNumbers[Math.floor(Math.random() * prev.availableNumbers.length)];
      }

      // Remove from available
      const newAvailable = prev.availableNumbers.filter(n => n !== drawnNumber);

      // Mark number for all players
      const newPlayers = markNumberForAllPlayers(prev.players, drawnNumber);

      // Add to drawn history
      const winnerName = prev.players[winnerId]?.displayName || 'Player';
      const newDrawn = {
        number: drawnNumber,
        drawerId: winnerId,
        drawerName: winnerName,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        availableNumbers: newAvailable,
        drawnNumbers: [...prev.drawnNumbers, newDrawn],
        lastDrawnNumber: drawnNumber,
        players: newPlayers,
        currentTurn: newTurn,
        currentDrawerId: winnerId,
        correctAnswerPlayerId: winnerId,
        status: 'spin_phase',
      };
    });
  }, [state.game, setGame]);

  // 4. After spin animation completes — check if skill phase is due
  const completeSpin = useCallback(() => {
    if (!state.game || state.game.status !== 'spin_phase') return;

    setGame(prev => {
      if (!prev) return null;

      const isSkillTime = prev.currentTurn % prev.settings.skillInterval === 0
        && prev.settings.skillsEnabled
        && prev.correctAnswerPlayerId;

      if (isSkillTime && prev.correctAnswerPlayerId) {
        // Only the correct answerer gets skill
        const newPlayers = { ...prev.players };
        if (newPlayers[prev.correctAnswerPlayerId]) {
          newPlayers[prev.correctAnswerPlayerId] = {
            ...newPlayers[prev.correctAnswerPlayerId],
            hasSkillAvailable: true,
          };
        }
        return { ...prev, players: newPlayers, status: 'skill_phase' };
      }

      return { ...prev, status: 'playing' };
    });
  }, [state.game, setGame]);

  return { startQuestion, submitAnswer, revealAndSpin, completeSpin };
}
