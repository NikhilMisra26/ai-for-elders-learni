/**
 * useAccessControl Hook
 *
 * Provides a comprehensive interface for managing content access control
 * throughout the application. Integrates with AccessManager and provides
 * reactive state management for access validation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/lib/subscription';
import {
  accessManager,
  type AccessRequest,
  type AccessResponse,
  type ContentGate,
} from '@/lib/accessControl';
import { SecurityLogger } from '@/lib/security';
import { errorHandler } from '@/lib/errorHandler';

// ========================================================================
// Types and Interfaces
// ========================================================================

interface AccessState {
  isChecking: boolean;
  hasAccess: boolean;
  lastCheck: Date | null;
  response: AccessResponse | null;
  error: string | null;
}

interface AccessControlHook {
  // State
  accessState: AccessState;
  isLoading: boolean;

  // Methods
  checkAccess: (
    resourceId: string,
    resourceType: 'course' | 'module' | 'lesson',
    requiredTier: 'free' | 'advanced' | 'expert',
  ) => Promise<boolean>;
  checkContentAccess: (contentGate: ContentGate) => Promise<boolean>;
  batchCheckAccess: (
    resources: Array<{ id: string; tier: 'free' | 'advanced' | 'expert' }>,
  ) => Promise<Map<string, boolean>>;
  clearCache: () => void;

  // Utilities
  canAccessTier: (tier: 'free' | 'advanced' | 'expert') => boolean;
  getAccessMessage: (tier: 'free' | 'advanced' | 'expert') => string;
  handleAccessDenied: (
    requiredTier: 'free' | 'advanced' | 'expert',
    reason?: string,
  ) => void;
}

interface CachedAccess {
  resourceKey: string;
  hasAccess: boolean;
  timestamp: number;
  response: AccessResponse;
}

// ========================================================================
// Main Hook
// ========================================================================

export function useAccessControl(): AccessControlHook {
  const { user } = useAuth();
  const { subscription, canAccessTier } = useSubscription();

  // State management
  const [accessState, setAccessState] = useState<AccessState>({
    isChecking: false,
    hasAccess: false,
    lastCheck: null,
    response: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Local cache for access checks
  const accessCache = useRef<Map<string, CachedAccess>>(new Map());
  const CACHE_TTL = 60000; // 1 minute

  // ========================================================================
  // Core Methods
  // ========================================================================

  /**
   * Check access for a specific resource
   */
  const checkAccess = useCallback(
    async (
      resourceId: string,
      resourceType: 'course' | 'module' | 'lesson',
      requiredTier: 'free' | 'advanced' | 'expert',
    ): Promise<boolean> => {
      if (!user) {
        setAccessState((prev) => ({
          ...prev,
          hasAccess: false,
          error: 'Authentication required',
        }));
        return false;
      }

      const cacheKey = `${resourceType}:${resourceId}:${requiredTier}`;

      // Check local cache first
      const cached = accessCache.current.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setAccessState({
          isChecking: false,
          hasAccess: cached.hasAccess,
          lastCheck: new Date(cached.timestamp),
          response: cached.response,
          error: null,
        });
        return cached.hasAccess;
      }

      setAccessState((prev) => ({ ...prev, isChecking: true, error: null }));
      setIsLoading(true);

      try {
        const request: AccessRequest = {
          userId: user.id,
          resourceType,
          resourceId,
          requiredTier,
          metadata: {
            subscriptionTier: subscription.planId,
            checkTime: new Date().toISOString(),
          },
        };

        const response = await accessManager.validateAccess(request);

        // Update cache
        accessCache.current.set(cacheKey, {
          resourceKey: cacheKey,
          hasAccess: response.granted,
          timestamp: Date.now(),
          response,
        });

        // Update state
        setAccessState({
          isChecking: false,
          hasAccess: response.granted,
          lastCheck: new Date(),
          response,
          error: null,
        });

        // Log for analytics
        if (!response.granted) {
          SecurityLogger.log(
            'access_check_denied',
            {
              userId: user.id,
              resourceId,
              resourceType,
              requiredTier,
              reason: response.reason,
            },
            'info',
          );
        }

        return response.granted;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Access check failed';

        setAccessState({
          isChecking: false,
          hasAccess: false,
          lastCheck: new Date(),
          response: null,
          error: errorMessage,
        });

        errorHandler.logError(
          'access check failed',
          error instanceof Error ? error : new Error(errorMessage),
          {
            userId: user.id,
            metadata: {
              resourceId,
              resourceType,
            },
          },
        );

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user, subscription.planId],
  );

  /**
   * Check access for content with specific gate requirements
   */
  const checkContentAccess = useCallback(
    async (contentGate: ContentGate): Promise<boolean> => {
      if (!user) return false;

      setIsLoading(true);

      try {
        const response = await accessManager.validateContentAccess(
          user.id,
          contentGate,
        );

        setAccessState({
          isChecking: false,
          hasAccess: response.granted,
          lastCheck: new Date(),
          response,
          error: null,
        });

        return response.granted;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Content access check failed';

        setAccessState((prev) => ({
          ...prev,
          isChecking: false,
          hasAccess: false,
          error: errorMessage,
        }));

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  /**
   * Batch check access for multiple resources
   */
  const batchCheckAccess = useCallback(
    async (
      resources: Array<{ id: string; tier: 'free' | 'advanced' | 'expert' }>,
    ): Promise<Map<string, boolean>> => {
      if (!user) {
        const result = new Map<string, boolean>();
        resources.forEach((r) => result.set(r.id, false));
        return result;
      }

      setIsLoading(true);

      try {
        const accessMap = await accessManager.validateBatchAccess(
          user.id,
          resources,
        );
        const result = new Map<string, boolean>();

        accessMap.forEach((response, resourceId) => {
          result.set(resourceId, response.granted);

          // Update cache for each resource
          const resource = resources.find((r) => r.id === resourceId);
          if (resource) {
            const cacheKey = `course:${resourceId}:${resource.tier}`;
            accessCache.current.set(cacheKey, {
              resourceKey: cacheKey,
              hasAccess: response.granted,
              timestamp: Date.now(),
              response,
            });
          }
        });

        return result;
      } catch (error) {
        errorHandler.logError(
          'Batch access check failed',
          error instanceof Error
            ? error
            : new Error('Batch access check failed'),
        );

        const result = new Map<string, boolean>();
        resources.forEach((r) => result.set(r.id, false));
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [user],
  );

  /**
   * Clear the local access cache
   */
  const clearCache = useCallback((): void => {
    accessCache.current.clear();
    if (user) {
      accessManager.clearUserCache(user.id);
    }

    setAccessState({
      isChecking: false,
      hasAccess: false,
      lastCheck: null,
      response: null,
      error: null,
    });
  }, [user]);

  /**
   * Get user-friendly message for tier requirements
   */
  const getAccessMessage = useCallback(
    (tier: 'free' | 'advanced' | 'expert'): string => {
      const messages = {
        free: 'This content is available to all users',
        advanced: 'Upgrade to Advanced ($1.99/month) to access this content',
        expert: 'Upgrade to Expert ($4.99/month) to access this content',
      };

      return messages[tier];
    },
    [],
  );

  /**
   * Handle access denied scenarios with appropriate user feedback
   */
  const handleAccessDenied = useCallback(
    (requiredTier: 'free' | 'advanced' | 'expert', reason?: string): void => {
      const tierNames = {
        free: 'Free',
        advanced: 'Advanced',
        expert: 'Expert',
      };

      let title = 'Access Denied';
      let description = `This content requires ${tierNames[requiredTier]} tier access.`;

      if (reason === 'expired') {
        title = 'Subscription Expired';
        description =
          'Your subscription has expired. Please renew to continue accessing premium content.';
      } else if (reason === 'grace_period_ended') {
        title = 'Grace Period Ended';
        description =
          'Your grace period has ended. Please update your payment method to continue.';
      } else if (reason === 'tier_mismatch') {
        title = 'Upgrade Required';
        description = getAccessMessage(requiredTier);
      }

      toast.error(title, { description });

      // Log for analytics
      SecurityLogger.log(
        'access_denied_shown',
        {
          requiredTier,
          reason,
          userTier: subscription.planId,
        },
        'info',
      );
    },
    [subscription.planId, getAccessMessage],
  );

  // ========================================================================
  // Effects
  // ========================================================================

  // Clear cache when subscription changes
  useEffect(() => {
    clearCache();
  }, [subscription.planId, clearCache]);

  // Clear cache on user change
  useEffect(() => {
    if (!user) {
      clearCache();
    }
  }, [user, clearCache]);

  // ========================================================================
  // Return
  // ========================================================================

  return {
    accessState,
    isLoading,
    checkAccess,
    checkContentAccess,
    batchCheckAccess,
    clearCache,
    canAccessTier,
    getAccessMessage,
    handleAccessDenied,
  };
}

// ========================================================================
// Additional Hooks
// ========================================================================

/**
 * Hook for checking access to a specific course
 */
export function useCourseAccess(
  courseId: string,
  requiredTier: 'free' | 'advanced' | 'expert',
): {
  hasAccess: boolean;
  isChecking: boolean;
  error: string | null;
} {
  const { checkAccess } = useAccessControl();
  const [state, setState] = useState({
    hasAccess: false,
    isChecking: true,
    error: null as string | null,
  });

  useEffect(() => {
    const validateAccess = async (): Promise<void> => {
      setState((prev) => ({ ...prev, isChecking: true }));

      try {
        const hasAccess = await checkAccess(courseId, 'course', requiredTier);
        setState({
          hasAccess,
          isChecking: false,
          error: null,
        });
      } catch (error) {
        setState({
          hasAccess: false,
          isChecking: false,
          error: error instanceof Error ? error.message : 'Access check failed',
        });
      }
    };

    void validateAccess();
  }, [courseId, requiredTier, checkAccess]);

  return state;
}

/**
 * Hook for checking access to multiple courses at once
 */
export function useMultiCourseAccess(
  courses: Array<{ id: string; tier: 'free' | 'advanced' | 'expert' }>,
): Map<string, boolean> {
  const { batchCheckAccess } = useAccessControl();
  const [accessMap, setAccessMap] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const checkAll = async (): Promise<void> => {
      const results = await batchCheckAccess(courses);
      setAccessMap(results);
    };

    void checkAll();
  }, [courses, batchCheckAccess]);

  return accessMap;
}
