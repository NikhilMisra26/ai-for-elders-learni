import { useEffect, useCallback } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook for automatic session management
 * Handles session extension on user activity and logout on expiration
 */
export function useSessionManager(): {
  isSessionValid: boolean;
  extendSession: () => void;
} {
  const { user, logout, extendSession } = useAuth();

  // Track user activity to extend session
  const handleUserActivity = useCallback((): void => {
    if (user) extendSession();
  }, [user, extendSession]);

  // Check session validity periodically
  const checkSession = useCallback((): void => {
    if (!user) return;
    // Check Supabase session validity
    void supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      if (!hasSession) void logout();
    });
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;
    if (typeof document === 'undefined' || typeof window === 'undefined')
      return;

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
    let activityTimeout: number | null = null;

    const throttledActivity = (): void => {
      if (activityTimeout) return;

      activityTimeout = window.setTimeout(() => {
        handleUserActivity();
        activityTimeout = null;
      }, 30000); // Extend session at most once per 30 seconds
    };

    // Add activity listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, throttledActivity, { passive: true });
    });

    // Check session validity every 5 minutes
    const sessionCheckInterval = window.setInterval(
      checkSession,
      5 * 60 * 1000,
    );

    // Cleanup
    return (): void => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, throttledActivity);
      });

      window.clearInterval(sessionCheckInterval);

      if (activityTimeout) {
        window.clearTimeout(activityTimeout);
      }
    };
  }, [user, handleUserActivity, checkSession]);

  return {
    isSessionValid: !!user,
    extendSession: handleUserActivity,
  };
}
