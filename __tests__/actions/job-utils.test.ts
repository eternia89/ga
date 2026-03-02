import { describe, it, expect } from 'vitest';
import { highestPriority, PRIORITY_ORDER } from '@/lib/jobs/priority';

describe('PRIORITY_ORDER', () => {
  it('has 4 priorities in ascending order', () => {
    expect(PRIORITY_ORDER).toEqual(['low', 'medium', 'high', 'urgent']);
  });
});

describe('highestPriority', () => {
  it('returns "high" from [low, high]', () => {
    expect(highestPriority(['low', 'high'])).toBe('high');
  });

  it('returns "medium" from [low, medium]', () => {
    expect(highestPriority(['low', 'medium'])).toBe('medium');
  });

  it('returns "low" when all values are null', () => {
    expect(highestPriority([null, null])).toBe('low');
  });

  it('returns "urgent" from mixed array', () => {
    expect(highestPriority(['urgent', 'low', 'high'])).toBe('urgent');
  });

  it('skips null values and returns highest from rest', () => {
    expect(highestPriority([null, 'medium', null, 'high'])).toBe('high');
  });

  it('returns "low" for empty array', () => {
    expect(highestPriority([])).toBe('low');
  });

  it('returns single priority when only one provided', () => {
    expect(highestPriority(['medium'])).toBe('medium');
  });
});
