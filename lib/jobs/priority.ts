/**
 * Priority ordering for jobs — extracted for testability.
 * Used by job-actions.ts to auto-calculate job priority from linked requests.
 */
export const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'] as const;

/**
 * Returns the highest priority from an array of priority strings.
 * Null/undefined values are skipped. Returns 'low' if no valid priorities.
 */
export function highestPriority(priorities: (string | null | undefined)[]): string {
  let maxIndex = -1;
  for (const p of priorities) {
    if (!p) continue;
    const idx = PRIORITY_ORDER.indexOf(p as typeof PRIORITY_ORDER[number]);
    if (idx > maxIndex) maxIndex = idx;
  }
  return maxIndex >= 0 ? PRIORITY_ORDER[maxIndex] : 'low';
}
