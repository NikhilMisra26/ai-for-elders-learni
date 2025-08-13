export interface SubscriptionPlan {
  id: 'free' | 'advanced' | 'expert';
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  features: string[];
  description: string;
  ctaText: string;
  popular?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Course',
    price: 0,
    billingPeriod: 'month',
    description: 'Perfect for getting started with AI basics',
    ctaText: 'Start Learning Free',
    features: [
      'Complete "AI Basics for Everyday Life" course',
      '4 comprehensive modules',
      'Audio narration for all content',
      'Progress tracking',
      'Community forum access',
      'Email support',
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced Learning',
    price: 1.99,
    billingPeriod: 'month',
    description: 'Take your AI skills to the next level',
    ctaText: 'Upgrade to Advanced',
    popular: true,
    features: [
      'Everything in Free course',
      '"AI as Your Personal Assistant" course',
      'Advanced prompting techniques',
      'AI tools and apps guidance',
      'Health & finance applications',
      'Monthly AI updates',
      'Priority email support',
      '7-day free trial',
    ],
  },
  {
    id: 'expert',
    name: 'Expert Mastery',
    price: 4.99,
    billingPeriod: 'month',
    description: 'Master cutting-edge AI technologies',
    ctaText: 'Become an Expert',
    features: [
      'Everything in Advanced plan',
      '"Advanced AI for Active Seniors" course',
      'Autonomous AI agents',
      'Custom AI assistants',
      'Model Context Protocol (MCP)',
      'Cutting-edge updates',
      'Live expert Q&A sessions',
      'Phone support',
      '14-day free trial',
    ],
  },
];

export function formatPrice(price: number): string {
  return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
}

export function formatBillingPeriod(period: 'month' | 'year'): string {
  return period === 'month' ? '/month' : '/year';
}

export function getPlanFeatures(
  planId: 'free' | 'advanced' | 'expert',
): string[] {
  const plan = subscriptionPlans.find((p) => p.id === planId);
  return plan?.features ?? [];
}

export function getUpgradeRecommendation(
  currentPlan: 'free' | 'advanced' | 'expert',
): SubscriptionPlan | null {
  if (currentPlan === 'free')
    return subscriptionPlans.find((p) => p.id === 'advanced') ?? null;
  if (currentPlan === 'advanced')
    return subscriptionPlans.find((p) => p.id === 'expert') ?? null;
  return null;
}
