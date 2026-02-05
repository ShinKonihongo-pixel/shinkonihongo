// Utility functions for racing game
import type {
  RacingQuestion,
  RacingTeam,
  Trap,
  TrapType,
  QuestionDifficulty,
  SpecialFeatureType,
  TeamColorKey,
} from '../../types/racing-game';
import { TEAM_COLORS } from '../../types/racing-game';
import type { Flashcard } from '../../types/flashcard';

// Generate random 6-digit code
export function generateGameCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Create teams based on count
export function createTeams(count: number): Record<string, RacingTeam> {
  const colorKeys: TeamColorKey[] = ['red', 'blue', 'yellow', 'purple'];
  const teams: Record<string, RacingTeam> = {};

  for (let i = 0; i < count; i++) {
    const colorKey = colorKeys[i];
    const teamColor = TEAM_COLORS[colorKey];
    const teamId = `team-${colorKey}`;
    teams[teamId] = {
      id: teamId,
      name: `Đội ${teamColor.name}`,
      colorKey,
      emoji: teamColor.emoji,
      members: [],
      totalDistance: 0,
      totalPoints: 0,
    };
  }

  return teams;
}

// Generate random trap on track
export function generateRandomTrap(minPosition: number = 20): Trap {
  const trapTypes: TrapType[] = ['imprisonment', 'freeze', 'sinkhole'];
  const trapType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
  const position = minPosition + Math.random() * (80 - minPosition);

  return {
    id: generateId(),
    type: trapType,
    position,
    isActive: true,
  };
}

// Convert flashcards to racing questions
export function convertFlashcardsToQuestions(
  cards: Flashcard[],
  count: number,
  timeLimit: number,
  mysteryBoxFrequency: number,
  milestoneFrequency: number = 5
): RacingQuestion[] {
  const shuffled = shuffleArray(cards).slice(0, count);

  return shuffled.map((card, index) => {
    const questionNum = index + 1;
    const isMysteryBox = questionNum % mysteryBoxFrequency === 0;
    const isMilestone = questionNum % milestoneFrequency === 0 && !isMysteryBox;
    const difficulty: QuestionDifficulty =
      index < count * 0.4 ? 'easy' :
      index < count * 0.7 ? 'medium' : 'hard';

    // Generate wrong options from other cards
    const otherCards = cards.filter(c => c.id !== card.id);
    const wrongOptions = shuffleArray(otherCards)
      .slice(0, 3)
      .map(c => c.meaning);

    const options = shuffleArray([card.meaning, ...wrongOptions]);
    const correctIndex = options.indexOf(card.meaning);

    // Milestone questions have higher bonus
    const baseSpeedBonus = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;
    const speedBonus = isMilestone ? baseSpeedBonus * 2 : baseSpeedBonus;

    const question: RacingQuestion = {
      id: generateId(),
      questionText: card.kanji || card.vocabulary,
      options,
      correctIndex,
      difficulty,
      timeLimit,
      speedBonus,
      isMysteryBox,
      isMilestone,
    };

    if (isMysteryBox) {
      const featureTypes: SpecialFeatureType[] = ['speed_boost', 'shield', 'slow_others', 'double_speed', 'teleport', 'freeze'];
      question.mysteryBox = {
        difficulty,
        reward: featureTypes[Math.floor(Math.random() * featureTypes.length)],
        isOpened: false,
      };
    }

    return question;
  });
}
