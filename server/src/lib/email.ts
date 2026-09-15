/**
 * Email utility functions for case-insensitive comparison and format validation.
 * Satisfies BR-11, UNIT-07, and UNIT-08.
 */

// RFC 5322 compliant regex for standard email validation
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates whether an email string adheres to valid email format.
 * Rejects empty strings, whitespace, missing local part, missing domain, missing TLD, or spaces.
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") {
    return false;
  }
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) {
    return false;
  }
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Normalizes an email by trimming leading/trailing whitespace and lowercasing.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Compares two email addresses case-insensitively.
 * Returns true if both emails represent the same address (ignoring case and surrounding whitespace).
 */
export function areEmailsEqual(a: unknown, b: unknown): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const trimmedA = a.trim();
  const trimmedB = b.trim();
  if (!trimmedA || !trimmedB) {
    return false;
  }
  return trimmedA.toLowerCase() === trimmedB.toLowerCase();
}

