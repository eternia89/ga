import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Convert empty strings to null for DB inserts (avoids unique constraint violations on optional fields) */
export function emptyToNull<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] === "" || result[key] === undefined) {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}

/** Format a number as IDR currency with dot thousand separators: Rp 1.500.000 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/** Format a number with dot thousand separators (no Rp prefix): 1.500.000 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Extract error message from a next-safe-action result */
export function extractActionError(result: {
  serverError?: string;
  validationErrors?: Record<string, { _errors?: string[] } | undefined>;
  data?: unknown;
}): string | null {
  if (result.serverError) return result.serverError;
  if (result.validationErrors) {
    const messages = Object.values(result.validationErrors)
      .flatMap((v) => v?._errors ?? []);
    if (messages.length) return messages.join(", ");
  }
  return null;
}

/** Parse a formatted IDR string back to a number: "1.500.000" -> 1500000 */
export function parseIDR(formatted: string): number {
  const digits = formatted.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
