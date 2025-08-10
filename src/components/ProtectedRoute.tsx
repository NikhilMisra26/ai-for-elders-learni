/**
 * ProtectedRoute Component
 *
 * A route wrapper that enforces access control at the navigation level,
 * working with the ProtectedContent component for content-level protection.
 */

import React, {
  useState,
  useEffect,
  type ReactNode,
  type ReactElement,
} from 'react';
import { toast } from 'sonner';
import { Lock, ArrowLeft, Shield, Clock } from '@phosphor-icons/react';

import { ProtectedContent } from './ProtectedContent';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  validateRouteAccess,
  type PageType,
  type RouteParams,
} from '@/lib/routingConfig';
import { getCourseById } from '@/lib/courseData';
import type { Tier } from '@/lib/db';

// ========================================================================
// Types
// ========================================================================

interface ProtectedRouteProps {
  children: ReactNode;
  page: PageType;
  params?: RouteParams;
  onAuthRequired?: () => void;
  onUpgradeRequired?: (requiredTier: Tier) => void;
  onNavigate?: (page: string) => void;
  fallback?: ReactNode;
  validateOnMount?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  canAccess: boolean;
  reason?: 'unauthenticated' | 'insufficient_tier' | 'expired' | 'invalid';
  requiredTier?: Tier;
  message?: string;
}

// ========================================================================
// Main Component
// ========================================================================

export function ProtectedRoute({
  children,
  page,
  params = {},
  onAuthRequired,
  onUpgradeRequired,
  onNavigate,
  fallback,
  validateOnMount = true,
}: ProtectedRouteProps): ReactElement {
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: true,
    canAccess: false,
  });

  // For module pages, we need to check the course tier
  const courseTier = params.courseId
    ? getCourseById(params.courseId)?.tier
    : undefined;

  useEffect(() => {
    if (!validateOnMount) {
      return;
    }

    // Perform route-level validation
    const result = validateRouteAccess(
      page,
      params,
      !!user,
      subscription.planId,
      courseTier,
    );

    setValidationState({
      isValidating: false,
      canAccess: result.allowed,
      reason: result.reason,
      requiredTier: result.requiredTier,
      message: result.message,
    });

    // Handle redirects
    if (!result.allowed) {
      if (result.reason === 'unauthenticated' && onAuthRequired) {
        onAuthRequired();
      } else if (
        result.reason === 'insufficient_tier' &&
        onUpgradeRequired &&
        result.requiredTier
      ) {
        onUpgradeRequired(result.requiredTier);
      }
    }
  }, [
    page,
    params,
    user,
    subscription.planId,
    courseTier,
    validateOnMount,
    onAuthRequired,
    onUpgradeRequired,
  ]);

  const shouldShowFallback = validationState.isValidating || !validationState.canAccess;
  if (fallback && shouldShowFallback) return <>{fallback}</>;

  if (validationState.isValidating) return <LoadingState />;

  if (!validationState.canAccess) {
    if (validationState.reason === 'unauthenticated')
      return <UnauthenticatedView onAuthClick={onAuthRequired} />;

    if (
      validationState.reason === 'insufficient_tier' &&
      validationState.requiredTier
    )
      return (
        <InsufficientTierView
          requiredTier={validationState.requiredTier}
          currentTier={subscription.planId}
          message={validationState.message}
          onUpgradeClick={() =>
            onUpgradeRequired?.(validationState.requiredTier)
          }
          onBack={() => onNavigate?.('courses')}
        />
      );

    if (validationState.reason === 'expired')
      return (
        <ExpiredSubscriptionView
          onRenewClick={() =>
            onUpgradeRequired?.(subscription.planId as 'advanced' | 'expert')
          }
          onBack={() => onNavigate?.('courses')}
        />
      );

    return (
      <AccessDeniedView
        message={validationState.message}
        onBack={() => onNavigate?.('courses')}
      />
    );
  }

  // For module pages with course content, wrap in ProtectedContent for additional validation
  if (
    page === 'module' &&
    params.courseId &&
    courseTier &&
    courseTier !== 'free'
  ) {
    return (
      <ProtectedContent
        courseId={params.courseId}
        moduleId={params.moduleId}
        requiredTier={courseTier}
        enforceServerSide={true}
        onAccessDenied={(reason) => {
          toast.error('Access Denied', {
            description: `Unable to access this content: ${reason}`,
          });
          if (onNavigate) {
            setTimeout(() => onNavigate('courses'), 2000);
          }
        }}
        onUpgradeClick={() => onUpgradeRequired?.(courseTier)}
      >
        {children}
      </ProtectedContent>
    );
  }

  // Access granted
  return <>{children}</>;
}

