/**
 * Input validation and sanitization utilities.
 * All functions are pure with no side effects.
 */

/**
 * Check if string is a valid UUID.
 * @param str String to validate
 * @returns True if valid UUID, false otherwise
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Validate and clamp top_n parameter to valid range.
 * @param n Number to validate
 * @returns Clamped number between 1 and 20
 */
export function validateTopN(n: number | undefined): number {
  if (!n || n < 1) return 5;
  if (n > 20) return 20;
  return Math.floor(n);
}

/**
 * Sanitize string for safe display (prevent XSS).
 * @param str String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Validate corpus name (non-empty, reasonable length).
 * @param name Corpus name to validate
 * @returns Error message if invalid, null if valid
 */
export function validateCorpusName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Corpus name is required";
  }
  if (name.length > 100) {
    return "Corpus name must be less than 100 characters";
  }
  return null;
}

/**
 * Validate concept search query.
 * @param query Search query to validate
 * @returns Error message if invalid, null if valid
 */
export function validateConceptQuery(query: string): string | null {
  if (query.length > 500) {
    return "Query must be less than 500 characters";
  }
  return null;
}

/**
 * Check if array has items.
 * @param arr Array to check
 * @returns True if array has items, false if empty or null
 */
export function hasItems<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Trim and normalize whitespace in string.
 * @param str String to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, " ");
}
