import { useEffect, useState } from 'react';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

// Simple key-value hook backed by localStorage with JSON serialization.
export function useKV<T>(key: string, initial: T): [T, Setter<T>] {
  const storage = (globalThis as unknown as { localStorage?: Storage })
    .localStorage;
  const isBrowser = !!storage;

  const read = (): T => {
    if (!isBrowser) return initial;
    try {
      const raw = storage?.getItem(key) ?? null;
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  };

  const [state, setState] = useState<T>(read);

  useEffect(() => {
    if (!isBrowser || !storage) return;
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch {
      // no-op if storage fails
    }
  }, [key, state, isBrowser, storage]);

  return [state, setState];
}
