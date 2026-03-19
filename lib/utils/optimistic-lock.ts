/**
 * Optimistic locking utility for concurrent edit protection.
 *
 * Compares the client's `updated_at` timestamp (captured when the form loaded)
 * against the current database value. If they don't match, another user modified
 * the record between load and save — reject the stale write.
 *
 * @param providedAt - The `updated_at` timestamp from the client form (optional — skips check if undefined)
 * @param currentAt - The current `updated_at` timestamp from the database
 * @throws Error if timestamps don't match (stale write detected)
 */
export function assertNotStale(providedAt: string | undefined, currentAt: string): void {
  if (providedAt && currentAt !== providedAt) {
    throw new Error('This record was modified by another user. Please refresh the page and re-apply your changes.');
  }
}
