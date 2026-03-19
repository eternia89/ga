import { describe, it, expect } from 'vitest';
import { assertNotStale } from '@/lib/utils/optimistic-lock';

describe('assertNotStale', () => {
  const STALE_ERROR = 'This record was modified by another user. Please refresh the page and re-apply your changes.';

  it('passes when providedAt is undefined (no check)', () => {
    expect(() => assertNotStale(undefined, '2026-03-18T04:00:00.000Z')).not.toThrow();
  });

  it('passes when timestamps match exactly', () => {
    const timestamp = '2026-03-18T04:00:00.000Z';
    expect(() => assertNotStale(timestamp, timestamp)).not.toThrow();
  });

  it('throws when timestamps differ (stale write)', () => {
    const formLoaded = '2026-03-18T04:00:00.000Z';
    const otherUserSaved = '2026-03-18T04:05:00.000Z';
    expect(() => assertNotStale(formLoaded, otherUserSaved)).toThrow(STALE_ERROR);
  });

  it('throws with exact error message', () => {
    expect(() => assertNotStale('old', 'new')).toThrow(STALE_ERROR);
  });

  it('passes when providedAt is empty string (falsy, no check)', () => {
    // Empty string is falsy in JS, so the check is skipped
    expect(() => assertNotStale('', '2026-03-18T04:00:00.000Z')).not.toThrow();
  });

  it('is case-sensitive (ISO timestamps are always consistent)', () => {
    // Same time but different format → should throw (timestamps must be exact match)
    const isoFormat = '2026-03-18T04:00:00.000Z';
    const differentPrecision = '2026-03-18T04:00:00Z';
    expect(() => assertNotStale(isoFormat, differentPrecision)).toThrow(STALE_ERROR);
  });
});
