// Bot autoplay logic — question-based bingo

import { useEffect } from 'react';
import type { BingoGame, BingoPlayer, BingoPlayerResult, BingoResults, BingoSkillType } from '../../types/bingo-game';
import { BINGO_SKILLS } from '../../types/bingo-game';
import type { BingoGameState, BingoGameRefs } from './types';

export function useBotAutoplay(
  state: BingoGameState,
  setGame: (updater: (prev: BingoGame | null) => BingoGame | null) => void,
  setState: React.Dispatch<React.SetStateAction<BingoGameState>>,
  refs: BingoGameRefs,
  isHost: boolean
) {
  const { botDrawTimerRef } = refs;

  // Bot answers during question_phase
  useEffect(() => {
    if (!state.game || state.game.status !== 'question_phase' || !isHost) return;

    const question = state.game.questions[state.game.currentQuestionIndex];
    if (!question) return;

    const botPlayers = Object.values(state.game.players).filter(p => p.isBot);
    if (botPlayers.length === 0) return;

    const timers: NodeJS.Timeout[] = [];

    botPlayers.forEach(bot => {
      // Random delay 1-4s
      const delay = 1000 + Math.random() * 3000;
      const timer = setTimeout(() => {
        setGame(prev => {
          if (!prev || prev.status !== 'question_phase') return prev;
          if (prev.currentQuestionAnswers[bot.odinhId]) return prev;

          // 40-70% accuracy
          const isCorrect = Math.random() < (0.4 + Math.random() * 0.3);
          const selectedIndex = isCorrect
            ? question.correctIndex
            : [0, 1, 2, 3].filter(i => i !== question.correctIndex)[Math.floor(Math.random() * 3)];

          const newAnswers = {
            ...prev.currentQuestionAnswers,
            [bot.odinhId]: {
              selectedIndex,
              correct: isCorrect,
              answeredAt: Date.now(),
            },
          };

          const newPlayers = { ...prev.players };
          if (newPlayers[bot.odinhId]) {
            newPlayers[bot.odinhId] = {
              ...newPlayers[bot.odinhId],
              totalAnswers: newPlayers[bot.odinhId].totalAnswers + 1,
              correctAnswers: newPlayers[bot.odinhId].correctAnswers + (isCorrect ? 1 : 0),
            };
          }

          return { ...prev, currentQuestionAnswers: newAnswers, players: newPlayers };
        });
      }, delay);
      timers.push(timer);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [state.game?.status, state.game?.currentQuestionIndex, isHost, setGame, state.game]);

  // Bot uses skill during skill_phase
  useEffect(() => {
    if (!state.game || state.game.status !== 'skill_phase' || !isHost) return;

    const botWithSkill = Object.values(state.game.players).find(
      p => p.isBot && p.hasSkillAvailable
    );
    if (!botWithSkill) return;

    const timer = setTimeout(() => {
      setGame(prev => {
        if (!prev || prev.status !== 'skill_phase') return prev;

        const newPlayers = { ...prev.players };
        const bot = newPlayers[botWithSkill.odinhId];
        if (!bot || !bot.hasSkillAvailable) return prev;

        // Pick random skill
        const skillTypes = Object.keys(BINGO_SKILLS) as BingoSkillType[];
        const randomSkill = skillTypes[Math.floor(Math.random() * skillTypes.length)];
        const skill = BINGO_SKILLS[randomSkill];

        // Apply skill
        if (skill.targetOther) {
          const opponents = Object.values(newPlayers).filter(p => p.odinhId !== bot.odinhId);
          if (opponents.length > 0) {
            const target = opponents[Math.floor(Math.random() * opponents.length)];
            if (randomSkill === 'remove_mark') {
              for (const row of target.rows) {
                const markedCell = row.cells.find(c => c.marked);
                if (markedCell) {
                  markedCell.marked = false;
                  row.isComplete = row.cells.every(c => c.marked);
                  target.markedCount--;
                  target.completedRows = target.rows.filter(r => r.isComplete).length;
                  target.canBingo = target.completedRows > 0 && !target.hasBingoed;
                  break;
                }
              }
            } else if (randomSkill === 'block_turn') {
              target.isBlocked = true;
            }
          }
        } else {
          if (randomSkill === 'auto_add') {
            for (const row of bot.rows) {
              const unmarked = row.cells.find(c => !c.marked);
              if (unmarked) {
                unmarked.marked = true;
                row.isComplete = row.cells.every(c => c.marked);
                bot.markedCount++;
                bot.completedRows = bot.rows.filter(r => r.isComplete).length;
                bot.canBingo = bot.completedRows > 0 && !bot.hasBingoed;
                break;
              }
            }
          } else if (randomSkill === 'increase_luck') {
            bot.luckBonus = 1.3;
            bot.luckTurnsLeft = 3;
          } else if (randomSkill === 'fifty_fifty') {
            bot.hasFiftyFifty = true;
          }
        }

        bot.hasSkillAvailable = false;

        // Check if all done
        const allDone = Object.values(newPlayers).every(p => !p.hasSkillAvailable);

        return {
          ...prev,
          players: newPlayers,
          status: allDone ? 'playing' : 'skill_phase',
        };
      });
    }, 1000 + Math.random() * 1000);

    return () => clearTimeout(timer);
  }, [state.game?.status, isHost, setGame, state.game]);

  // Bot claims bingo when eligible
  useEffect(() => {
    if (!state.game || state.game.status !== 'playing' || !isHost) return;

    const botWithBingo = Object.values(state.game.players).find(
      p => p.isBot && p.canBingo && !p.hasBingoed
    );
    if (!botWithBingo) return;

    if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);

    botDrawTimerRef.current = setTimeout(() => {
      if (Math.random() < 0.8) {
        const gameSnapshot = state.game;
        setGame(prev => {
          if (!prev) return null;

          const updatedPlayers = { ...prev.players };
          updatedPlayers[botWithBingo.odinhId] = {
            ...updatedPlayers[botWithBingo.odinhId],
            hasBingoed: true,
          };

          return {
            ...prev,
            players: updatedPlayers,
            status: 'finished',
            winnerId: botWithBingo.odinhId,
            finishedAt: new Date().toISOString(),
          };
        });

        // Generate results for bot win
        setTimeout(() => {
          if (!gameSnapshot) return;

          const rankings: BingoPlayerResult[] = Object.values(gameSnapshot.players)
            .map(p => ({
              odinhId: p.odinhId,
              displayName: p.displayName,
              avatar: p.avatar,
              rank: 0,
              markedCount: p.markedCount,
              completedRows: p.completedRows,
              isWinner: p.odinhId === botWithBingo.odinhId,
            }))
            .sort((a, b) => {
              if (a.isWinner) return -1;
              if (b.isWinner) return 1;
              return b.completedRows - a.completedRows;
            })
            .map((p, idx) => ({ ...p, rank: idx + 1 }));

          const results: BingoResults = {
            gameId: gameSnapshot.id,
            winner: rankings.find(r => r.isWinner) || null,
            rankings,
            totalTurns: gameSnapshot.currentTurn,
            totalPlayers: Object.keys(gameSnapshot.players).length,
            drawnNumbers: gameSnapshot.drawnNumbers.map(d => d.number),
          };

          setState(prev => ({ ...prev, gameResults: results }));
        }, 100);
      }
    }, 2000 + Math.random() * 2000);

    return () => {
      if (botDrawTimerRef.current) clearTimeout(botDrawTimerRef.current);
    };
  }, [state.game, isHost, botDrawTimerRef, setGame, setState]);
}
