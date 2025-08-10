/**
 * ProtectedContent Component
 *
 * A comprehensive content protection component that enforces
 * both client-side and server-side access validation.
 */

import React, {
  useState,
  useEffect,
  type ReactNode,
  type ReactElement,
} from 'react';
import {
  Lock,
  Shield,
  Warning,
  Spinner,
  ArrowRight,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/lib/subscription';
import {
  accessManager,
  type AccessResponse,
  type ContentGate,
} from '@/lib/accessControl';
import { SecurityLogger } from '@/lib/security';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// ========================================================================
// Types and Interfaces
// ========================================================================

interface ProtectedContentProps {
  children: ReactNode;
  courseId: string;
  moduleId?: string;
  requiredTier: 'free' | 'advanced' | 'expert';
  enforceServerSide?: boolean;
  fallbackContent?: ReactNode;
  onAccessDenied?: (reason: string) => void;
  onUpgradeClick?: () => void;
  showSkeleton?: boolean;
  validateOnMount?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  isValidated: boolean;
  hasAccess: boolean;
  response?: AccessResponse;
  error?: string;
}

// ========================================================================
// Main Component
// ========================================================================

export function ProtectedContent({
  children,
  courseId,
  moduleId,
  requiredTier,
  enforceServerSide = true,
  fallbackContent,
  onAccessDenied,
  onUpgradeClick,
  showSkeleton = true,
  validateOnMount = true,
}: ProtectedContentProps): ReactElement {
  const { user } = useAuth();
  const { subscription, canAccessTier } = useSubscription();

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: enforceServerSide && validateOnMount,
    isValidated: false,
    hasAccess: false,
  });

  // ========================================================================
  // Validation Logic
  // ========================================================================

  useEffect(() => {
    if (!validateOnMount || !user) return;

    const validateAccess = async (): Promise<void> => {
      // Quick client-side check first
      const clientAccess = canAccessTier(requiredTier);

      if (!clientAccess) {
        setValidationState({
          isValidating: false,
          isValidated: true,
          hasAccess: false,
          response: {
            granted: false,
            reason: 'tier_mismatch',
            userTier: subscription.planId,
            upgradeRequired: requiredTier,
          },
        });

        if (onAccessDenied) {
          onAccessDenied('tier_mismatch');
        }

        return;
      }

      // Server-side validation if enforced
      if (enforceServerSide) {
        setValidationState((prev) => ({ ...prev, isValidating: true }));

        try {
          const contentGate: ContentGate = {
            courseId,
            moduleId,
            requiredTier,
            enforceServerSide: true,
          };

          const response = await accessManager.validateContentAccess(
            user.id,
            contentGate,
          );

          setValidationState({
            isValidating: false,
            isValidated: true,
            hasAccess: response.granted,
            response,
          });

          if (!response.granted) {
            SecurityLogger.log(
              'content_access_denied',
              {
                userId: user.id,
                courseId,
                moduleId,
                reason: response.reason,
              },
              'warning',
            );

            if (onAccessDenied) {
              onAccessDenied(response.reason ?? 'unknown');
            }

            // Show appropriate toast message
            if (response.reason === 'expired') {
              toast.error('Subscription Expired', {
                description:
                  'Please renew your subscription to access this content.',
              });
            } else if (response.reason === 'tier_mismatch') {
              toast.error('Upgrade Required', {
                description:
                  response.message ?? 'This content requires a higher tier.',
              });
            }
          }
        } catch (error) {
          console.error('Access validation error:', error);

          setValidationState({
            isValidating: false,
            isValidated: true,
            hasAccess: false,
            error: 'Failed to validate access. Please try again.',
          });

          toast.error('Validation Error', {
            description:
              'Unable to verify your access. Please refresh and try again.',
          });
        }
      } else {
        // Client-side validation only
        setValidationState({
          isValidating: false,
          isValidated: true,
          hasAccess: clientAccess,
        });
      }
    };

    void validateAccess();
  }, [
    user,
    courseId,
    moduleId,
    requiredTier,
    enforceServerSide,
    validateOnMount,
    canAccessTier,
    subscription.planId,
    onAccessDenied,
  ]);

  // ========================================================================
  // Render Logic
  // ========================================================================

  // Not authenticated
  if (!user) {
    return <UnauthenticatedView />;
  }

  // Validating
  if (validationState.isValidating) {
    if (showSkeleton) {
      return <ContentSkeleton />;
    }

    return (
      <div className='flex items-center justify-center p-8'>
        <Spinner className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  // Validation error
  if (validationState.error) {
    return (
      <ErrorView
        error={validationState.error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Access denied
  if (validationState.isValidated && !validationState.hasAccess) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }

    return (
      <AccessDeniedView
        response={validationState.response}
        requiredTier={requiredTier}
        userTier={subscription.planId}
        onUpgradeClick={onUpgradeClick}
      />
    );
  }

  // Access granted
  return <>{children}</>;
}

// ========================================================================
// Sub-components
// ========================================================================

function UnauthenticatedView(): ReactElement {
  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-muted-foreground' />
          </div>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            Please sign in to access course content
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <p className='text-muted-foreground mb-6'>
            Create a free account to start learning about AI
          </p>
          <Button size='lg' onClick={() => (window.location.href = '/auth')}>
            <Shield className='h-4 w-4 mr-2' />
            Sign In or Create Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface AccessDeniedViewProps {
  response?: AccessResponse;
  requiredTier: 'free' | 'advanced' | 'expert';
  userTier: 'free' | 'advanced' | 'expert';
  onUpgradeClick?: () => void;
}

function AccessDeniedView({
  response,
  requiredTier,
  userTier,
  onUpgradeClick,
}: AccessDeniedViewProps): ReactElement {
  const tierInfo = {
    advanced: {
      name: 'Advanced',
      price: '$1.99/month',
      description: 'Unlock AI tools and advanced prompting techniques',
      features: [
        'AI as Your Personal Assistant course',
        'Advanced prompting techniques',
        'AI tools and apps guidance',
        'Health & finance applications',
      ],
    },
    expert: {
      name: 'Expert',
      price: '$4.99/month',
      description: 'Master cutting-edge AI technologies',
      features: [
        'Advanced AI for Active Seniors course',
        'Autonomous AI agents',
        'Model Context Protocol (MCP)',
        'Custom AI assistants',
      ],
    },
  };

  const info = requiredTier === 'free' ? null : tierInfo[requiredTier];

  if (!info) {
    return (
      <Alert className='max-w-2xl mx-auto'>
        <Warning className='h-4 w-4' />
        <AlertTitle>Access Restricted</AlertTitle>
        <AlertDescription>
          This content is currently unavailable.
        </AlertDescription>
      </Alert>
    );
  }

  const handleUpgrade = async (): Promise<void> => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      const { processStripePayment } = await import('@/lib/subscription');
      const { toast } = await import('sonner');
      const { user } = await import('@/contexts/AuthContext').then((m) =>
        m.useAuth(),
      );

      if (!user) {
        toast.error('Please sign in first');
        return;
      }

      try {
        const result = await processStripePayment(
          requiredTier as 'advanced' | 'expert',
          user.id,
          user.email,
        );

        if (result.success) {
          toast.success('Redirecting to checkout...');
        } else {
          toast.error('Upgrade failed', {
            description: result.error || 'Please try again.',
          });
        }
      } catch (error) {
        console.error('Upgrade error:', error);
        toast.error('Upgrade failed', {
          description: 'An unexpected error occurred. Please try again later.',
        });
      }
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-12 w-12 text-yellow-500' />
          </div>
          <CardTitle>Upgrade to {info.name}</CardTitle>
          <CardDescription>
            {response?.message ??
              `This content requires ${info.name} tier access`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center'>
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
              <h4 className='font-medium mb-3'>What you&apos;ll unlock:</h4>
              <ul className='space-y-2'>
                {info.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-2'>
                    <div className='h-2 w-2 bg-primary rounded-full mt-1.5' />
                    <span className='text-sm'>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => void handleUpgrade()}
              size='lg'
              className='w-full'
            >
              <Shield className='h-4 w-4 mr-2' />
              Upgrade to {info.name}
            </Button>

            {response?.reason === 'expired' && (
              <Alert className='mt-4'>
                <Warning className='h-4 w-4' />
                <AlertTitle>Subscription Expired</AlertTitle>
                <AlertDescription>
                  Your previous subscription has expired. Upgrade now to regain
                  access.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentSkeleton(): ReactElement {
  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Skeleton className='h-12 w-3/4' />
      <Skeleton className='h-6 w-full' />
      <Skeleton className='h-6 w-full' />
      <Skeleton className='h-6 w-2/3' />
      <div className='grid grid-cols-2 gap-4 mt-8'>
        <Skeleton className='h-32' />
        <Skeleton className='h-32' />
      </div>
    </div>
  );
}

interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

function ErrorView({ error, onRetry }: ErrorViewProps): ReactElement {
  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Alert variant='destructive'>
        <Warning className='h-4 w-4' />
        <AlertTitle>Validation Error</AlertTitle>
        <AlertDescription className='mt-2'>
          <p>{error}</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={onRetry}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ========================================================================
// Enhanced SecureRoute Component
// ========================================================================

interface EnhancedSecureRouteProps {
  children: ReactNode;
  requiredTier?: 'free' | 'advanced' | 'expert';
  courseId?: string;
  moduleId?: string;
  enforceServerValidation?: boolean;
  fallback?: ReactNode;
  onAuthRequired?: () => void;
  onUpgradeRequired?: () => void;
}

export function EnhancedSecureRoute({
  children,
  requiredTier = 'free',
  courseId,
  moduleId,
  enforceServerValidation = false,
  fallback,
  onAuthRequired,
  onUpgradeRequired,
}: EnhancedSecureRouteProps): ReactElement {
  const { user } = useAuth();

  // Not authenticated
  if (!user) {
    if (fallback) return <>{fallback}</>;
    if (onAuthRequired) {
      onAuthRequired();
      return <></>;
    }
    return <UnauthenticatedView />;
  }

  // Use ProtectedContent for tier-based access
  if (courseId) {
    return (
      <ProtectedContent
        courseId={courseId}
        moduleId={moduleId}
        requiredTier={requiredTier}
        enforceServerSide={enforceServerValidation}
        fallbackContent={fallback}
        onUpgradeClick={onUpgradeRequired}
      >
        {children}
      </ProtectedContent>
    );
  }

  // Simple tier check without course context
  return (
    <SimpleTierCheck
      requiredTier={requiredTier}
      fallback={fallback}
      onUpgradeClick={onUpgradeRequired}
    >
      {children}
    </SimpleTierCheck>
  );
}

interface SimpleTierCheckProps {
  children: ReactNode;
  requiredTier: 'free' | 'advanced' | 'expert';
  fallback?: ReactNode;
  onUpgradeClick?: () => void;
}

function SimpleTierCheck({
  children,
  requiredTier,
  fallback,
  onUpgradeClick,
}: SimpleTierCheckProps): ReactElement {
  const { subscription, canAccessTier } = useSubscription();

  if (!canAccessTier(requiredTier)) {
    if (fallback) return <>{fallback}</>;

    return (
      <AccessDeniedView
        requiredTier={requiredTier}
        userTier={subscription.planId}
        onUpgradeClick={onUpgradeClick}
      />
    );
  }

  return <>{children}</>;
}
