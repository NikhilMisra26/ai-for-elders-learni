import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  User,
  EnvelopeSimple,
  Star,
  Gear,
  Download,
  Shield,
  ChartBar,
  Trophy,
  Fire,
  Clock,
  Lock,
} from '@phosphor-icons/react';
import type { ReactElement } from 'react';

import { AuthForm } from './AuthForm';
import { EmailSupportDialog } from './EmailSupportDialog';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, formatPrice, useInvoiceHistory } from '@/lib/subscription';
import { useProgress } from '@/lib/progressTracking';

// Commented out unused interface - keeping for potential future use
// interface AccountPageProps {
//   onAuthClick: () => void;
// }

function AccountPageComponent(): ReactElement {
  const { user } = useAuth();
  const {
    subscription,
    getCurrentPlan,
    // canAccessTier,
    startTrial: _startTrial,
    upgradeToPaid: _upgradeToPaid,
    cancelSubscription,
    reactivateSubscription,
    // getDaysUntilExpiry, // Commented out - unused for now
  } = useSubscription();
  const { learningStats } = useProgress();
  const { invoices } = useInvoiceHistory();

  // Start of removed code for subscription removal
  // const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  // const [selectedPlan, setSelectedPlan] = useState<'advanced' | 'expert'>(
  //   'advanced',
  // );
  // const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // const [showCancelDialog, setShowCancelDialog] = useState(false);
  // End of removed code for subscription removal

  // Added for subscription removal - keeping state variables but unused
  const [_showUpgradeDialog] = useState(false);
  const [_selectedPlan] = useState<'advanced' | 'expert'>('advanced');
  const [_isProcessingPayment] = useState(false);
  const [_showCancelDialog, setShowCancelDialog] = useState(false);

  // Email support dialog state
  const [showEmailSupportDialog, setShowEmailSupportDialog] = useState(false);

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Card className='max-w-md'>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm onClose={() => handleNavigation('home')} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // @ts-expect-error - Plan data may be used for display in the future
  const _currentPlan = getCurrentPlan();
  // Commented out unused variable - keeping for potential future use
  // const _daysUntilExpiry = getDaysUntilExpiry();

  // Start of removed code for subscription removal
  // const handleUpgrade = async (
  //   planId: 'advanced' | 'expert',
  // ): Promise<void> => {
  //   setIsProcessingPayment(true);

  //   try {
  //     if (subscription.status === 'trial' || subscription.planId === 'free') {
  //       // Start trial for new users
  //       startTrial(planId);
  //       toast.success(
  //         `🎉 ${planId === 'advanced' ? '7' : '14'}-day free trial started!`,
  //         {
  //           description: 'You now have access to all premium content',
  //         },
  //       );
  //     } else {
  //       // Simulate payment for existing users
  //       const result = await simulatePaymentFlow(planId);

  //       if (result.success && result.paymentMethod) {
  //         upgradeToPaid(planId, result.paymentMethod);
  //         toast.success('Subscription upgraded successfully!', {
  //           description: 'You now have access to all premium content',
  //         });
  //       } else {
  //         toast.error('Payment failed', {
  //           description: result.error ?? 'Please try again',
  //         });
  //       }
  //     }
  //   } catch {
  //     toast.error('Upgrade failed', {
  //       description: 'Please try again or contact support',
  //     });
  //   } finally {
  //     setIsProcessingPayment(false);
  //     setShowUpgradeDialog(false);
  //   }
  // };
  // End of removed code for subscription removal

  // Added for subscription removal - placeholder function
  // @ts-expect-error - Handlers may be used when subscriptions are re-enabled
  const _handleUpgrade = async (_planId: 'advanced' | 'expert'): Promise<void> => {
    toast.info('Coming Soon', {
      description: 'Premium subscriptions will be available in the future',
    });
  };

  // @ts-expect-error - Handlers may be used when subscriptions are re-enabled
  const _handleCancelSubscription = (): void => {
    if (subscription.planId === 'free') return;

    cancelSubscription();
    toast.success('Subscription cancelled', {
      description: 'You will retain access until your current billing period ends',
    });
    setShowCancelDialog(false);
  };

  // @ts-expect-error - Handlers may be used when subscriptions are re-enabled
  const _handleReactivate = (): void => {
    reactivateSubscription();
    toast.success('Subscription reactivated!', {
      description: 'Your subscription will continue as normal',
    });
  };

  const handleNavigation = (page: string): void => {
    // In a real app, this would use proper routing
    // For now, we'll use window.location or emit a navigation event
    window.location.hash = `#/${page}`;
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl font-bold mb-2'>Account Settings</h1>
          <p className='text-xl text-muted-foreground'>
            Manage your profile, subscription, and learning preferences
          </p>
        </div>

        <div className='grid lg:grid-cols-3 gap-8'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='w-5 h-5' />
                  Profile Information
                </CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm font-medium text-muted-foreground'>Name</Label>
                    <p className='text-lg'>{user.name}</p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-muted-foreground'>Email</Label>
                    <p className='text-lg'>{user.email}</p>
                  </div>
                </div>

                <Separator />

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm font-medium text-muted-foreground'>
                      Member Since
                    </Label>
                    <p className='text-lg'>{new Date(user.joinDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-muted-foreground'>
                      Account Status
                    </Label>
                    <Badge variant='secondary'>Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Start of removed code for subscription removal - Subscription Management */}
            {/* <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CreditCard className='w-5 h-5' />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Manage your learning plan and billing
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='p-4 bg-muted/30 rounded-lg'>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <h3 className='text-lg font-semibold'>
                        {currentPlan.name}
                      </h3>
                      <p className='text-muted-foreground'>
                        {currentPlan.description}
                      </p>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-primary'>
                        {formatPrice(currentPlan.price)}
                        {currentPlan.price > 0 && (
                          <span className='text-sm text-muted-foreground'>
                            /month
                          </span>
                        )}
                      </div>
                      <Badge
                        variant={
                          subscription.planId === 'free'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {subscription.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {subscription.status === 'trial' &&
                    subscription.trialEndDate && (
                      <div className='p-3 bg-blue-50 border border-blue-200 rounded-md mb-4'>
                        <div className='flex items-center gap-2 text-blue-800'>
                          <Gift className='w-4 h-4' />
                          <span className='font-medium'>Free Trial Active</span>
                        </div>
                        <p className='text-sm text-blue-600 mt-1'>
                          Your trial ends on{' '}
                          {new Date(
                            subscription.trialEndDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                  {subscription.cancelAtPeriodEnd && (
                    <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4'>
                      <div className='flex items-center gap-2 text-yellow-800'>
                        <Warning className='w-4 h-4' />
                        <span className='font-medium'>
                          Subscription Cancelled
                        </span>
                      </div>
                      <p className='text-sm text-yellow-600 mt-1'>
                        Your subscription will end on{' '}
                        {subscription.endDate &&
                          new Date(subscription.endDate).toLocaleDateString()}
                      </p>
                      <Button
                        size='sm'
                        variant='outline'
                        className='mt-2'
                        onClick={handleReactivate}
                      >
                        Reactivate Subscription
                      </Button>
                    </div>
                  )}

                  <div>
                    <h4 className='font-medium mb-3'>What&apos;s included:</h4>
                    <ul className='space-y-2'>
                      {currentPlan.features.slice(0, 4).map((feature) => (
                        <li
                          key={feature}
                          className='flex items-center gap-2 text-sm'
                        >
                          <CheckCircle className='w-4 h-4 text-green-500' />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className='flex gap-3 mt-6'>
                    {subscription.planId === 'free' ? (
                      <Button onClick={() => setShowUpgradeDialog(true)}>
                        Upgrade Plan
                        <Crown className='w-4 h-4 ml-2' />
                      </Button>
                    ) : (
                      <>
                        {subscription.planId === 'advanced' && (
                          <Button
                            onClick={() => {
                              setSelectedPlan('expert');
                              setShowUpgradeDialog(true);
                            }}
                          >
                            Upgrade to Expert
                            <ArrowRight className='w-4 h-4 ml-2' />
                          </Button>
                        )}
                        {!subscription.cancelAtPeriodEnd && (
                          <Button
                            variant='outline'
                            onClick={() => setShowCancelDialog(true)}
                          >
                            Cancel Subscription
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {subscription.nextBillingDate &&
                  subscription.status === 'active' && (
                    <div className='p-3 border rounded-md'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <p className='font-medium'>Next Billing Date</p>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(
                              subscription.nextBillingDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='font-medium'>
                            {formatPrice(currentPlan.price)}
                          </p>
                          {subscription.paymentMethod && (
                            <p className='text-sm text-muted-foreground'>
                              •••• {subscription.paymentMethod.last4}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card> */}
            {/* End of removed code for subscription removal */}

            {/* Learning Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ChartBar className='w-5 h-5' />
                  Learning Statistics
                </CardTitle>
                <CardDescription>Your learning progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
                  <div className='text-center'>
                    <Trophy className='w-8 h-8 mx-auto mb-2 text-yellow-500' />
                    <div className='text-2xl font-bold'>{learningStats.modulesCompleted}</div>
                    <div className='text-sm text-muted-foreground'>Modules Completed</div>
                  </div>
                  <div className='text-center'>
                    <Clock className='w-8 h-8 mx-auto mb-2 text-blue-500' />
                    <div className='text-2xl font-bold'>
                      {Math.round(learningStats.totalTimeSpent / 60)}h
                    </div>
                    <div className='text-sm text-muted-foreground'>Hours Learned</div>
                  </div>
                  <div className='text-center'>
                    <Fire className='w-8 h-8 mx-auto mb-2 text-orange-500' />
                    <div className='text-2xl font-bold'>{learningStats.streak.currentStreak}</div>
                    <div className='text-sm text-muted-foreground'>Day Streak</div>
                  </div>
                  <div className='text-center'>
                    <Star className='w-8 h-8 mx-auto mb-2 text-purple-500' />
                    <div className='text-2xl font-bold'>
                      {learningStats.averageRating.toFixed(1)}
                    </div>
                    <div className='text-sm text-muted-foreground'>Avg Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            {invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Download className='w-5 h-5' />
                    Billing History
                  </CardTitle>
                  <CardDescription>Download your past invoices and receipts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {invoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice.id}
                        className='flex items-center justify-between p-3 border rounded-md'
                      >
                        <div>
                          <p className='font-medium'>{invoice.planName}</p>
                          <p className='text-sm text-muted-foreground'>
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <Badge variant={invoice.status === 'paid' ? 'secondary' : 'destructive'}>
                            {invoice.status}
                          </Badge>
                          <span className='font-medium'>{formatPrice(invoice.amount)}</span>
                          <Button size='sm' variant='outline'>
                            <Download className='w-4 h-4' />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Gear className='w-5 h-5' />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='default'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('dashboard')}
                >
                  <ChartBar className='w-4 h-4 mr-2' />
                  View Dashboard
                </Button>
                <Button
                  variant='default'
                  className='w-full justify-start'
                  onClick={() => handleNavigation('courses')}
                >
                  <Trophy className='w-4 h-4 mr-2' />
                  Browse Courses
                </Button>
                {/* Start of removed code for subscription removal */}
                {/* {subscription.planId === 'free' && (
                  <Button
                    className='w-full justify-start'
                    onClick={() => setShowUpgradeDialog(true)}
                  >
                    <Crown className='w-4 h-4 mr-2' />
                    Upgrade Plan
                  </Button>
                )} */}
                {/* End of removed code for subscription removal */}
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='w-5 h-5' />
                  Support & Help
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  Need help with your account or have questions about our courses?
                </p>
                <div className='space-y-2'>
                  <Button
                    variant='default'
                    size='sm'
                    className='w-full'
                    onClick={() => setShowEmailSupportDialog(true)}
                  >
                    <EnvelopeSimple className='w-4 h-4 mr-2' />
                    Email Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Security */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='w-5 h-5' />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm flex items-center gap-2'>
                    <Lock className='w-4 h-4' />
                    Password
                  </span>
                  <Button
                    variant='default'
                    size='sm'
                    onClick={(): void => {
                      // Password change functionality would go here
                      toast.info('Coming Soon', {
                        description: 'Password change feature will be available soon',
                      });
                    }}
                  >
                    Change
                  </Button>
                </div>
                <Separator />
                <div className='text-sm text-muted-foreground'>
                  Last login: {new Date().toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Start of removed code for subscription removal - Upgrade and Cancel Dialogs */}
        {/* <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Upgrade Your Learning Experience</DialogTitle>
              <DialogDescription>
                Choose a plan that fits your learning goals and unlock premium
                content
              </DialogDescription>
            </DialogHeader>

            <div className='grid md:grid-cols-2 gap-4'>
              {subscriptionPlans
                .filter((plan) => plan.id !== 'free')
                .map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-colors ${
                      selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                    } ${plan.popular ? 'border-primary' : ''}`}
                    onClick={() =>
                      setSelectedPlan(plan.id as 'advanced' | 'expert')
                    }
                  >
                    {plan.popular && (
                      <Badge className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                        Most Popular
                      </Badge>
                    )}
                    <CardHeader className='text-center'>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className='text-3xl font-bold text-primary'>
                        {formatPrice(plan.price)}
                        <span className='text-lg text-muted-foreground'>
                          /month
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className='space-y-2'>
                        {plan.features.slice(0, 4).map((feature) => (
                          <li
                            key={feature}
                            className='flex items-center gap-2 text-sm'
                          >
                            <CheckCircle className='w-4 h-4 text-green-500' />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                variant='outline'
                onClick={() => setShowUpgradeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleUpgrade(selectedPlan)}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? 'Processing...' : 'Start Free Trial'}
                <Crown className='w-4 h-4 ml-2' />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Subscription</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your subscription? You&apos;ll
                lose access to premium content at the end of your billing
                period.
              </DialogDescription>
            </DialogHeader>

            <div className='flex justify-end gap-3'>
              <Button
                variant='outline'
                onClick={() => setShowCancelDialog(false)}
              >
                Keep Subscription
              </Button>
              <Button variant='destructive' onClick={handleCancelSubscription}>
                <X className='w-4 h-4 mr-2' />
                Cancel Subscription
              </Button>
            </div>
          </DialogContent>

        </Dialog>

        {/* Password Change Dialog */}
        {/* <PasswordChangeDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
        /> */}
        {/* End of removed code for subscription removal */}

        {/* Email Support Dialog */}
        <EmailSupportDialog
          open={showEmailSupportDialog}
          onOpenChange={setShowEmailSupportDialog}
        />
      </div>
    </div>
  );
}

// Memoized export for performance optimization
export const AccountPage = React.memo(AccountPageComponent);
