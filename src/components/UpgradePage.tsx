/**
 * UpgradePage Component
 *
 * Dedicated upgrade flow with clear pricing and benefits
 * optimized for senior users.
 */

import React, { useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Check,
  ArrowLeft,
  Lock,
  Star,
  Clock,
  Users,
  BookOpen,
  Trophy,
  Info,
} from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, processStripePayment } from '@/lib/subscription';

interface UpgradePageProps {
  requiredTier?: 'advanced' | 'expert';
  onBack?: () => void;
  onUpgradeSuccess?: () => void;
}

interface PlanDetails {
  tier: 'advanced' | 'expert';
  name: string;
  price: string;
  priceValue: number;
  description: string;
  features: string[];
  courses: string[];
  highlighted?: boolean;
}

export function UpgradePage({
  requiredTier,
  onBack,
  onUpgradeSuccess,
}: UpgradePageProps): ReactElement {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [processingTier, setProcessingTier] = useState<
    'advanced' | 'expert' | null
  >(null);

  const plans: PlanDetails[] = [
    {
      tier: 'advanced',
      name: 'Advanced',
      price: '$1.99',
      priceValue: 1.99,
      description: 'Perfect for beginners ready to explore AI tools',
      features: [
        'AI as Your Personal Assistant course',
        'Advanced prompting techniques',
        'AI tools and apps guidance',
        'Health & finance AI applications',
        'Email support',
        'Monthly live Q&A sessions',
      ],
      courses: [
        'AI as Your Personal Assistant',
        'Smart Health Management with AI',
        'AI for Personal Finance',
      ],
      highlighted: requiredTier === 'advanced',
    },
    {
      tier: 'expert',
      name: 'Expert',
      price: '$4.99',
      priceValue: 4.99,
      description: 'For those ready to master cutting-edge AI',
      features: [
        'Everything in Advanced, plus:',
        'Advanced AI for Active Seniors course',
        'Autonomous AI agents training',
        'Model Context Protocol (MCP)',
        'Custom AI assistant creation',
        'Priority support',
        'Weekly group coaching calls',
        'Early access to new content',
      ],
      courses: [
        'All Advanced courses',
        'Advanced AI for Active Seniors',
        'Building Your AI Assistant',
        'AI Automation Mastery',
      ],
      highlighted: requiredTier === 'expert',
    },
  ];

  const handleUpgrade = async (tier: 'advanced' | 'expert'): Promise<void> => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setProcessingTier(tier);

    try {
      const success = await processStripePayment(tier, user.id, user.email);

      if (success) {
        toast.success('Subscription upgraded successfully!', {
          description: `Welcome to the ${tier} tier! You now have access to premium content.`,
        });

        if (onUpgradeSuccess) {
          setTimeout(onUpgradeSuccess, 1500);
        }
      } else {
        toast.error('Upgrade failed', {
          description:
            'There was an issue processing your upgrade. Please try again.',
        });
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Upgrade failed', {
        description: 'An unexpected error occurred. Please try again later.',
      });
    } finally {
      setProcessingTier(null);
    }
  };

  const currentTierIndex =
    subscription.planId === 'expert'
      ? 2
      : subscription.planId === 'advanced'
        ? 1
        : 0;

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-muted/20'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Header */}
        <div className='mb-8'>
          {onBack && (
            <Button variant='ghost' onClick={onBack} className='mb-4'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
          )}

          <h1 className='text-4xl font-bold mb-4'>Choose Your Learning Path</h1>
          <p className='text-xl text-muted-foreground'>
            Unlock premium AI courses designed specifically for adults 50+
          </p>
        </div>

        {/* Current Plan Alert */}
        {user && subscription.planId !== 'free' && (
          <Alert className='mb-6'>
            <Info className='h-4 w-4' />
            <AlertDescription>
              You're currently on the <strong>{subscription.planId}</strong>{' '}
              plan.
              {subscription.planId === 'advanced' &&
                ' Upgrade to Expert for access to all content!'}
              {subscription.planId === 'expert' &&
                ' You already have access to all content!'}
            </AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className='grid md:grid-cols-2 gap-6 mb-12'>
          {plans.map((plan) => {
            const isCurrentPlan = subscription.planId === plan.tier;
            const canUpgrade =
              currentTierIndex < (plan.tier === 'expert' ? 2 : 1);

            return (
              <Card
                key={plan.tier}
                className={`relative overflow-hidden transition-all ${
                  plan.highlighted
                    ? 'ring-2 ring-primary shadow-lg scale-105'
                    : 'hover:shadow-md'
                } ${isCurrentPlan ? 'bg-muted/30' : ''}`}
              >
                {plan.highlighted && (
                  <div className='absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl-lg'>
                    Recommended
                  </div>
                )}

                <CardHeader>
                  <div className='flex items-center justify-between mb-2'>
                    <CardTitle className='text-2xl'>{plan.name}</CardTitle>
                    {isCurrentPlan && (
                      <Badge variant='secondary'>Current Plan</Badge>
                    )}
                  </div>
                  <CardDescription className='text-base'>
                    {plan.description}
                  </CardDescription>
                  <div className='flex items-baseline gap-1 mt-4'>
                    <span className='text-4xl font-bold'>{plan.price}</span>
                    <span className='text-muted-foreground'>/month</span>
                  </div>
                </CardHeader>

                <CardContent className='space-y-6'>
                  {/* Features */}
                  <div>
                    <h4 className='font-medium mb-3 flex items-center gap-2'>
                      <Star className='h-4 w-4 text-yellow-500' />
                      What's Included
                    </h4>
                    <ul className='space-y-2'>
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className='flex items-start gap-2 text-sm'
                        >
                          <Check className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Courses */}
                  <div>
                    <h4 className='font-medium mb-3 flex items-center gap-2'>
                      <BookOpen className='h-4 w-4 text-primary' />
                      Courses Included
                    </h4>
                    <ul className='space-y-1'>
                      {plan.courses.map((course) => (
                        <li
                          key={course}
                          className='text-sm text-muted-foreground'
                        >
                          • {course}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Button className='w-full' variant='secondary' disabled>
                      <Check className='h-4 w-4 mr-2' />
                      Current Plan
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      className='w-full'
                      size='lg'
                      onClick={async () => handleUpgrade(plan.tier)}
                      disabled={processingTier !== null}
                    >
                      {processingTier === plan.tier ? (
                        <>
                          <div className='h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2' />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Shield className='h-4 w-4 mr-2' />
                          Upgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button className='w-full' variant='outline' disabled>
                      Lower tier than current
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className='grid md:grid-cols-4 gap-4 mb-8'>
          <Card className='text-center p-4'>
            <Lock className='h-6 w-6 mx-auto mb-2 text-green-500' />
            <p className='text-sm font-medium'>Secure Payment</p>
            <p className='text-xs text-muted-foreground'>SSL Encrypted</p>
          </Card>
          <Card className='text-center p-4'>
            <Clock className='h-6 w-6 mx-auto mb-2 text-blue-500' />
            <p className='text-sm font-medium'>Cancel Anytime</p>
            <p className='text-xs text-muted-foreground'>No contracts</p>
          </Card>
          <Card className='text-center p-4'>
            <Users className='h-6 w-6 mx-auto mb-2 text-purple-500' />
            <p className='text-sm font-medium'>10,000+ Learners</p>
            <p className='text-xs text-muted-foreground'>Join our community</p>
          </Card>
          <Card className='text-center p-4'>
            <Trophy className='h-6 w-6 mx-auto mb-2 text-yellow-500' />
            <p className='text-sm font-medium'>30-Day Guarantee</p>
            <p className='text-xs text-muted-foreground'>Money back</p>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h4 className='font-medium mb-1'>Can I change plans later?</h4>
              <p className='text-sm text-muted-foreground'>
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className='font-medium mb-1'>
                Is my payment information secure?
              </h4>
              <p className='text-sm text-muted-foreground'>
                Absolutely. We use Stripe for payment processing, which is
                PCI-compliant and uses bank-level encryption.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className='font-medium mb-1'>What if I need help?</h4>
              <p className='text-sm text-muted-foreground'>
                All paid plans include email support. Expert members also get
                priority support and weekly group calls.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className='font-medium mb-1'>Can I get a refund?</h4>
              <p className='text-sm text-muted-foreground'>
                We offer a 30-day money-back guarantee. If you're not satisfied,
                contact us for a full refund.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
