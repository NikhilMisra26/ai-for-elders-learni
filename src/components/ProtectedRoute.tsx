import type { ReactNode, ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock, Shield, ArrowRight } from '@phosphor-icons/react';

import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  /** The role required to access this route */
  requiredRole?: 'free' | 'advanced' | 'expert' | 'admin';
  /** Custom fallback component to render instead of default auth prompt */
  fallback?: ReactNode;
  /** Redirect path when not authenticated (defaults to '/home') */
  redirectTo?: string;
  /** Whether to show upgrade prompt for insufficient tier access */
  showUpgradePrompt?: boolean;
}

/**
 * ProtectedRoute component for React Router v6/v7
 *
 * Protects routes based on authentication status and user roles/tiers.
 * Preserves intended destination for redirect after login.
 *
 * @example
 * ```tsx
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 * } />
 *
 * <Route path="/admin" element={
 *   <ProtectedRoute requiredRole="admin">
 *     <AdminPanel />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/home',
  showUpgradePrompt = true,
}: ProtectedRouteProps): ReactElement {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div
        className='flex items-center justify-center min-h-[60vh]'
        role='status'
        aria-live='polite'
        aria-label='Loading authentication status'
      >
        <div className='text-center'>
          <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-lg text-muted-foreground'>Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: location.pathname + location.search,
          authRequired: true,
          message: 'Please sign in to access this page',
        }}
        replace
      />
    );
  }

  // Check role-based access
  if (requiredRole && !hasRequiredAccess(user, requiredRole)) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Show upgrade prompt for tier-based access
    if (showUpgradePrompt && isUpgradeableRole(requiredRole)) {
      return (
        <TierUpgradePrompt
          requiredRole={requiredRole as 'advanced' | 'expert'}
          currentUser={user}
        />
      );
    }

    // For admin role or when upgrade prompt is disabled, show access denied
    return <AccessDeniedPrompt requiredRole={requiredRole} />;
  }

  // User is authenticated and has required access
  return <>{children}</>;
}

/**
 * Check if user has required access level
 */
function hasRequiredAccess(user: User, requiredRole: string): boolean {
  // Handle admin role specially (would need admin field in user object)
  if (requiredRole === 'admin') {
    // For now, assuming admin role doesn't exist in current User interface
    // In a real app, you'd check user.role === 'admin' or user.isAdmin
    return false;
  }

  // Check tier-based access
  const tierLevels = { free: 0, advanced: 1, expert: 2 };
  const userLevel = tierLevels[user.tier];
  const requiredLevel = tierLevels[requiredRole as 'advanced' | 'expert'];

  return userLevel >= requiredLevel;
}

/**
 * Check if role is upgradeable (not admin)
 */
function isUpgradeableRole(role: string): boolean {
  return role !== 'admin';
}

/**
 * Tier upgrade prompt component for insufficient tier access
 */
interface TierUpgradePromptProps {
  requiredRole: 'advanced' | 'expert';
  currentUser: User;
}

