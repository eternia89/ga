import { z } from 'zod';

/**
 * Zod schema for YYYY-MM-DD date strings.
 * Use with .optional(), .nullable() chains as needed at the call site.
 */
export function isoDateString(message = 'Invalid date format (expected YYYY-MM-DD)') {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);
}
