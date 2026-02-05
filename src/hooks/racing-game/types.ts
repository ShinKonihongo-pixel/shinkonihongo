// Types and interfaces for racing game hooks
import type { Flashcard } from '../../types/flashcard';

export interface UseRacingGameProps {
  currentUser: {
    id: string;
    displayName: string;
    avatar: string;
    role?: string;
  };
  flashcards?: Flashcard[];
}
