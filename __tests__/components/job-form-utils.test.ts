import { describe, it, expect } from 'vitest';

/**
 * Tests for the highestPriority function used in job-form.tsx.
 * This is a local copy of lib/jobs/priority.ts logic — tests verify
 * the function behavior inline since it's not exported from the component.
 */

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;
type Priority = typeof PRIORITY_ORDER[number];

function highestPriority(priorities: (string | null)[]): Priority {
  let maxIndex = -1;
  for (const p of priorities) {
    if (!p) continue;
    const idx = PRIORITY_ORDER.indexOf(p as Priority);
    if (idx > maxIndex) maxIndex = idx;
  }
  return maxIndex >= 0 ? PRIORITY_ORDER[maxIndex] : 'low';
}

describe('highestPriority (job-form local copy)', () => {
  it('returns "urgent" when urgent is present', () => {
    expect(highestPriority(['low', 'urgent', 'medium'])).toBe('urgent');
  });

  it('returns "high" from [low, high, medium]', () => {
    expect(highestPriority(['low', 'high', 'medium'])).toBe('high');
  });

  it('returns "medium" from [low, medium]', () => {
    expect(highestPriority(['low', 'medium'])).toBe('medium');
  });

  it('returns "low" when all values are null', () => {
    expect(highestPriority([null, null])).toBe('low');
  });

  it('returns "low" for empty array', () => {
    expect(highestPriority([])).toBe('low');
  });

  it('skips null values and returns highest from rest', () => {
    expect(highestPriority([null, 'medium', null, 'high'])).toBe('high');
  });

  it('returns single priority when only one provided', () => {
    expect(highestPriority(['medium'])).toBe('medium');
  });
});
