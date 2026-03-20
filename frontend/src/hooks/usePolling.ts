/**
 * Generic polling hook that repeatedly calls a fetch function at specified intervals.
 * Automatically stops when a condition is met or when enabled becomes false.
 */

import { useEffect, useRef, useState } from "react";

interface UsePollingOptions<T> {
  interval: number;
  enabled: boolean;
  stopCondition?: (data: T) => boolean;
  onError?: (error: Error) => void;
  maxAttempts?: number;
}

interface UsePollingResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions<T>
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!options.enabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const poll = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        setData(result);

        if (options.stopCondition?.(result)) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }

        attemptsRef.current++;
        if (
          options.maxAttempts &&
          attemptsRef.current >= options.maxAttempts
        ) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    // Call immediately, then set interval
    poll();
    intervalRef.current = setInterval(poll, options.interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [options.enabled, options.interval, options.stopCondition, options.onError, fetchFn, options.maxAttempts]);

  return { data, loading, error };
}
