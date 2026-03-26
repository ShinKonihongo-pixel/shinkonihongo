// Lazy loader for krad-decomposition data (1640 LOC / ~50KB)
// Use this instead of direct import when decomposition is not needed immediately

let cachedData: Record<string, string[]> | null = null;

// Load krad decomposition data on demand (cached after first load)
export async function loadKradDecomposition(): Promise<Record<string, string[]>> {
  if (cachedData) return cachedData;
  const mod = await import('./krad-decomposition');
  cachedData = mod.KRAD_DECOMPOSITION;
  return cachedData;
}

// Synchronous access — returns null if not yet loaded
export function getKradDecompositionSync(character: string): string[] | null {
  if (!cachedData) return null;
  return cachedData[character] || null;
}

// Check if data has been loaded
export function isKradLoaded(): boolean {
  return cachedData !== null;
}
