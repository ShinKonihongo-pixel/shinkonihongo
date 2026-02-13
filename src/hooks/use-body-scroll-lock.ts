// Locks body scroll when a modal/overlay is mounted.
// Restores original overflow on unmount. Supports nested modals via ref counting.

import { useEffect } from 'react';

let lockCount = 0;

export function useBodyScrollLock() {
  useEffect(() => {
    lockCount++;
    if (lockCount === 1) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, []);
}
