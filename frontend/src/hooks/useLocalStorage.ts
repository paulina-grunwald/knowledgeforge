/**
 * Hook to persist state to localStorage.
 * Syncs with localStorage on mount/unmount and when value changes.
 */

import { useEffect, useState } from "react";

/**
 * Persist a value to localStorage and sync with other tabs.
 *
 * @param key The localStorage key
 * @param initialValue The initial value if key doesn't exist
 * @returns [storedValue, setValue] - like useState
 *
 * @example
 * const [corpusId, setCorpusId] = useLocalStorage("selectedCorpus", "");
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.warn(`useLocalStorage: Failed to read ${key} from localStorage`, error);
    }

    return initialValue;
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`useLocalStorage: Failed to write ${key} to localStorage`, error);
    }
  };

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error) {
          console.warn(`useLocalStorage: Failed to parse storage change for ${key}`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
