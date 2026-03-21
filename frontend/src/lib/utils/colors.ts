/**
 * Utility functions for Tailwind color classes.
 * Returns appropriate color classes based on values.
 */

/**
 * Get Tailwind color class based on similarity score.
 * @param score Score between 0 and 1
 * @returns Tailwind background color class
 */
export function getScoreColor(score: number): string {
  if (score >= 0.8) {
    return "bg-green-100";
  }
  if (score >= 0.5) {
    return "bg-yellow-100";
  }
  return "bg-red-100";
}

/**
 * Get Tailwind text color class based on similarity score.
 * @param score Score between 0 and 1
 * @returns Tailwind text color class
 */
export function getScoreTextColor(score: number): string {
  if (score >= 0.8) {
    return "text-green-700";
  }
  if (score >= 0.5) {
    return "text-yellow-700";
  }
  return "text-red-700";
}

/**
 * Get Tailwind color class based on latency.
 * @param ms Milliseconds
 * @returns Tailwind background color class
 */
export function getLatencyColor(ms: number): string {
  if (ms < 100) {
    return "bg-green-100";
  }
  if (ms < 3000) {
    return "bg-yellow-100";
  }
  return "bg-red-100";
}

/**
 * Get Tailwind text color class based on latency.
 * @param ms Milliseconds
 * @returns Tailwind text color class
 */
export function getLatencyTextColor(ms: number): string {
  if (ms < 100) {
    return "text-green-700";
  }
  if (ms < 3000) {
    return "text-yellow-700";
  }
  return "text-red-700";
}

/**
 * Get Tailwind color class based on retrieval method.
 * @param method Retrieval method
 * @returns Tailwind background color class
 */
export function getMethodColor(method: "semantic" | "lexical" | "fused"): string {
  switch (method) {
    case "semantic":
      return "bg-blue-100";
    case "lexical":
      return "bg-orange-100";
    case "fused":
      return "bg-purple-100";
  }
}

/**
 * Get Tailwind text color class based on retrieval method.
 * @param method Retrieval method
 * @returns Tailwind text color class
 */
export function getMethodTextColor(method: "semantic" | "lexical" | "fused"): string {
  switch (method) {
    case "semantic":
      return "text-blue-700";
    case "lexical":
      return "text-orange-700";
    case "fused":
      return "text-purple-700";
  }
}

/**
 * Get Tailwind color class for status badge.
 * @param status Status string
 * @returns Tailwind background color class
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "ready":
    case "done":
      return "bg-green-100";
    case "processing":
    case "ingesting":
      return "bg-blue-100";
    case "pending":
    case "waiting":
      return "bg-yellow-100";
    case "failed":
    case "error":
      return "bg-red-100";
    default:
      return "bg-gray-100";
  }
}

/**
 * Get Tailwind text color class for status.
 * @param status Status string
 * @returns Tailwind text color class
 */
export function getStatusTextColor(status: string): string {
  switch (status.toLowerCase()) {
    case "ready":
    case "done":
      return "text-green-700";
    case "processing":
    case "ingesting":
      return "text-blue-700";
    case "pending":
    case "waiting":
      return "text-yellow-700";
    case "failed":
    case "error":
      return "text-red-700";
    default:
      return "text-gray-700";
  }
}
