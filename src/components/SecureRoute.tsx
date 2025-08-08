import type { ReactNode } from 'react';
import { Lock, Shield, ArrowRight } from '@phosphor-icons/react';

import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SecureRouteProps {
  children: ReactNode;
  requiresAuth?: boolean;
  requiredTier?: 'free' | 'advanced' | 'expert';
  fallback?: ReactNode;
  onAuthRequired?: () => void;
}

/**
 * Security wrapper component that protects routes and content
 * based on authentication status and user tier
 */
export function SecureRoute({
  children,
  requiresAuth = false,
  requiredTier,
  fallback,
  onAuthRequired,
}: SecureRouteProps) {
  const { user } = useAuth();

  // Check if user is authenticated when required
  if (requiresAuth && !user) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className='max-w-2xl mx-auto p-6'>
        <Card>
          <CardHeader className='text-center'>
            <div className='flex justify-center mb-4'>
              <Lock className='h-12 w-12 text-muted-foreground' />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this content
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <Button onClick={onAuthRequired} size='lg'>
              <Shield className='h-4 w-4 mr-2' />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check tier access if specified
  if (requiredTier && user) {
    const tierLevels = { free: 0, advanced: 1, expert: 2 };
    const userLevel = tierLevels[user.tier];
    const requiredLevel = tierLevels[requiredTier];

    if (userLevel < requiredLevel) {
      if (fallback) return <>{fallback}</>;

      // Only show upgrade prompt for paid tiers
      const paidTier = requiredTier === 'free' ? undefined : requiredTier;
      if (paidTier) {
        return (
          <TierUpgradePrompt requiredTier={paidTier} userTier={user.tier} />
        );
      }
    }
  }

  return <>{children}</>;
}

interface TierUpgradePromptProps {
  requiredTier: 'advanced' | 'expert';
  userTier: 'free' | 'advanced' | 'expert';
}

function TierUpgradePrompt({ requiredTier, userTier }: TierUpgradePromptProps) {
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

  const info = tierInfo[requiredTier];

  const handleUpgrade = () => {
    // Simulate payment flow - in real app this would integrate with Stripe
    const confirmed = window.confirm(
      `Upgrade to ${info.name} tier for ${info.price}? This is a simulation - no actual payment will be processed.`,
    );

    if (confirmed) {
      updateTier(requiredTier);
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-yellow-500' />
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
                Current: {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </span>
              <ArrowRight className='h-3 w-3' />
              <span className='font-medium'>{info.name}</span>
            </div>

            <h3 className='text-2xl font-bold mb-2'>{info.price}</h3>
            <p className='text-muted-foreground mb-6'>{info.description}</p>

            <div className='text-left bg-muted/50 rounded-lg p-4 mb-6'>
              <h4 className='font-medium mb-3'>What you'll get:</h4>
              <ul className='space-y-2'>
                {info.features.map((feature, index) => (
                  <li key={index} className='flex items-center gap-2'>
                    <div className='h-2 w-2 bg-primary rounded-full' />
                    <span className='text-sm'>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button onClick={handleUpgrade} size='lg' className='w-full'>
              <Shield className='h-4 w-4 mr-2' />
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
 * Hook for checking user permissions
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasAccess = (
    requiredTier?: 'free' | 'advanced' | 'expert',
  ): boolean => {
    if (!user) return false;
    if (!requiredTier) return true;

    const tierLevels = { free: 0, advanced: 1, expert: 2 };
    const userLevel = tierLevels[user.tier];
    const requiredLevel = tierLevels[requiredTier];

    return userLevel >= requiredLevel;
  };

  const canAccessCourse = (courseId: string): boolean => {
    if (!user) return false;

    // Free course is always accessible
    if (courseId === 'free') return true;

    // Advanced and Expert courses require respective tiers
    if (courseId === 'advanced') return hasAccess('advanced');
    if (courseId === 'expert') return hasAccess('expert');

    return false;
  };

  return {
    isAuthenticated: !!user,
    userTier: user?.tier || 'free',
    hasAccess,
    canAccessCourse,
  };
}
