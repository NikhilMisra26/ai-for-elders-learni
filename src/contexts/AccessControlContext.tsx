/**
 * AccessControlContext
 *
 * Global context provider for managing content access control across the application.
 * Provides centralized access validation, caching, and subscription management.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/lib/subscription';
import {
  accessManager,
  type AccessResponse,
  type ContentGate,
} from '@/lib/accessControl';
import { SecurityLogger } from '@/lib/security';
import type { Tier } from '@/lib/db';

// ========================================================================
// Types and Interfaces
// ========================================================================

interface AccessControlContextType {
  // Current user's access state
  userTier: Tier;
  isSubscriptionActive: boolean;

  // Access validation methods
  validateAccess: (
    courseId: string,
    moduleId?: string,
  ) => Promise<AccessResponse>;
  validateTierAccess: (requiredTier: Tier) => boolean;
  validateContentGate: (gate: ContentGate) => Promise<AccessResponse>;

  // Batch operations
  validateMultipleResources: (
    resources: Array<{ id: string; tier: Tier }>,
  ) => Promise<Map<string, boolean>>;

  // Cache management
  invalidateAccessCache: () => void;
  refreshAccessState: () => Promise<void>;

  // UI helpers
  getUpgradeMessage: (requiredTier: Tier) => string;
  getTierDisplayName: (tier: Tier) => string;
  getTierPrice: (tier: Tier) => string;

  // State
  isValidating: boolean;
  lastValidation: Date | null;
  validationErrors: Map<string, string>;
}

type AccessCache = Record<
  string,
  {
    response: AccessResponse;
    timestamp: number;
  }
>;

// ========================================================================
// Context Creation
// ========================================================================

const AccessControlContext = createContext<
  AccessControlContextType | undefined
>(undefined);

// ========================================================================
// Provider Component
// ========================================================================

interface AccessControlProviderProps {
  children: ReactNode;
}

export function AccessControlProvider({
  children,
}: AccessControlProviderProps): React.ReactElement {
  const { user } = useAuth();
  const { subscription, canAccessTier } = useSubscription();

  // State management
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [validationErrors] = useState<Map<string, string>>(new Map());
  const [accessCache, setAccessCache] = useState<AccessCache>({});

  const CACHE_DURATION = 60000; // 1 minute cache

  // ========================================================================
  // Core Validation Methods
  // ========================================================================

  /**
   * Validate access to a course or module
   */
  const validateAccess = useCallback(
    async (courseId: string, moduleId?: string): Promise<AccessResponse> => {
      if (!user) {
        return {
          granted: false,
          reason: 'invalid',
          message: 'Authentication required',
        };
      }

      const cacheKey = `${courseId}:${moduleId ?? 'course'}`;
      const cached = accessCache[cacheKey];

      // Return cached response if valid
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.response;
      }

      setIsValidating(true);

      try {
        // Determine required tier based on course ID
        const requiredTier = getRequiredTier(courseId);

        const gate: ContentGate = {
          courseId,
          moduleId,
          requiredTier,
          enforceServerSide: true,
        };

        const response = await accessManager.validateContentAccess(
          user.id,
          gate,
        );

        // Update cache
        setAccessCache((prev) => ({
          ...prev,
          [cacheKey]: {
            response,
            timestamp: Date.now(),
          },
        }));

        setLastValidation(new Date());

        // Log validation result
        SecurityLogger.log(
          'content_validation',
          {
            userId: user.id,
            courseId,
            moduleId,
            granted: response.granted,
            reason: response.reason,
          },
          response.granted ? 'info' : 'warning',
        );

        return response;
      } catch (error) {
        const errorResponse: AccessResponse = {
          granted: false,
          reason: 'invalid',
          message: 'Validation failed. Please try again.',
        };

        validationErrors.set(
          cacheKey,
          error instanceof Error ? error.message : 'Unknown error',
        );

        return errorResponse;
      } finally {
        setIsValidating(false);
      }
    },
    [user, accessCache, validationErrors],
  );

  /**
   * Simple tier validation without server call
   */
  const validateTierAccess = useCallback(
    (requiredTier: Tier): boolean => {
      return canAccessTier(requiredTier);
    },
    [canAccessTier],
  );

  /**
   * Validate using a content gate configuration
   */
  const validateContentGate = useCallback(
    async (gate: ContentGate): Promise<AccessResponse> => {
      if (!user) {
        return {
          granted: false,
          reason: 'invalid',
          message: 'Authentication required',
        };
      }

      return accessManager.validateContentAccess(user.id, gate);
    },
    [user],
  );

  /**
   * Batch validation for multiple resources
   */
  const validateMultipleResources = useCallback(
    async (
      resources: Array<{ id: string; tier: Tier }>,
    ): Promise<Map<string, boolean>> => {
      if (!user) {
        const results = new Map<string, boolean>();
        resources.forEach((r) => results.set(r.id, false));
        return results;
      }

      const accessMap = await accessManager.validateBatchAccess(
        user.id,
        resources,
      );
      const results = new Map<string, boolean>();

      accessMap.forEach((response, id) => {
        results.set(id, response.granted);
      });

      return results;
    },
    [user],
  );

  // ========================================================================
  // Cache Management
  // ========================================================================

  /**
   * Clear all cached access validations
   */
  const invalidateAccessCache = useCallback((): void => {
    setAccessCache({});
    if (user) {
      accessManager.clearUserCache(user.id);
    }
    setLastValidation(null);
  }, [user]);

  /**
   * Refresh the current access state
   */
  const refreshAccessState = useCallback(async (): Promise<void> => {
    invalidateAccessCache();
    // Trigger re-validation of current content if needed
    setLastValidation(new Date());
  }, [invalidateAccessCache]);

  // ========================================================================
  // UI Helper Methods
  // ========================================================================

  /**
   * Get upgrade message for a required tier
   */
  const getUpgradeMessage = useCallback(
    (requiredTier: Tier): string => {
      const currentTier = subscription.planId;

      if (currentTier === requiredTier) {
        return 'You already have access to this content.';
      }

      const messages: Record<Tier, string> = {
        free: 'This content is available to all users.',
        advanced:
          'Upgrade to Advanced ($1.99/month) to unlock AI tools and prompting techniques.',
        expert:
          'Upgrade to Expert ($4.99/month) to master cutting-edge AI technologies.',
      };

      return messages[requiredTier];
    },
    [subscription.planId],
  );

  /**
   * Get display name for a tier
   */
  const getTierDisplayName = useCallback((tier: Tier): string => {
    const names: Record<Tier, string> = {
      free: 'Free',
      advanced: 'Advanced',
      expert: 'Expert',
    };
    return names[tier];
  }, []);

  /**
   * Get price for a tier
   */
  const getTierPrice = useCallback((tier: Tier): string => {
    const prices: Record<Tier, string> = {
      free: 'Free',
      advanced: '$1.99/month',
      expert: '$4.99/month',
    };
    return prices[tier];
  }, []);

  // ========================================================================
  // Effects
  // ========================================================================

  // Clear cache when user changes
  useEffect(() => {
    invalidateAccessCache();
  }, [user?.id, invalidateAccessCache]);

  // Clear cache when subscription changes
  useEffect(() => {
    invalidateAccessCache();
  }, [subscription.planId, subscription.status, invalidateAccessCache]);

  // ========================================================================
  // Context Value
  // ========================================================================

  const contextValue: AccessControlContextType = {
    userTier: subscription.planId,
    isSubscriptionActive:
      subscription.status === 'active' || subscription.status === 'trial',
    validateAccess,
    validateTierAccess,
    validateContentGate,
    validateMultipleResources,
    invalidateAccessCache,
    refreshAccessState,
    getUpgradeMessage,
    getTierDisplayName,
    getTierPrice,
    isValidating,
    lastValidation,
    validationErrors,
  };

  return (
    <AccessControlContext.Provider value={contextValue}>
      {children}
    </AccessControlContext.Provider>
  );
}

// ========================================================================
// Hook
// ========================================================================

export function useAccessControlContext(): AccessControlContextType {
  const context = useContext(AccessControlContext);

  if (!context) {
    throw new Error(
      'useAccessControlContext must be used within AccessControlProvider',
    );
  }

  return context;
}

// ========================================================================
// Utility Functions
// ========================================================================

/**
 * Determine required tier based on course ID
 */
function getRequiredTier(courseId: string): Tier {
  const tierMap: Record<string, Tier> = {
    'ai-basics': 'free',
    'ai-assistant': 'advanced',
    'advanced-ai': 'expert',
  };

  return tierMap[courseId] || 'free';
}

// ========================================================================
// Export
// ========================================================================

export default AccessControlContext;
