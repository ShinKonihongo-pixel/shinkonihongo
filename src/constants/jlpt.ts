// Unified JLPT level constants - single source of truth
// All files should import from here instead of defining locally

import type { JLPTLevel } from '../types/flashcard';

/** Standard JLPT levels (no BT) */
export const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

/** JLPT levels including BT (supplementary) */
export const JLPT_LEVELS_WITH_BT: JLPTLevel[] = ['BT', 'N5', 'N4', 'N3', 'N2', 'N1'];

/** Labeled JLPT levels for dropdowns/selectors (Vietnamese) */
export const JLPT_LEVELS_LABELED: { value: JLPTLevel; label: string }[] = [
  { value: 'N5', label: 'N5 (Sơ cấp)' },
  { value: 'N4', label: 'N4' },
  { value: 'N3', label: 'N3' },
  { value: 'N2', label: 'N2' },
  { value: 'N1', label: 'N1 (Cao cấp)' },
];
