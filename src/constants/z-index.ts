// Centralized z-index stacking context constants
// Single source of truth — never hardcode z-index values in CSS or inline styles

export const Z_INDEX = {
  // Base layers
  SIDEBAR: 100,
  HEADER: 100,
  DROPDOWN: 200,

  // Overlay layers
  OVERLAY: 500,
  MODAL: 600,
  TOAST: 700,

  // Floating UI
  FLOATING_BUTTON: 800,
  FLOATING_PANEL: 850,
  TOOLTIP: 900,

  // Critical (above everything)
  SKIP_LINK: 10000,
} as const;

export type ZIndexLayer = keyof typeof Z_INDEX;
