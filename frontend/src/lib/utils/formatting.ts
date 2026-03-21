/**
 * Utility functions for formatting display values.
 * Pure functions with no side effects.
 */

/**
 * Format latency in milliseconds to human-readable string.
 * @param ms Milliseconds
 * @returns Formatted string (e.g., "124ms", "2.3s")
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format similarity score to percentage string.
 * @param score Score between 0 and 1
 * @returns Formatted string (e.g., "0.87 (87%)")
 */
export function formatScore(score: number): string {
  const percentage = Math.round(score * 100);
  return `${score.toFixed(2)} (${percentage}%)`;
}

/**
 * Truncate text to maximum length with ellipsis.
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text or original if shorter
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format byte size to human-readable string.
 * @param bytes Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format date to relative time string.
 * @param date Date to format
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}
