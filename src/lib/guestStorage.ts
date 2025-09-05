// Safe localStorage wrapper with JSON handling
export function getGuestStorageKey(guestId: string, key: string): string {
  return `guest:${guestId}:${key}`;
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

export function getFromGuestStorage<T>(guestId: string, key: string, fallback: T): T {
  const storageKey = getGuestStorageKey(guestId, key);
  const value = localStorage.getItem(storageKey);
  return safeJsonParse(value, fallback);
}

export function setToGuestStorage(guestId: string, key: string, value: unknown): void {
  const storageKey = getGuestStorageKey(guestId, key);
  localStorage.setItem(storageKey, safeJsonStringify(value));
}

export function removeFromGuestStorage(guestId: string, key: string): void {
  const storageKey = getGuestStorageKey(guestId, key);
  localStorage.removeItem(storageKey);
}
