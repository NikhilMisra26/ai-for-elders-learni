import { useEffect, useState } from 'react';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

// Simple key-value hook backed by localStorage with JSON serialization.
export function useKV<T>(key: string, initial: T): [T, Setter<T>] {
  const isBrowser = typeof window !== 'undefined' && !!window.localStorage;

  const read = (): T => {
    if (!isBrowser) return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  };

  const [state, setState] = useState<T>(read);

  useEffect(() => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // no-op if storage fails
    }
  }, [key, state, isBrowser]);

  return [state, setState];
}
