/**
 * Password breach detection using HaveIBeenPwned API
 * Implements k-anonymity model for secure password checking
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

import { normalizeError } from './errorNormalization';
import { SecurityLogger } from './security';

interface BreachCheckResult {
  isBreached: boolean;
  occurrences: number;
  checkedAt: number;
}

// Cache for recent breach checks (expires after 1 hour)
const breachCache = new Map<string, BreachCheckResult>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Converts a string to SHA-1 hash using Web Crypto API
 */
async function sha1Hash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

/**
 * Cleans up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of breachCache.entries()) {
    if (now - value.checkedAt > CACHE_DURATION) {
      breachCache.delete(key);
    }
  }
}

/**
 * Checks if a password has been exposed in data breaches using HaveIBeenPwned API
 * Uses k-anonymity model - only sends first 5 characters of hash to API
 *
 * @param password - The password to check
 * @returns Promise with breach status and occurrence count
 */
export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  try {
    // Clean up old cache entries periodically
    if (breachCache.size > 100) {
      cleanupCache();
    }

    // Generate SHA-1 hash of the password
    const passwordHash = await sha1Hash(password);

    // Check cache first
    const cached = breachCache.get(passwordHash);
    if (cached && Date.now() - cached.checkedAt < CACHE_DURATION) {
      return cached;
    }

    // k-anonymity: send only first 5 characters
    const hashPrefix = passwordHash.substring(0, 5);
    const hashSuffix = passwordHash.substring(5);

    // Call HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
      headers: {
        'Add-Padding': 'true', // Adds padding to responses for additional privacy
      },
    });

    if (!response.ok) {
      // If API is down or rate limited, don't block the user
      SecurityLogger.log(
        'hibp_api_error',
        { status: response.status, context: 'password_breach_check' },
        'warning',
      );
      return {
        isBreached: false,
        occurrences: 0,
        checkedAt: Date.now(),
      };
    }

    const text = await response.text();

    // Parse the response (format: HASH_SUFFIX:COUNT)
    const hashes = text.split('\r\n');
    let occurrences = 0;

    for (const line of hashes) {
      const [suffix, count] = line.split(':');
      if (suffix === hashSuffix) {
        occurrences = parseInt(count, 10);
        break;
      }
    }

    const result: BreachCheckResult = {
      isBreached: occurrences > 0,
      occurrences,
      checkedAt: Date.now(),
    };

    // Cache the result
    breachCache.set(passwordHash, result);

    return result;
  } catch (error) {
    // Don't block user registration/login if breach check fails
    normalizeError(error, 'password_breach_check');
    return {
      isBreached: false,
      occurrences: 0,
      checkedAt: Date.now(),
    };
  }
}

/**
 * Formats breach warning message based on occurrence count
 */
export function getBreachWarningMessage(occurrences: number): string {
  if (occurrences === 0) {
    return '';
  }

  if (occurrences > 1000000) {
    return `This password has been exposed in over ${Math.floor(
      occurrences / 1000000,
    )} million data breaches. We strongly recommend choosing a different password.`;
  }

  if (occurrences > 1000) {
    return `This password has been exposed in ${Math.floor(
      occurrences / 1000,
    )}k+ data breaches. Please consider using a more unique password.`;
  }

  if (occurrences > 100) {
    return `This password has appeared in ${occurrences} data breaches. We recommend choosing a stronger password.`;
  }

  return `This password has been found in ${occurrences} data breach${
    occurrences === 1 ? '' : 'es'
  }. Consider using a more secure password.`;
}

/**
 * Checks password breach with user-friendly formatting
 */
export async function checkPasswordWithWarning(password: string): Promise<{
  isBreached: boolean;
  warning: string;
}> {
  const result = await checkPasswordBreach(password);
  return {
    isBreached: result.isBreached,
    warning: result.isBreached ? getBreachWarningMessage(result.occurrences) : '',
  };
}

/**
 * Clears the breach check cache (useful for testing or manual cleanup)
 */
export function clearBreachCache(): void {
  breachCache.clear();
}