function TierUpgradePrompt({
  requiredRole,
  currentUser,
}: TierUpgradePromptProps): ReactElement {
  const { updateTier } = useAuth();

  const tierInfo = {
    advanced: {
      name: 'Advanced',
      price: '$1.99/month',
      description: 'Access AI tools and prompt engineering techniques',
      features: [
        'Better Prompting Techniques',
        'AI Tools and Apps',
        'Health & Finance Applications',
        'Monthly AI Updates',
      ],
    },
    expert: {
      name: 'Expert',
      price: '$4.99/month',
      description: 'Master cutting-edge AI technologies',
      features: [
        'Autonomous AI Agents',
        'Model Context Protocol (MCP)',
        'Custom AI Assistants',
        'Cutting-Edge Updates',
      ],
    },
  };

  const info = tierInfo[requiredRole];

  const handleUpgrade = (): void => {
    // In a real app, this would open a payment modal
    // For demo purposes, we'll simulate the upgrade
    updateTier(requiredRole);
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-yellow-500' aria-hidden='true' />
          </div>
          <CardTitle>Upgrade Required</CardTitle>
          <CardDescription>
            This content requires the {info.name} tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center mb-6'>
            <div className='inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm mb-4'>
              <span>
                Current:{' '}
                {currentUser.tier.charAt(0).toUpperCase() +
                  currentUser.tier.slice(1)}
              </span>
              <ArrowRight className='h-3 w-3' aria-hidden='true' />
              <span className='font-medium'>{info.name}</span>
            </div>

            <h3 className='text-2xl font-bold mb-2'>{info.price}</h3>
            <p className='text-muted-foreground mb-6'>{info.description}</p>

            <div className='text-left bg-muted/50 rounded-lg p-4 mb-6'>
              <h4 className='font-medium mb-3'>What you'll get:</h4>
              <ul className='space-y-2' role='list'>
                {info.features.map((feature) => (
                  <li key={feature} className='flex items-center gap-2'>
                    <div
                      className='h-2 w-2 bg-primary rounded-full flex-shrink-0'
                      aria-hidden='true'
                    />
                    <span className='text-sm'>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={handleUpgrade}
              size='lg'
              className='w-full'
              aria-label={`Upgrade to ${info.name} tier for ${info.price}`}
            >
              <Shield className='h-4 w-4 mr-2' aria-hidden='true' />
              Upgrade to {info.name} - {info.price}
            </Button>

            <p className='text-xs text-muted-foreground mt-4'>
              * This is a demo. No actual payment will be processed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Access denied prompt for non-upgradeable roles (e.g., admin)
 */
interface AccessDeniedPromptProps {
  requiredRole: string;
}

function AccessDeniedPrompt({
  requiredRole,
}: AccessDeniedPromptProps): ReactElement {
  // Commented out unused location - keeping for potential future use
  // const location = useLocation();

  const handleGoBack = (): void => {
    // Go back in history, or to home if no history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/home';
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-red-500' aria-hidden='true' />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-6'>
            This page requires {requiredRole} access. Please contact your
            administrator if you believe this is an error.
          </p>
          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button
              onClick={handleGoBack}
              variant='outline'
              aria-label='Go back to previous page'
            >
              Go Back
            </Button>
            <Button
              onClick={() => (window.location.href = '/home')}
              aria-label='Go to home page'
            >
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for checking user permissions (React Router compatible)
 *
 * @example
 * ```tsx
 * const { isAuthenticated, hasAccess } = usePermissions();
 *
 * if (!isAuthenticated) {
 *   // Show login prompt
 * }
 *
 * if (!hasAccess('advanced')) {
 *   // Show upgrade prompt
 * }
 * ```
 */
export function usePermissions(): {
  isAuthenticated: boolean;
  userTier: 'free' | 'advanced' | 'expert';
  hasAccess: (
    requiredRole?: 'free' | 'advanced' | 'expert' | 'admin',
  ) => boolean;
  canAccessCourse: (courseId: string) => boolean;
} {
  const { user, isLoading } = useAuth();

  const hasAccess = (
    requiredRole?: 'free' | 'advanced' | 'expert' | 'admin',
  ): boolean => {
    if (isLoading || !user) return false;
    if (!requiredRole) return true;

    return hasRequiredAccess(user, requiredRole);
  };

  const canAccessCourse = (courseId: string): boolean => {
    if (isLoading || !user) return false;

    // Free course is always accessible
    if (courseId === 'free') return true;

    // Advanced and Expert courses require respective tiers
    if (courseId === 'advanced') return hasAccess('advanced');
    if (courseId === 'expert') return hasAccess('expert');

    return false;
  };

  return {
    isAuthenticated: !!user && !isLoading,
    userTier: user?.tier ?? 'free',
    hasAccess,
    canAccessCourse,
  };
}
