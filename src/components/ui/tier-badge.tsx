import type { ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Crown, Star, Sparkle, Certificate } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

const tierBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-sm',
  {
    variants: {
      tier: {
        free: 'bg-gradient-to-r from-orange-100/70 to-amber-100/70 text-orange-900 border-2 border-orange-300 hover:shadow-md hover:shadow-orange-200/50 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-100 dark:border-orange-700',
        advanced:
          'bg-gradient-to-r from-purple-100/70 to-indigo-100/70 text-purple-900 border-2 border-purple-300 hover:shadow-md hover:shadow-purple-200/50 dark:from-purple-900/30 dark:to-indigo-900/30 dark:text-purple-100 dark:border-purple-700',
        expert:
          'bg-gradient-to-r from-yellow-100/70 via-amber-100/70 to-yellow-100/70 text-yellow-950 border-2 border-yellow-400 hover:shadow-lg hover:shadow-yellow-300/50 animate-shimmer dark:from-yellow-900/30 dark:via-amber-900/30 dark:to-yellow-900/30 dark:text-yellow-100 dark:border-yellow-600',
      },
      size: {
        sm: 'text-xs px-2 py-1',
        default: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
      },
      animated: {
        true: 'hover:scale-105 active:scale-95',
        false: '',
      },
    },
    defaultVariants: {
      tier: 'free',
      size: 'default',
      animated: true,
    },
  },
);

const iconMap = {
  free: Star,
  advanced: Certificate,
  expert: Crown,
};

interface TierBadgeProps extends VariantProps<typeof tierBadgeVariants> {
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function TierBadge({
  tier = 'free',
  size,
  animated,
  className,
  showIcon = true,
  label,
}: TierBadgeProps): ReactElement {
  const Icon = iconMap[tier as 'free' | 'advanced' | 'expert'];
  const displayLabel = label ?? tier.toUpperCase();

  return (
    <div
      className={cn(tierBadgeVariants({ tier, size, animated }), className)}
      role='status'
      aria-label={`${tier} tier`}
    >
      {showIcon && (
        <Icon
          className={cn(
            'flex-shrink-0',
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
            tier === 'expert' && 'animate-pulse',
          )}
          weight='fill'
        />
      )}
      <span>{displayLabel}</span>
      {tier === 'expert' && (
        <Sparkle
          className={cn(
            'flex-shrink-0',
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
            'animate-spin-slow',
          )}
          weight='duotone'
        />
      )}
    </div>
  );
}

// Compact version for inline use
export function TierIndicator({
  tier,
  className,
}: {
  tier: 'free' | 'advanced' | 'expert';
  className?: string;
}): ReactElement {
  const Icon = iconMap[tier];

  const colorClasses = {
    free: 'text-orange-500',
    advanced: 'text-purple-500',
    expert: 'text-yellow-500',
  };

  return (
    <Icon
      className={cn('w-5 h-5', colorClasses[tier], className)}
      weight='fill'
      aria-label={`${tier} tier`}
    />
  );
}
