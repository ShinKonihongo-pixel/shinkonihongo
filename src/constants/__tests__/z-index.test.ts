// Tests for z-index stacking context constants

import { describe, it, expect } from 'vitest';
import { Z_INDEX } from '../z-index';

describe('Z_INDEX', () => {
  it('has all required layers', () => {
    expect(Z_INDEX.SIDEBAR).toBeDefined();
    expect(Z_INDEX.OVERLAY).toBeDefined();
    expect(Z_INDEX.MODAL).toBeDefined();
    expect(Z_INDEX.TOAST).toBeDefined();
    expect(Z_INDEX.FLOATING_BUTTON).toBeDefined();
    expect(Z_INDEX.TOOLTIP).toBeDefined();
  });

  it('maintains correct stacking order', () => {
    expect(Z_INDEX.SIDEBAR).toBeLessThan(Z_INDEX.OVERLAY);
    expect(Z_INDEX.OVERLAY).toBeLessThan(Z_INDEX.MODAL);
    expect(Z_INDEX.MODAL).toBeLessThan(Z_INDEX.TOAST);
    expect(Z_INDEX.TOAST).toBeLessThan(Z_INDEX.FLOATING_BUTTON);
    expect(Z_INDEX.FLOATING_BUTTON).toBeLessThan(Z_INDEX.TOOLTIP);
    expect(Z_INDEX.TOOLTIP).toBeLessThan(Z_INDEX.SKIP_LINK);
  });

  it('all values are positive integers', () => {
    Object.values(Z_INDEX).forEach(value => {
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    });
  });
});
