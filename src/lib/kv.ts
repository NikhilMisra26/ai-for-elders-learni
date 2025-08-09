import { useEffect, useState } from 'react';

import { errorHandler } from './errorHandler';

type Setter<T> = (value: T | ((prev: T) => T)) => void;

// Simple key-value hook backed by localStorage with JSON serialization.
export function useKV<T>(key: string, initial: T): [T, Setter<T>] {
  const storage = globalThis.localStorage;
  const isBrowser = !!storage;

  const read = (): T => {
    if (!isBrowser) return initial;
    try {
      const raw = storage?.getItem(key) ?? null;
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch (error) {
      errorHandler.handleStorageError(
        'read from localStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          metadata: {
            key,
            hasRawValue: !!storage?.getItem(key),
            storageAvailable: !!storage,
          },
        },
      );
      return initial;
    }
  };

  const [state, setState] = useState<T>(read);

  useEffect(() => {
    if (!isBrowser || !storage) return;
    try {
      storage.setItem(key, JSON.stringify(state));
    } catch (error) {
      errorHandler.handleStorageError(
        'write to localStorage',
        error instanceof Error ? error : new Error(String(error)),
        {
          metadata: {
            key,
            stateType: typeof state,
            storageAvailable: !!storage,
            quotaExceeded:
              error instanceof Error && error.name === 'QuotaExceededError',
          },
        },
      );
    }
  }, [key, state, isBrowser, storage]);

  return [state, setState];
}
