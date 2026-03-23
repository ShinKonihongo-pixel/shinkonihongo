// Kanji radical decomposition — delegates to KRADFILE data (1620 kanji, EDRDG source)
import { getKradDecomposition } from './krad-decomposition';

/** Look up radical decomposition for a kanji character */
export function getDecomposition(character: string): string[] | null {
  return getKradDecomposition(character);
}
