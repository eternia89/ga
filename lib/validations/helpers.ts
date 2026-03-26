import { z } from 'zod';

/**
 * Zod schema for YYYY-MM-DD date strings.
 * Use with .optional(), .nullable() chains as needed at the call site.
 */
export function isoDateString(message = 'Invalid date format (expected YYYY-MM-DD)') {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);
}

/**
 * Optional UUID field that accepts valid UUIDs, empty strings, null, or undefined.
 * Empty strings and null are normalized to null for DB storage.
 */
export function optionalUuid(message = 'Must be a valid ID') {
  return z.string().uuid(message)
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform(val => val || null);
}
