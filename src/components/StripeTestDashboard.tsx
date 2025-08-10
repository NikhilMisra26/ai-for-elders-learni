import type { ReactElement } from 'react';
import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Warning,
  Users,
  Globe,
  Database,
  TestTube,
  Copy,
  ArrowClockwise,
  CurrencyDollar,
  Shield,
} from '@phosphor-icons/react';

import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useSubscription } from '@/lib/subscription';
import { getStripe, STRIPE_PRICES } from '@/lib/stripe';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Test card numbers for different scenarios
const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  fraud: '4000000000000069',
  incorrect_cvc: '4000000000000127',
  expired: '4000000000000069',
  processing_error: '4000000000000119',
  require_3d_secure: '4000002500003155',
} as const;

type TestCardType = keyof typeof TEST_CARDS;

interface TestUser {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'advanced' | 'expert';
  created: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  data: Record<string, unknown>;
}

interface PaymentTest {
  id: string;
  cardType: TestCardType;
  planId: 'advanced' | 'expert';
  status: 'pending' | 'success' | 'failed' | 'processing';
  timestamp: string;
  error?: string;
  sessionId?: string;
}

/**
 * Comprehensive Stripe testing dashboard for payment scenarios
 * Development/testing component only - not for production use
 */
export function StripeTestDashboard(): ReactElement {
  const { user, updateTier } = useAuth();
  const { fontSize } = useAccessibility();
  const { subscription, updateSubscription } = useSubscription();

  // Test state management
  const [testUsers] = useState<TestUser[]>([
    {
      id: '1',
      email: 'test.free@example.com',
      name: 'Test Free User',
      tier: 'free',
      created: '2024-01-01',
    },
    {
      id: '2',
      email: 'test.advanced@example.com',
      name: 'Test Advanced User',
      tier: 'advanced',
      created: '2024-01-02',
    },
    {
      id: '3',
      email: 'test.expert@example.com',
      name: 'Test Expert User',
      tier: 'expert',
      created: '2024-01-03',
    },
  ]);

  const [selectedTestUser, setSelectedTestUser] = useState<string>('1');
  const [selectedCard, setSelectedCard] = useState<TestCardType>('success');
  const [selectedPlan, setSelectedPlan] = useState<'advanced' | 'expert'>(
    'advanced',
  );
  const [paymentTests, setPaymentTests] = useState<PaymentTest[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isTestMode] = useState(true);
  const [stripeLoaded, setStripeLoaded] = useState(false);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async (): Promise<void> => {
      try {
        const stripe = await getStripe();
        setStripeLoaded(!!stripe);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
        setStripeLoaded(false);
      }
    };
    void initStripe();
  }, []);

  // Test mode warning
  useEffect(() => {
    if (import.meta.env.MODE === 'production') {
      console.warn('StripeTestDashboard should not be used in production');
    }
  }, []);

  const runPaymentTest = async (): Promise<void> => {
    if (!user) return;

    const testId = `test_${Date.now()}`;
    const newTest: PaymentTest = {
      id: testId,
      cardType: selectedCard,
      planId: selectedPlan,
      status: 'processing',
      timestamp: new Date().toISOString(),
    };

    setPaymentTests((prev) => [newTest, ...prev]);

    try {
      // Simulate different card scenarios
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate processing delay

      if (selectedCard === 'success') {
        // Success scenario
        setPaymentTests((prev) =>
          prev.map((test) =>
            test.id === testId
              ? { ...test, status: 'success', sessionId: `cs_test_${testId}` }
              : test,
          ),
        );

        // Update subscription locally for testing
        updateSubscription({
          planId: selectedPlan,
          status: 'active',
          nextBillingDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'visa',
          },
          autoRenew: true,
        });

        // Add webhook event
        addWebhookEvent('payment_intent.succeeded', 'success', {
          amount: STRIPE_PRICES[selectedPlan].amount,
          currency: 'usd',
          payment_method: { last4: '4242', brand: 'visa' },
        });
      } else {
        // Failure scenarios
        const errorMessages: Record<TestCardType, string> = {
          success: '',
          decline: 'Your card was declined.',
          insufficient_funds: 'Your card has insufficient funds.',
          fraud: 'Your card was declined due to fraud protection.',
          incorrect_cvc: "Your card's security code is incorrect.",
          expired: 'Your card has expired.',
          processing_error: 'An error occurred while processing your card.',
          require_3d_secure: '3D Secure authentication required.',
        };

        const error = errorMessages[selectedCard];
        setPaymentTests((prev) =>
          prev.map((test) =>
            test.id === testId ? { ...test, status: 'failed', error } : test,
          ),
        );

        // Add webhook event for failure
        addWebhookEvent('payment_intent.payment_failed', 'failed', {
          error: { message: error },
          payment_method: { last4: TEST_CARDS[selectedCard].slice(-4) },
        });
      }
    } catch {
      setPaymentTests((prev) =>
        prev.map((test) =>
          test.id === testId
            ? { ...test, status: 'failed', error: 'Test execution failed' }
            : test,
        ),
      );
    }
  };

  const addWebhookEvent = (
    type: string,
    status: 'success' | 'failed',
    data: Record<string, unknown>,
  ): void => {
    const event: WebhookEvent = {
      id: `evt_${Date.now()}`,
      type,
      status,
      timestamp: new Date().toISOString(),
      data,
    };
    setWebhookEvents((prev) => [event, ...prev.slice(0, 9)]); // Keep last 10 events
  };

  const simulateSubscriptionChange = (
    newTier: 'free' | 'advanced' | 'expert',
  ): void => {
    updateTier(newTier);
    updateSubscription({
      planId: newTier,
      status: newTier === 'free' ? 'active' : 'active',
      startDate: new Date().toISOString(),
      nextBillingDate:
        newTier !== 'free'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
    });
  };

  const openStripePortalTest = async (): Promise<void> => {
    if (!user) return;

    // In test mode, simulate opening portal
    addWebhookEvent('customer.portal.session.created', 'success', {
      customer: user.id,
      url: `https://billing.stripe.com/p/session/test_${Date.now()}`,
    });
  };

  const copyTestCard = (cardNumber: string): void => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(cardNumber);
    }
  };

  const getStatusIcon = (status: string): ReactElement => {
    switch (status) {
      case 'success':
      case 'active':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'failed':
      case 'cancelled':
      case 'expired':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'processing':
      case 'pending':
        return (
          <ArrowClockwise className='h-4 w-4 text-yellow-500 animate-spin' />
        );
      default:
        return <Warning className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadgeVariant = (
    status: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'success':
      case 'active':
        return 'default';
      case 'failed':
      case 'cancelled':
      case 'expired':
        return 'destructive';
      case 'processing':
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!user) {
    return (
      <div className='max-w-4xl mx-auto p-6'>
        <Alert>
          <Shield className='h-4 w-4' />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to access the Stripe testing dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'max-w-6xl mx-auto p-6 space-y-6',
        fontSize === 'large' && 'text-lg',
        fontSize === 'small' && 'text-sm',
      )}
    >
      {/* Test Mode Warning */}
      <Alert className='border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'>
        <TestTube className='h-4 w-4' />
        <AlertTitle className='text-yellow-800 dark:text-yellow-200'>
          Development Testing Mode
        </AlertTitle>
        <AlertDescription className='text-yellow-700 dark:text-yellow-300'>
          This dashboard is for testing Stripe payments safely. No real money
          will be charged. Stripe Status:{' '}
          {stripeLoaded ? 'Loaded' : 'Not Loaded'}
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Stripe Test Dashboard
          </h1>
          <p className='text-muted-foreground mt-2'>
            Test payment flows, subscriptions, and webhook events
          </p>
        </div>
        <Badge
          variant={isTestMode ? 'default' : 'destructive'}
          className='px-3 py-1'
        >
          {isTestMode ? 'Test Mode' : 'Live Mode'}
        </Badge>
      </div>

      <Tabs defaultValue='payments' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='payments'>Payment Tests</TabsTrigger>
          <TabsTrigger value='subscriptions'>Subscriptions</TabsTrigger>
          <TabsTrigger value='webhooks'>Webhooks</TabsTrigger>
          <TabsTrigger value='users'>Test Users</TabsTrigger>
          <TabsTrigger value='database'>Database State</TabsTrigger>
        </TabsList>

        {/* Payment Tests Tab */}
        <TabsContent value='payments' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Test Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CreditCard className='h-5 w-5' />
                  Payment Test Configuration
                </CardTitle>
                <CardDescription>
                  Configure test payment scenarios with different card types
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='test-user'>Test User</Label>
                  <Select
                    value={selectedTestUser}
                    onValueChange={setSelectedTestUser}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {testUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.tier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='subscription-plan'>Subscription Plan</Label>
                  <Select
                    value={selectedPlan}
                    onValueChange={(value: 'advanced' | 'expert') =>
                      setSelectedPlan(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='advanced'>
                        Advanced ($1.99/month)
                      </SelectItem>
                      <SelectItem value='expert'>
                        Expert ($4.99/month)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='test-card'>Test Card Scenario</Label>
                  <Select
                    value={selectedCard}
                    onValueChange={(value: TestCardType) =>
                      setSelectedCard(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='success'>Success (4242...)</SelectItem>
                      <SelectItem value='decline'>Card Declined</SelectItem>
                      <SelectItem value='insufficient_funds'>
                        Insufficient Funds
                      </SelectItem>
                      <SelectItem value='fraud'>Fraud Prevention</SelectItem>
                      <SelectItem value='incorrect_cvc'>
                        Incorrect CVC
                      </SelectItem>
                      <SelectItem value='expired'>Expired Card</SelectItem>
                      <SelectItem value='processing_error'>
                        Processing Error
                      </SelectItem>
                      <SelectItem value='require_3d_secure'>
                        3D Secure Required
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button
                  onClick={() => void runPaymentTest()}
                  className='w-full'
                  size='lg'
                >
                  <TestTube className='h-4 w-4 mr-2' />
                  Run Payment Test
                </Button>
              </CardContent>
            </Card>

            {/* Test Card Reference */}
            <Card>
              <CardHeader>
                <CardTitle>Test Card Numbers</CardTitle>
                <CardDescription>
                  Click to copy test card numbers for manual testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {Object.entries(TEST_CARDS).map(([type, cardNumber]) => (
                    <div
                      key={type}
                      className='flex items-center justify-between p-2 border rounded-lg'
                    >
                      <div className='flex-1'>
                        <div className='text-sm font-medium capitalize'>
                          {type.replace('_', ' ')}
                        </div>
                        <div className='text-xs text-muted-foreground font-mono'>
                          {cardNumber}
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => copyTestCard(cardNumber)}
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5' />
                Payment Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentTests.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No payment tests run yet. Run a test above to see results.
                </div>
              ) : (
                <div className='space-y-3'>
                  {paymentTests.map((test) => (
                    <div
                      key={test.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        {getStatusIcon(test.status)}
                        <div>
                          <div className='text-sm font-medium'>
                            {test.cardType.replace('_', ' ')} → {test.planId}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {new Date(test.timestamp).toLocaleString()}
                          </div>
                          {test.error && (
                            <div className='text-xs text-red-500 mt-1'>
                              {test.error}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(test.status)}>
                        {test.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value='subscriptions' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CurrencyDollar className='h-5 w-5' />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span>Plan</span>
                  <Badge variant={getStatusBadgeVariant(subscription.status)}>
                    {subscription.planId}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Status</span>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(subscription.status)}
                    <span className='text-sm'>{subscription.status}</span>
                  </div>
                </div>
                {subscription.nextBillingDate && (
                  <div className='flex items-center justify-between'>
                    <span>Next Billing</span>
                    <span className='text-sm'>
                      {new Date(
                        subscription.nextBillingDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {subscription.paymentMethod && (
                  <div className='flex items-center justify-between'>
                    <span>Payment Method</span>
                    <span className='text-sm'>
                      {subscription.paymentMethod.brand} ••••{' '}
                      {subscription.paymentMethod.last4}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Test subscription changes and portal access
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  onClick={() => simulateSubscriptionChange('free')}
                  variant='outline'
                  className='w-full'
                >
                  Switch to Free
                </Button>
                <Button
                  onClick={() => simulateSubscriptionChange('advanced')}
                  variant='outline'
                  className='w-full'
                >
                  Switch to Advanced
                </Button>
                <Button
                  onClick={() => simulateSubscriptionChange('expert')}
                  variant='outline'
                  className='w-full'
                >
                  Switch to Expert
                </Button>
                <Separator />
                <Button
                  onClick={() => void openStripePortalTest()}
                  className='w-full'
                >
                  Open Customer Portal (Test)
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value='webhooks' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='h-5 w-5' />
                Webhook Events
              </CardTitle>
              <CardDescription>
                Recent webhook events and their processing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {webhookEvents.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  No webhook events yet. Run payment tests to generate events.
                </div>
              ) : (
                <div className='space-y-3'>
                  {webhookEvents.map((event) => (
                    <div key={event.id} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-3'>
                          {getStatusIcon(event.status)}
                          <span className='font-medium text-sm'>
                            {event.type}
                          </span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className='text-xs text-muted-foreground mb-2'>
                        {new Date(event.timestamp).toLocaleString()}
                      </div>
                      <details className='text-xs'>
                        <summary className='cursor-pointer text-muted-foreground'>
                          Event Data
                        </summary>
                        <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-auto'>
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Users Tab */}
        <TabsContent value='users' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Test User Profiles
              </CardTitle>
              <CardDescription>
                Predefined test users with different subscription tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {testUsers.map((testUser) => (
                  <div
                    key={testUser.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div>
                      <div className='font-medium'>{testUser.name}</div>
                      <div className='text-sm text-muted-foreground'>
                        {testUser.email}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Created: {testUser.created}
                      </div>
                    </div>
                    <div className='text-right'>
                      <Badge
                        variant={
                          testUser.tier === 'free' ? 'secondary' : 'default'
                        }
                      >
                        {testUser.tier}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database State Tab */}
        <TabsContent value='database' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                Database State Verification
              </CardTitle>
              <CardDescription>
                Current user profile and subscription data
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='font-medium mb-2'>User Profile</h4>
                <div className='p-3 bg-muted rounded-lg text-sm space-y-1'>
                  <div>ID: {user.id}</div>
                  <div>Email: {user.email}</div>
                  <div>Name: {user.name}</div>
                  <div>Tier: {user.tier}</div>
                  <div>Verified: {user.verified ? 'Yes' : 'No'}</div>
                  <div>Join Date: {user.joinDate}</div>
                </div>
              </div>

              <div>
                <h4 className='font-medium mb-2'>Subscription Data</h4>
                <div className='p-3 bg-muted rounded-lg text-sm space-y-1'>
                  <div>Plan: {subscription.planId}</div>
                  <div>Status: {subscription.status}</div>
                  <div>
                    Start Date:{' '}
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </div>
                  {subscription.endDate && (
                    <div>
                      End Date:{' '}
                      {new Date(subscription.endDate).toLocaleDateString()}
                    </div>
                  )}
                  {subscription.nextBillingDate && (
                    <div>
                      Next Billing:{' '}
                      {new Date(
                        subscription.nextBillingDate,
                      ).toLocaleDateString()}
                    </div>
                  )}
                  <div>Auto Renew: {subscription.autoRenew ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <Button variant='outline' className='w-full'>
                <ArrowClockwise className='h-4 w-4 mr-2' />
                Refresh Database State
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
