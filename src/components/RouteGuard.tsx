import type { ReactNode, ReactElement } from 'react';
import { Lock, Shield, ArrowRight } from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RouteGuardProps {
  children: ReactNode;
  /** The role required to access this content */
  requiredRole?: 'free' | 'advanced' | 'expert' | 'admin';
  /** Custom fallback component to render instead of default prompts */
  fallback?: ReactNode;
  /** Callback when authentication is required */
  onAuthRequired?: () => void;
  /** Whether to show upgrade prompt for insufficient tier access */
  showUpgradePrompt?: boolean;
  /** Whether to show loading state */
  showLoadingState?: boolean;
}

/**
 * RouteGuard component compatible with the current custom routing system
 *
 * This component provides the same protection logic as ProtectedRoute but works
 * with the existing custom routing system in App.tsx. It's designed to be used
 * within page components or as wrappers around content sections.
 *
 * @example
 * ```tsx
 * // In a page component
 * function DashboardPage({ onAuthClick }) {
 *   return (
 *     <RouteGuard onAuthRequired={onAuthClick}>
 *       <div>Dashboard content...</div>
 *     </RouteGuard>
 *   );
 * }
 *
 * // For role-based access
 * function AdminSection({ onAuthClick }) {
 *   return (
 *     <RouteGuard requiredRole="admin" onAuthRequired={onAuthClick}>
 *       <AdminPanel />
 *     </RouteGuard>
 *   );
 * }
 * ```
 */
export function RouteGuard({
  children,
  requiredRole,
  fallback,
  onAuthRequired,
  showUpgradePrompt = true,
  showLoadingState = true,
}: RouteGuardProps): ReactElement {
  const { checkAccess } = useRouteProtection();
  const accessCheck = checkAccess(requiredRole);

  // Show loading state while authentication is being determined
  if (accessCheck.status === 'loading' && showLoadingState) {
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

  // Handle unauthenticated users
  if (accessCheck.status === 'unauthenticated') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <AuthRequiredPrompt onAuthRequired={onAuthRequired} requiredRole={requiredRole} />;
  }

  // Handle insufficient tier access
  if (accessCheck.status === 'insufficient_tier' && showUpgradePrompt) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // User is guaranteed to be non-null for insufficient_tier status
    if (!accessCheck.user) {
      throw new Error('User should not be null for insufficient_tier status');
    }

    return (
      <TierUpgradePrompt
        requiredRole={requiredRole as 'advanced' | 'expert'}
        currentUser={accessCheck.user}
      />
    );
  }

  // Handle access denied (e.g., admin role)
  if (accessCheck.status === 'access_denied') {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <AccessDeniedPrompt requiredRole={requiredRole ?? 'unknown'} />;
  }

  // User is authorized, render children
  return <>{children}</>;
}

/**
 * Authentication required prompt component
 */
interface AuthRequiredPromptProps {
  onAuthRequired?: () => void;
  requiredRole?: string;
}

function AuthRequiredPrompt({
  onAuthRequired,
  requiredRole,
}: AuthRequiredPromptProps): ReactElement {
  const handleSignIn = (): void => {
    if (onAuthRequired) {
      onAuthRequired();
    } else {
      // Fallback: No callback provided - show warning toast
      toast.warning('Authentication handler not configured', {
        description: 'Please contact support if this issue persists',
      });
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-muted-foreground' aria-hidden='true' />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            {requiredRole
              ? `Please sign in to access this ${requiredRole} content`
              : 'Please sign in to access this content'}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <Button onClick={handleSignIn} size='lg' aria-label='Sign in to access content'>
            <Shield className='h-4 w-4 mr-2' aria-hidden='true' />
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Tier upgrade prompt component
 */
interface TierUpgradePromptProps {
  requiredRole: 'advanced' | 'expert';
  currentUser: User;
}

function TierUpgradePrompt({ requiredRole, currentUser }: TierUpgradePromptProps): ReactElement {
  const { updateTier: _updateTier } = useAuth();

  // Start of removed/added code for subscription removal
  const tierInfo = {
    advanced: {
      name: 'Advanced',
      // price: '$1.99/month', // Removed for subscription removal
      price: 'Coming Soon', // Added for subscription removal
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
      // price: '$4.99/month', // Removed for subscription removal
      price: 'Coming Soon', // Added for subscription removal
      description: 'Master cutting-edge AI technologies',
      features: [
        'Autonomous AI Agents',
        'Model Context Protocol (MCP)',
        'Custom AI Assistants',
        'Cutting-Edge Updates',
      ],
    },
  };
  // End of removed/added code for subscription removal

  const info = tierInfo[requiredRole];

  const handleUpgrade = (): void => {
    // Start of removed/added code for subscription removal
    // In a real app, this would open a payment modal
    // For demo purposes, we'll simulate the upgrade
    // updateTier(requiredRole); // Removed for subscription removal
    // Added for subscription removal - show coming soon message
    toast.info('Tier upgrades coming soon!');
    // End of removed/added code for subscription removal
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-yellow-500' aria-hidden='true' />
          </div>
          <CardTitle>Upgrade Required</CardTitle>
          <CardDescription>This content requires the {info.name} tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center mb-6'>
            <div className='inline-flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm mb-4'>
              <span>
                Current: {currentUser.tier.charAt(0).toUpperCase() + currentUser.tier.slice(1)}
              </span>
              <ArrowRight className='h-3 w-3' aria-hidden='true' />
              <span className='font-medium'>{info.name}</span>
            </div>

            <h3 className='text-2xl font-bold mb-2'>{info.price}</h3>
            <p className='text-muted-foreground mb-6'>{info.description}</p>

            <div className='text-left bg-muted/50 rounded-lg p-4 mb-6'>
              <h4 className='font-medium mb-3'>What you&apos;ll get:</h4>
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

            {/* Start of removed/added code for subscription removal */}
            <Button
              onClick={handleUpgrade}
              size='lg'
              className='w-full'
              aria-label={`Upgrade to ${info.name} tier for ${info.price}`}
            >
              <Shield className='h-4 w-4 mr-2' aria-hidden='true' />
              {/* Upgrade to {info.name} - {info.price} */}
              {/* Removed for subscription removal - replaced with Coming Soon */}
              {info.name} - Coming Soon
            </Button>

            {/* <p className='text-xs text-muted-foreground mt-4'>
              * This is a demo. No actual payment will be processed.
            </p> */}
            {/* Removed for subscription removal */}
            <p className='text-xs text-muted-foreground mt-4'>
              * Tier upgrades will be available soon.
            </p>
            {/* Added for subscription removal */}
            {/* End of removed/added code for subscription removal */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Access denied prompt component
 */
interface AccessDeniedPromptProps {
  requiredRole: string;
}

function AccessDeniedPrompt({ requiredRole }: AccessDeniedPromptProps): ReactElement {
  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-red-500' aria-hidden='true' />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You don&apos;t have permission to access this content</CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-6'>
            This content requires {requiredRole} access. Please contact your administrator if you
            believe this is an error.
          </p>
          <Button
            onClick={() => window.location.reload()}
            variant='outline'
            aria-label='Refresh page'
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
