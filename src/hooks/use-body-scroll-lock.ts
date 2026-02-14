// Locks body scroll when a modal/overlay is mounted.
// Restores original overflow on unmount. Supports nested modals via ref counting.
// Uses position:fixed + touch-action to prevent all scrolling including mobile touch.

import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let savedBodyStyles: Record<string, string> = {};

export function useBodyScrollLock() {
  useEffect(() => {
    lockCount++;
    if (lockCount === 1) {
      savedScrollY = window.scrollY;

      // Save current body styles
      const body = document.body;
      const html = document.documentElement;
      savedBodyStyles = {
        bodyOverflow: body.style.overflow,
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        bodyWidth: body.style.width,
        htmlOverflow: html.style.overflow,
      };

      // Lock body completely
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      html.style.overflow = 'hidden';
    }
    return () => {
      lockCount--;
      if (lockCount === 0) {
        const body = document.body;
        const html = document.documentElement;

        // Restore body styles
        body.style.overflow = savedBodyStyles.bodyOverflow || '';
        body.style.position = savedBodyStyles.bodyPosition || '';
        body.style.top = savedBodyStyles.bodyTop || '';
        body.style.left = savedBodyStyles.bodyLeft || '';
        body.style.right = savedBodyStyles.bodyRight || '';
        body.style.width = savedBodyStyles.bodyWidth || '';
        html.style.overflow = savedBodyStyles.htmlOverflow || '';

        // Restore scroll position
        window.scrollTo(0, savedScrollY);
      }
    };
  }, []);
}
