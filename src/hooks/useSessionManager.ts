import { useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { SessionManager } from '@/lib/security';

/**
 * Hook for automatic session management
 * Handles session extension on user activity and logout on expiration
 */
export function useSessionManager() {
  const { user, logout, extendSession } = useAuth();

  // Track user activity to extend session
  const handleUserActivity = useCallback(() => {
    if (user && SessionManager.isSessionValid()) {
      extendSession();
    }
  }, [user, extendSession]);

  // Check session validity periodically
  const checkSession = useCallback(() => {
    if (user && !SessionManager.isSessionValid()) {
      logout();
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    // Events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity tracking to avoid excessive calls
    let activityTimeout: NodeJS.Timeout | null = null;

    const throttledActivity = () => {
      if (activityTimeout) return;

      activityTimeout = setTimeout(() => {
        handleUserActivity();
        activityTimeout = null;
      }, 30000); // Extend session at most once per 30 seconds
    };

    // Add activity listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    // Check session validity every 5 minutes
    const sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000);

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, throttledActivity);
      });

      clearInterval(sessionCheckInterval);

      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [user, handleUserActivity, checkSession]);

  return {
    isSessionValid: user ? SessionManager.isSessionValid() : false,
    extendSession: handleUserActivity,
  };
}
