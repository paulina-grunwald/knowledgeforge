/**
 * Hook to debounce a value. Useful for search inputs and other high-frequency updates.
 */

import { useEffect, useState } from "react";

/**
 * Debounces a value, returning the debounced version.
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 500);
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     queryAPI(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
