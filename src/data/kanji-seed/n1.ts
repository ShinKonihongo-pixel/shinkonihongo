// JLPT N1 Kanji seed data - combined from 3 parts (~600+ kanji)
import type { KanjiSeed } from './n5';
import { N1_KANJI_PART1 } from './n1-part1';
import { N1_KANJI_PART2 } from './n1-part2';
import { N1_KANJI_PART3 } from './n1-part3';

export const N1_KANJI: KanjiSeed[] = [
  ...N1_KANJI_PART1,
  ...N1_KANJI_PART2,
  ...N1_KANJI_PART3,
];
