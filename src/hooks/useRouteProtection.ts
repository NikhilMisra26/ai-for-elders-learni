import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/contexts/AuthContext';

/**
 * Hook for route protection logic that works with both custom routing and React Router
 *
 * This hook provides the core logic for route protection without being tied to a specific
 * routing implementation, making it useful for both the current custom routing system
 * and future React Router migration.
 */
export function useRouteProtection() {
  const { user, isLoading } = useAuth();

  /**
   * Check if user has required access level
   */
  const hasRequiredAccess = (
    requiredRole?: 'free' | 'advanced' | 'expert' | 'admin',
  ): boolean => {
    if (isLoading || !user) return false;
    if (!requiredRole) return true;

    // Handle admin role specially
    if (requiredRole === 'admin') {
      // For now, assuming admin role doesn't exist in current User interface
      // In a real app, you'd check user.role === 'admin' or user.isAdmin
      return false;
    }

    // Check tier-based access
    const tierLevels = { free: 0, advanced: 1, expert: 2 };
    const userLevel = tierLevels[user.tier];
    const requiredLevel = tierLevels[requiredRole];

    return userLevel >= requiredLevel;
  };

  /**
   * Get redirect information for unauthenticated users
   */
  const getRedirectInfo = (currentPath?: string) => ({
    shouldRedirect: !user && !isLoading,
    redirectData: {
      from: currentPath || window.location.pathname,
      authRequired: true,
      message: 'Please sign in to access this page',
    },
  });

  /**
   * Check access and return detailed status
   */
  const checkAccess = (
    requiredRole?: 'free' | 'advanced' | 'expert' | 'admin',
  ) => {
    if (isLoading) {
      return {
        status: 'loading' as const,
        hasAccess: false,
        user: null,
        needsAuth: false,
        needsUpgrade: false,
        requiredRole: requiredRole,
      };
    }

    if (!user) {
      return {
        status: 'unauthenticated' as const,
        hasAccess: false,
        user: null,
        needsAuth: true,
        needsUpgrade: false,
        requiredRole: requiredRole,
      };
    }

    const hasAccess = hasRequiredAccess(requiredRole);

    if (!hasAccess && requiredRole && requiredRole !== 'admin') {
      return {
        status: 'insufficient_tier' as const,
        hasAccess: false,
        user,
        needsAuth: false,
        needsUpgrade: true,
        requiredRole: requiredRole,
      };
    }

    if (!hasAccess) {
      return {
        status: 'access_denied' as const,
        hasAccess: false,
        user,
        needsAuth: false,
        needsUpgrade: false,
        requiredRole: requiredRole,
      };
    }

    return {
      status: 'authorized' as const,
      hasAccess: true,
      user,
      needsAuth: false,
      needsUpgrade: false,
      requiredRole: requiredRole,
    };
  };

  /**
   * Course-specific access check
   */
  const canAccessCourse = (courseId: string): boolean => {
    if (isLoading || !user) return false;

    // Free course is always accessible
    if (courseId === 'free') return true;

    // Advanced and Expert courses require respective tiers
    if (courseId === 'advanced') return hasRequiredAccess('advanced');
    if (courseId === 'expert') return hasRequiredAccess('expert');

    return false;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isLoading,
    hasRequiredAccess,
    getRedirectInfo,
    checkAccess,
    canAccessCourse,
    userTier: user?.tier ?? 'free',
  };
}

/**
 * Type definitions for route protection
 */
export type RouteProtectionStatus =
  | 'loading'
  | 'unauthenticated'
  | 'insufficient_tier'
  | 'access_denied'
  | 'authorized';

export interface AccessCheckResult {
  status: RouteProtectionStatus;
  hasAccess: boolean;
  user: User | null;
  needsAuth: boolean;
  needsUpgrade: boolean;
  requiredRole?: 'free' | 'advanced' | 'expert' | 'admin';
}
