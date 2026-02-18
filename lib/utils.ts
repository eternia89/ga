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