// ========================================================================
// Sub-components
// ========================================================================

function LoadingState(): ReactElement {
  return (
    <div className='min-h-screen bg-background p-6'>
      <div className='max-w-4xl mx-auto space-y-6'>
        <Skeleton className='h-12 w-3/4' />
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-6 w-full' />
        <Skeleton className='h-6 w-2/3' />
        <div className='grid grid-cols-2 gap-4 mt-8'>
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
        </div>
      </div>
    </div>
  );
}

function UnauthenticatedView({
  onAuthClick,
}: {
  onAuthClick?: () => void;
}): ReactElement {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-muted-foreground' />
          </div>
          <CardTitle className='text-2xl'>Sign In Required</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-6'>
            Please sign in to access this content. Create a free account to
            start your AI learning journey.
          </p>
          <Button size='lg' onClick={onAuthClick} className='w-full'>
            <Shield className='h-4 w-4 mr-2' />
            Sign In or Create Account
          </Button>
          <p className='text-sm text-muted-foreground mt-4'>
            No credit card required for free content
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface InsufficientTierViewProps {
  requiredTier: Tier;
  currentTier: Tier;
  message?: string;
  onUpgradeClick?: () => void;
  onBack?: () => void;
}

function InsufficientTierView({
  requiredTier,
  currentTier,
  message,
  onUpgradeClick,
  onBack,
}: InsufficientTierViewProps): ReactElement {
  const tierPrices: Record<Tier, string> = {
    free: 'Free',
    advanced: '$1.99/month',
    expert: '$4.99/month',
  };

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-yellow-500' />
          </div>
          <CardTitle className='text-2xl'>
            {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}{' '}
            Subscription Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-center text-muted-foreground mb-6'>
            {message ?? `This content requires a ${requiredTier} subscription.`}
          </p>

          <div className='bg-muted/50 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm'>Current Plan:</span>
              <span className='font-medium'>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Required Plan:</span>
              <span className='font-medium text-primary'>
                {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}(
                {tierPrices[requiredTier]})
              </span>
            </div>
          </div>

          <div className='space-y-3'>
            <Button onClick={onUpgradeClick} size='lg' className='w-full'>
              <Shield className='h-4 w-4 mr-2' />
              Upgrade to{' '}
              {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
            </Button>

            {onBack && (
              <Button
                onClick={onBack}
                variant='outline'
                size='lg'
                className='w-full'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Courses
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExpiredSubscriptionView({
  onRenewClick,
  onBack,
}: {
  onRenewClick?: () => void;
  onBack?: () => void;
}): ReactElement {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Clock className='h-12 w-12 text-orange-500' />
          </div>
          <CardTitle className='text-2xl'>Subscription Expired</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className='mb-6'>
            <AlertTitle>Your subscription has expired</AlertTitle>
            <AlertDescription>
              Renew your subscription to continue accessing premium content and
              pick up right where you left off.
            </AlertDescription>
          </Alert>

          <div className='space-y-3'>
            <Button onClick={onRenewClick} size='lg' className='w-full'>
              <Shield className='h-4 w-4 mr-2' />
              Renew Subscription
            </Button>

            {onBack && (
              <Button
                onClick={onBack}
                variant='outline'
                size='lg'
                className='w-full'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to Courses
              </Button>
            )}
          </div>

          <p className='text-center text-sm text-muted-foreground mt-4'>
            Free content is still available without a subscription
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessDeniedView({
  message,
  onBack,
}: {
  message?: string;
  onBack?: () => void;
}): ReactElement {
  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-6'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-red-500' />
          </div>
          <CardTitle className='text-2xl'>Access Denied</CardTitle>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-6'>
            {message ?? 'You do not have permission to access this content.'}
          </p>

          {onBack && (
            <Button
              onClick={onBack}
              variant='outline'
              size='lg'
              className='w-full'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Courses
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
