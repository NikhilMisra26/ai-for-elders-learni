// Manages guest identity for local progress tracking
export function getOrCreateGuestId(): string {
  const STORAGE_KEY = 'guest_id';
  let guestId = localStorage.getItem(STORAGE_KEY);

  if (!guestId) {
    // Generate cryptographically secure UUID v4
    guestId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, guestId);
  }

  return guestId;
}

export function clearGuestId(): void {
  localStorage.removeItem('guest_id');
  // Clear all guest-prefixed keys
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('guest:')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
