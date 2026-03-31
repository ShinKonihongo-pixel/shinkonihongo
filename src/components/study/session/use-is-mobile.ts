// Shared hook to detect mobile viewport — uses useSyncExternalStore
// for a single global listener instead of one resize handler per component
import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

let currentIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
const listeners = new Set<() => void>();

function handleResize() {
  const newValue = window.innerWidth <= MOBILE_BREAKPOINT;
  if (newValue !== currentIsMobile) {
    currentIsMobile = newValue;
    listeners.forEach(cb => cb());
  }
}

// Lazy-attach the single global listener
let attached = false;
function subscribe(callback: () => void): () => void {
  if (!attached) {
    window.addEventListener('resize', handleResize);
    attached = true;
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): boolean {
  return currentIsMobile;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}
