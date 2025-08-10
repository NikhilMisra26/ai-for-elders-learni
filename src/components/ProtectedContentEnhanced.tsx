/**
 * ProtectedContent Component - Enhanced Version
 *
 * A comprehensive content protection component that enforces
 * both client-side and server-side access validation.
 *
 * Features:
 * - Integrates with AccessManager for server-side validation
 * - Uses useSubscription() hook for client-side checks
 * - Senior-friendly loading states and error messages
 * - Clear upgrade prompts with accessible design
 * - Support for course and module level protection
 * - Graceful network failure handling
 * - Accessibility-first with WCAG 2.1 AA compliance
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type ReactElement,
} from 'react';
import {
  Lock,
  Shield,
  Warning,
  CircleNotch,
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  Info,
  WifiSlash,
  ArrowClockwise,
} from '@phosphor-icons/react';

import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSubscription } from '@/lib/subscription';
import { useAccessControl } from '@/hooks/useAccessControl';
import type { AccessResponse, ContentGate } from '@/lib/accessControl';
import { SecurityLogger } from '@/lib/security';
import { errorHandler } from '@/lib/errorHandler';
import { cn } from '@/lib/utils';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
  previewContent?: ReactNode;
  showPreviewForNonSubscribers?: boolean;
  retryAttempts?: number;
  loadingMessage?: string;
  className?: string;
}

interface ValidationState {
  isValidating: boolean;
  isValidated: boolean;
  hasAccess: boolean;
  response?: AccessResponse;
  error?: string;
  retryCount: number;
  networkError: boolean;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

interface AccessibilityProps {
  fontSize: 'small' | 'normal' | 'large';
  darkMode: boolean;
  speakText?: (text: string) => void;
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
  previewContent,
  showPreviewForNonSubscribers = true,
  retryAttempts = 3,
  loadingMessage = 'Verifying your access...',
  className,
}: ProtectedContentProps): ReactElement {
  const { user } = useAuth();
  const { fontSize, isDarkMode: darkMode, speakText } = useAccessibility();
  const { subscription, canAccessTier, isInGracePeriod, getDaysUntilExpiry } =
    useSubscription();
  const { checkContentAccess, handleAccessDenied: showAccessDeniedToast } =
    useAccessControl();

  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: enforceServerSide && validateOnMount,
    isValidated: false,
    hasAccess: false,
    retryCount: 0,
    networkError: false,
  });

  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retryConfig: RetryConfig = {
    maxAttempts: retryAttempts,
    delayMs: 1000,
    backoffMultiplier: 2,
  };

  // ========================================================================
  // Validation Logic with Retry and Network Failure Handling
  // ========================================================================

  const performValidation = useCallback(async (): Promise<void> => {
    if (!user) return;

    // Quick client-side check first
    const clientAccess = canAccessTier(requiredTier);

    if (!clientAccess && !showPreviewForNonSubscribers) {
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
        retryCount: 0,
        networkError: false,
      });

      if (onAccessDenied) {
        onAccessDenied('tier_mismatch');
      }

      showAccessDeniedToast(requiredTier, 'tier_mismatch');
      return;
    }

    // Server-side validation if enforced
    if (enforceServerSide) {
      setValidationState((prev) => ({
        ...prev,
        isValidating: true,
        networkError: false,
      }));

      try {
        const contentGate: ContentGate = {
          courseId,
          moduleId,
          requiredTier,
          enforceServerSide: true,
          fallbackContent: fallbackContent ? 'custom' : undefined,
          upgradePrompt: true,
        };

        const hasAccess = await checkContentAccess(contentGate);

        setValidationState((prev) => ({
          ...prev,
          isValidating: false,
          isValidated: true,
          hasAccess,
          response: {
            granted: hasAccess,
            reason: hasAccess ? 'authenticated' : 'tier_mismatch',
            userTier: subscription.planId,
            upgradeRequired: hasAccess ? undefined : requiredTier,
          },
          retryCount: 0,
          networkError: false,
        }));

        if (!hasAccess) {
          SecurityLogger.log(
            'content_access_denied',
            {
              userId: user.id,
              courseId,
              moduleId,
              reason: 'tier_mismatch',
              userTier: subscription.planId,
              requiredTier,
            },
            'warning',
          );

          if (onAccessDenied) {
            onAccessDenied('tier_mismatch');
          }
        }
      } catch (error) {
        const isNetworkError =
          error instanceof Error &&
          (error.message.includes('network') ||
            error.message.includes('fetch'));

        setValidationState((prev) => {
          const newRetryCount = prev.retryCount + 1;
          const shouldRetry = newRetryCount < retryConfig.maxAttempts;

          if (shouldRetry && isNetworkError) {
            // Schedule retry with exponential backoff
            const delay =
              retryConfig.delayMs *
              Math.pow(retryConfig.backoffMultiplier, newRetryCount - 1);
            retryTimeoutRef.current = setTimeout(() => {
              void performValidation();
            }, delay);

            return {
              ...prev,
              retryCount: newRetryCount,
              networkError: true,
            };
          }

          // Max retries reached or non-network error
          errorHandler.logError(
            'Access validation failed',
            error instanceof Error
              ? error
              : new Error('Access validation failed'),
            {
              userId: user.id,
              metadata: {
                courseId,
                moduleId,
                retryCount: newRetryCount,
                isNetworkError,
              },
            },
          );

          return {
            ...prev,
            isValidating: false,
            isValidated: true,
            hasAccess: false,
            error: isNetworkError
              ? 'Network error. Please check your connection and try again.'
              : 'Unable to verify access. Please refresh the page.',
            retryCount: newRetryCount,
            networkError: isNetworkError,
          };
        });
      }
    } else {
      // Client-side validation only
      setValidationState({
        isValidating: false,
        isValidated: true,
        hasAccess: clientAccess,
        response: {
          granted: clientAccess,
          reason: clientAccess ? 'authenticated' : 'tier_mismatch',
          userTier: subscription.planId,
          upgradeRequired: clientAccess ? undefined : requiredTier,
        },
        retryCount: 0,
        networkError: false,
      });
    }
  }, [
    user,
    courseId,
    moduleId,
    requiredTier,
    enforceServerSide,
    canAccessTier,
    subscription.planId,
    onAccessDenied,
    showAccessDeniedToast,
    checkContentAccess,
    fallbackContent,
    showPreviewForNonSubscribers,
    retryConfig.maxAttempts,
    retryConfig.delayMs,
    retryConfig.backoffMultiplier,
  ]);

  useEffect(() => {
    if (!validateOnMount || !user) {
      return (): void => {
        if (validationTimeoutRef.current) {
          if (validationTimeoutRef.current)
            clearTimeout(validationTimeoutRef.current);
        }
        if (retryTimeoutRef.current) {
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        }
      };
    }

    // Add a small delay for better UX on fast connections
    validationTimeoutRef.current = setTimeout(() => {
      void performValidation();
    }, 100);

    return (): void => {
      if (validationTimeoutRef.current) {
        if (validationTimeoutRef.current)
          clearTimeout(validationTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [validateOnMount, user, performValidation]);

  // ========================================================================
  // Render Logic
  // ========================================================================

  // Not authenticated
  if (!user) {
    return (
      <div className={className}>
        <UnauthenticatedView
          fontSize={fontSize}
          darkMode={darkMode}
          speakText={speakText}
        />
      </div>
    );
  }

  // Validating
  if (validationState.isValidating) {
    if (showSkeleton) {
      return (
        <div className={className}>
          <EnhancedContentSkeleton
            loadingMessage={loadingMessage}
            fontSize={fontSize}
            darkMode={darkMode}
            retryCount={validationState.retryCount}
            maxRetries={retryConfig.maxAttempts}
            isNetworkError={validationState.networkError}
          />
        </div>
      );
    }

    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 gap-4',
          className,
        )}
      >
        <CircleNotch
          className='h-12 w-12 animate-spin text-primary'
          aria-label='Loading'
        />
        <p
          className={cn(
            'text-muted-foreground text-center',
            fontSize === 'large' && 'text-lg',
            fontSize === 'small' && 'text-sm',
          )}
        >
          {loadingMessage}
        </p>
        {validationState.retryCount > 0 && (
          <p className='text-sm text-muted-foreground'>
            Retry attempt {validationState.retryCount} of{' '}
            {retryConfig.maxAttempts}
          </p>
        )}
      </div>
    );
  }

  // Validation error
  if (validationState.error) {
    return (
      <div className={className}>
        <EnhancedErrorView
          error={validationState.error}
          onRetry={() => {
            setValidationState((prev) => ({
              ...prev,
              error: undefined,
              retryCount: 0,
            }));
            void performValidation();
          }}
          isNetworkError={validationState.networkError}
          fontSize={fontSize}
          darkMode={darkMode}
        />
      </div>
    );
  }

  // Access denied - show preview if configured
  if (validationState.isValidated && !validationState.hasAccess) {
    if (showPreviewForNonSubscribers && previewContent) {
      return (
        <div className={className}>
          <PreviewContentWrapper
            previewContent={previewContent}
            requiredTier={requiredTier}
            userTier={subscription.planId}
            onUpgradeClick={onUpgradeClick}
            fontSize={fontSize}
            darkMode={darkMode}
            isInGracePeriod={isInGracePeriod() ?? false}
            daysUntilExpiry={getDaysUntilExpiry() ?? null}
          />
        </div>
      );
    }

    if (fallbackContent) {
      return <div className={className}>{fallbackContent}</div>;
    }

    return (
      <div className={className}>
        <EnhancedAccessDeniedView
          response={validationState.response}
          requiredTier={requiredTier}
          userTier={subscription.planId}
          onUpgradeClick={onUpgradeClick}
          fontSize={fontSize}
          darkMode={darkMode}
          isInGracePeriod={isInGracePeriod() ?? false}
          daysUntilExpiry={getDaysUntilExpiry() ?? null}
        />
      </div>
    );
  }

  // Access granted
  return <div className={className}>{children}</div>;
}

// ========================================================================
// Enhanced Sub-components with Accessibility Features
// ========================================================================

function UnauthenticatedView({
  fontSize,
  darkMode,
  speakText,
}: AccessibilityProps): ReactElement {
  const title = 'Sign In Required';
  const description = 'Please sign in to access course content';
  const helpText = 'Create a free account to start learning about AI';

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card className={cn('border-2', darkMode && 'border-primary/20')}>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Lock className='h-16 w-16 text-primary' aria-hidden='true' />
          </div>
          <CardTitle
            className={cn(
              'text-2xl',
              fontSize === 'large' && 'text-3xl',
              fontSize === 'small' && 'text-xl',
            )}
          >
            {title}
          </CardTitle>
          <CardDescription
            className={cn(
              'mt-2',
              fontSize === 'large' && 'text-lg',
              fontSize === 'small' && 'text-sm',
            )}
          >
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center'>
          <p
            className={cn(
              'text-muted-foreground mb-6',
              fontSize === 'large' && 'text-lg',
              fontSize === 'small' && 'text-sm',
            )}
          >
            {helpText}
          </p>
          <Button
            size='lg'
            onClick={() => {
              if (speakText) speakText('Redirecting to sign in page');
              window.location.href = '/auth';
            }}
            className={cn(
              'min-h-[44px] min-w-[200px]',
              fontSize === 'large' && 'text-lg py-6',
              fontSize === 'small' && 'text-sm',
            )}
            aria-label='Sign in or create account to access content'
          >
            <Shield className='h-5 w-5 mr-2' aria-hidden='true' />
            Sign In or Create Account
          </Button>
          {speakText && (
            <Button
              variant='ghost'
              size='sm'
              className='mt-4'
              onClick={() => speakText(`${title}. ${description}. ${helpText}`)}
              aria-label='Read this message aloud'
            >
              <Info className='h-4 w-4 mr-2' />
              Read Aloud
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface EnhancedAccessDeniedViewProps extends AccessibilityProps {
  response?: AccessResponse;
  requiredTier: 'free' | 'advanced' | 'expert';
  userTier: 'free' | 'advanced' | 'expert';
  onUpgradeClick?: () => void;
  isInGracePeriod?: boolean;
  daysUntilExpiry?: number | null;
}

function EnhancedAccessDeniedView({
  response,
  requiredTier,
  userTier,
  onUpgradeClick,
  fontSize,
  darkMode,
  isInGracePeriod = false,
  daysUntilExpiry,
}: EnhancedAccessDeniedViewProps): ReactElement {
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
      // Note: user should be passed from parent component
      // This is a placeholder - actual implementation would need the user context
      console.warn('Upgrade requires user context from parent component');
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Card
        className={cn(
          'border-2 transition-all duration-300',
          darkMode && 'border-primary/20',
          'hover:shadow-lg',
        )}
      >
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='relative'>
              <Lock className='h-16 w-16 text-yellow-500' aria-hidden='true' />
              {isInGracePeriod && (
                <Clock className='h-6 w-6 text-orange-500 absolute -bottom-2 -right-2' />
              )}
            </div>
          </div>
          <CardTitle
            className={cn(
              'text-2xl',
              fontSize === 'large' && 'text-3xl',
              fontSize === 'small' && 'text-xl',
            )}
          >
            Upgrade to {info.name}
          </CardTitle>
          <CardDescription
            className={cn(
              'mt-2',
              fontSize === 'large' && 'text-lg',
              fontSize === 'small' && 'text-sm',
            )}
          >
            {response?.message ??
              `This content requires ${info.name} tier access`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-center'>
            {/* Grace Period Warning */}
            {isInGracePeriod && daysUntilExpiry !== null && (
              <Alert className='mb-4' variant='default'>
                <Clock className='h-4 w-4' />
                <AlertTitle>Grace Period Active</AlertTitle>
                <AlertDescription>
                  You have {daysUntilExpiry} days remaining to update your
                  payment method
                </AlertDescription>
              </Alert>
            )}

            {/* Tier Comparison */}
            <div
              className={cn(
                'inline-flex items-center gap-3 bg-muted px-4 py-2 rounded-full mb-6',
                fontSize === 'large' && 'text-lg px-5 py-3',
                fontSize === 'small' && 'text-sm px-3 py-1',
              )}
            >
              <Badge variant='outline'>
                Current: {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
              </Badge>
              <ArrowRight className='h-4 w-4 text-primary' aria-hidden='true' />
              <Badge variant='default'>{info.name}</Badge>
            </div>

            {/* Pricing */}
            <div className='mb-6'>
              <h3
                className={cn(
                  'text-3xl font-bold mb-2',
                  fontSize === 'large' && 'text-4xl',
                  fontSize === 'small' && 'text-2xl',
                )}
              >
                {info.price}
              </h3>
              <p
                className={cn(
                  'text-muted-foreground',
                  fontSize === 'large' && 'text-lg',
                  fontSize === 'small' && 'text-sm',
                )}
              >
                {info.description}
              </p>
            </div>

            {/* Features List */}
            <div
              className={cn(
                'text-left bg-muted/30 rounded-lg p-6 mb-6',
                darkMode && 'bg-muted/20',
              )}
            >
              <h4
                className={cn(
                  'font-semibold mb-4 flex items-center gap-2',
                  fontSize === 'large' && 'text-lg',
                  fontSize === 'small' && 'text-sm',
                )}
              >
                <CheckCircle
                  className='h-5 w-5 text-green-500'
                  aria-hidden='true'
                />
                What you&apos;ll unlock:
              </h4>
              <ul className='space-y-3' role='list'>
                {info.features.map((feature) => (
                  <li
                    key={feature}
                    className='flex items-start gap-3'
                    role='listitem'
                  >
                    <div
                      className='h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0'
                      aria-hidden='true'
                    />
                    <span
                      className={cn(
                        'text-foreground/90',
                        fontSize === 'large' && 'text-base',
                        fontSize === 'small' && 'text-xs',
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator className='my-6' />

            {/* Upgrade Button */}
            <Button
              onClick={() => void handleUpgrade()}
              size='lg'
              className={cn(
                'w-full min-h-[48px] transition-all duration-200',
                'hover:scale-105 focus:scale-105',
                fontSize === 'large' && 'text-lg py-6',
                fontSize === 'small' && 'text-sm py-2',
              )}
              aria-label={`Upgrade to ${info.name} plan for ${info.price}`}
            >
              <CreditCard className='h-5 w-5 mr-2' aria-hidden='true' />
              Upgrade to {info.name}
            </Button>

            {/* Additional Information */}
            <p
              className={cn(
                'text-muted-foreground mt-4',
                fontSize === 'large' && 'text-base',
                fontSize === 'small' && 'text-xs',
              )}
            >
              Cancel anytime • Secure payment • Instant access
            </p>

            {/* Expired Subscription Alert */}
            {response?.reason === 'expired' && (
              <Alert className='mt-6' variant='destructive'>
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

interface EnhancedContentSkeletonProps extends Partial<AccessibilityProps> {
  loadingMessage?: string;
  retryCount?: number;
  maxRetries?: number;
  isNetworkError?: boolean;
}

function EnhancedContentSkeleton({
  loadingMessage = 'Verifying your access...',
  fontSize = 'normal',
  darkMode = false,
  retryCount = 0,
  maxRetries = 3,
  isNetworkError = false,
}: EnhancedContentSkeletonProps): ReactElement {
  const progress = retryCount > 0 ? (retryCount / maxRetries) * 100 : 33;

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      {/* Loading Header */}
      <div className='text-center mb-8'>
        <div className='flex justify-center mb-4'>
          <CircleNotch
            className='h-12 w-12 animate-spin text-primary'
            aria-label='Loading'
          />
        </div>
        <h3
          className={cn(
            'text-lg font-medium mb-2',
            fontSize === 'large' && 'text-xl',
            fontSize === 'small' && 'text-base',
          )}
        >
          {loadingMessage}
        </h3>
        {isNetworkError && (
          <p className='text-sm text-orange-500'>
            Network issue detected. Retrying...
          </p>
        )}
        {retryCount > 0 && (
          <div className='mt-4 max-w-xs mx-auto'>
            <Progress value={progress} className='h-2' />
            <p className='text-xs text-muted-foreground mt-2'>
              Attempt {retryCount} of {maxRetries}
            </p>
          </div>
        )}
      </div>

      {/* Content Skeletons */}
      <div className='space-y-4'>
        <Skeleton className={cn('h-12 w-3/4', darkMode && 'bg-muted/20')} />
        <Skeleton className={cn('h-6 w-full', darkMode && 'bg-muted/20')} />
        <Skeleton className={cn('h-6 w-full', darkMode && 'bg-muted/20')} />
        <Skeleton className={cn('h-6 w-2/3', darkMode && 'bg-muted/20')} />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-8'>
        <Skeleton
          className={cn('h-32 rounded-lg', darkMode && 'bg-muted/20')}
        />
        <Skeleton
          className={cn('h-32 rounded-lg', darkMode && 'bg-muted/20')}
        />
      </div>

      {/* Accessibility Note */}
      <div className='text-center mt-8'>
        <p
          className={cn(
            'text-sm text-muted-foreground',
            fontSize === 'large' && 'text-base',
            fontSize === 'small' && 'text-xs',
          )}
        >
          Please wait while we verify your access permissions
        </p>
      </div>
    </div>
  );
}

interface EnhancedErrorViewProps extends Partial<AccessibilityProps> {
  error: string;
  onRetry: () => void;
  isNetworkError?: boolean;
}

function EnhancedErrorView({
  error,
  onRetry,
  isNetworkError = false,
  fontSize = 'normal',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  darkMode: _darkMode = false,
}: EnhancedErrorViewProps): ReactElement {
  return (
    <div className='max-w-2xl mx-auto p-6'>
      <Alert
        variant={isNetworkError ? 'default' : 'destructive'}
        className={cn('border-2', isNetworkError && 'border-orange-500/50')}
      >
        {isNetworkError ? (
          <WifiSlash className='h-5 w-5 text-orange-500' />
        ) : (
          <Warning className='h-5 w-5 text-destructive' />
        )}
        <AlertTitle
          className={cn(
            fontSize === 'large' && 'text-xl',
            fontSize === 'small' && 'text-base',
          )}
        >
          {isNetworkError ? 'Connection Issue' : 'Validation Error'}
        </AlertTitle>
        <AlertDescription className='mt-3'>
          <p
            className={cn(
              'mb-4',
              fontSize === 'large' && 'text-base',
              fontSize === 'small' && 'text-sm',
            )}
          >
            {error}
          </p>

          <div className='flex gap-3'>
            <Button
              variant='outline'
              size='default'
              className={cn(
                'min-h-[44px]',
                fontSize === 'large' && 'text-base',
                fontSize === 'small' && 'text-sm',
              )}
              onClick={onRetry}
              aria-label='Retry access validation'
            >
              <ArrowClockwise className='h-4 w-4 mr-2' />
              Try Again
            </Button>

            {isNetworkError && (
              <Button
                variant='ghost'
                size='default'
                className={cn(
                  'min-h-[44px]',
                  fontSize === 'large' && 'text-base',
                  fontSize === 'small' && 'text-sm',
                )}
                onClick={() => window.location.reload()}
                aria-label='Refresh the page'
              >
                Refresh Page
              </Button>
            )}
          </div>

          {isNetworkError && (
            <div className='mt-4 p-3 bg-muted/50 rounded-md'>
              <p className='text-sm font-medium mb-2'>Troubleshooting tips:</p>
              <ul className='text-sm space-y-1 list-disc list-inside'>
                <li>Check your internet connection</li>
                <li>Try disabling VPN if you&apos;re using one</li>
                <li>Clear your browser cache</li>
                <li>Try a different browser</li>
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

// ========================================================================
// Preview Content Wrapper for Non-Subscribers
// ========================================================================

interface PreviewContentWrapperProps extends AccessibilityProps {
  previewContent: ReactNode;
  requiredTier: 'free' | 'advanced' | 'expert';
  userTier: 'free' | 'advanced' | 'expert';
  onUpgradeClick?: () => void;
  isInGracePeriod?: boolean;
  daysUntilExpiry?: number | null;
}

function PreviewContentWrapper({
  previewContent,
  requiredTier,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userTier: _userTier,
  onUpgradeClick,
  fontSize,
  darkMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isInGracePeriod: _isInGracePeriod,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  daysUntilExpiry: _daysUntilExpiry,
}: PreviewContentWrapperProps): ReactElement {
  const tierNames = {
    free: 'Free',
    advanced: 'Advanced',
    expert: 'Expert',
  };

  return (
    <div className='relative'>
      {/* Preview Banner */}
      <div
        className={cn(
          'mb-6 p-4 rounded-lg border-2 border-dashed',
          'bg-gradient-to-r from-primary/5 to-primary/10',
          darkMode && 'from-primary/10 to-primary/20',
        )}
      >
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3'>
            <Info className='h-5 w-5 text-primary flex-shrink-0' />
            <div>
              <h3
                className={cn(
                  'font-semibold',
                  fontSize === 'large' && 'text-lg',
                  fontSize === 'small' && 'text-sm',
                )}
              >
                Preview Mode
              </h3>
              <p
                className={cn(
                  'text-muted-foreground',
                  fontSize === 'large' && 'text-base',
                  fontSize === 'small' && 'text-xs',
                )}
              >
                Upgrade to {tierNames[requiredTier]} to access full content
              </p>
            </div>
          </div>

          {onUpgradeClick && (
            <Button
              size='sm'
              onClick={onUpgradeClick}
              className={cn(
                'min-h-[36px]',
                fontSize === 'large' && 'text-base px-4',
                fontSize === 'small' && 'text-xs px-2',
              )}
            >
              Unlock Full Access
            </Button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className='relative'>
        {previewContent}

        {/* Fade Out Overlay */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 h-32',
            'bg-gradient-to-t from-background to-transparent',
            'pointer-events-none',
          )}
          aria-hidden='true'
        />
      </div>

      {/* Upgrade CTA at Bottom */}
      <div
        className={cn(
          'mt-8 p-6 text-center rounded-lg',
          'bg-muted/50 border-2 border-primary/20',
        )}
      >
        <Lock className='h-8 w-8 text-primary mx-auto mb-3' />
        <h4
          className={cn(
            'font-semibold mb-2',
            fontSize === 'large' && 'text-xl',
            fontSize === 'small' && 'text-base',
          )}
        >
          Continue Reading with {tierNames[requiredTier]}
        </h4>
        <p
          className={cn(
            'text-muted-foreground mb-4',
            fontSize === 'large' && 'text-base',
            fontSize === 'small' && 'text-sm',
          )}
        >
          Get unlimited access to all course materials and features
        </p>
        {onUpgradeClick && (
          <Button
            size='lg'
            onClick={onUpgradeClick}
            className={cn(
              'min-h-[48px]',
              fontSize === 'large' && 'text-lg px-6',
              fontSize === 'small' && 'text-sm px-4',
            )}
          >
            <ArrowRight className='h-5 w-5 mr-2' />
            Upgrade Now
          </Button>
        )}
      </div>
    </div>
  );
}

// ========================================================================
// Export additional utility components
// ========================================================================

export {
  UnauthenticatedView,
  EnhancedAccessDeniedView,
  EnhancedContentSkeleton,
  EnhancedErrorView,
  PreviewContentWrapper,
};
