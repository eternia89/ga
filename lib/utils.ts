import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format an ISO date string as dd-MM-yyyy */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd-MM-yyyy');
}

/** Format an ISO date string as dd-MM-yyyy, HH:mm:ss */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd-MM-yyyy, HH:mm:ss');
}

/** Download a CSV string as a file with a dated filename */
export function downloadCSV(csvContent: string, filenamePrefix: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}-${format(new Date(), 'dd-MM-yyyy')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

/** Parse a formatted IDR string back to a number: "1.500.000" -> 1500000 */
export function parseIDR(formatted: string): number {
  const digits = formatted.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/** Extract error message from next-safe-action result (handles serverError + validationErrors) */
export function extractActionError(result: Record<string, unknown> | undefined): string | undefined {
  if (!result) return undefined;
  if (result.serverError) return result.serverError as string;
  if (result.validationErrors) {
    // Flatten nested validation errors into a single message
    const errors = result.validationErrors as Record<string, { _errors?: string[] }>;
    const messages: string[] = [];
    for (const key in errors) {
      const fieldErrors = errors[key]?._errors;
      if (fieldErrors?.length) {
        messages.push(`${key}: ${fieldErrors.join(', ')}`);
      }
    }
    return messages.length > 0 ? messages.join('; ') : 'Validation failed';
  }
  return undefined;
}
