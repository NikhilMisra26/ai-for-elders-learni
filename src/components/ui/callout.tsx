import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Lightbulb,
  Info,
  Warning,
  CheckCircle,
  BookOpen,
  Sparkle,
  Target,
  Brain,
} from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

const calloutVariants = cva(
  'relative w-full rounded-xl border-2 p-6 shadow-md transition-all duration-200 hover:shadow-lg',
  {
    variants: {
      variant: {
        info: 'bg-gradient-to-br from-blue-50/60 to-cyan-50/40 border-gray-800 text-foreground dark:from-blue-950/30 dark:to-cyan-950/20 dark:border-gray-200 dark:text-foreground',
        tip: 'bg-gradient-to-br from-yellow-50/60 to-amber-50/40 border-gray-800 text-foreground dark:from-yellow-950/30 dark:to-amber-950/20 dark:border-gray-200 dark:text-foreground',
        warning:
          'bg-gradient-to-br from-red-50/60 to-orange-50/40 border-gray-800 text-foreground dark:from-red-950/30 dark:to-orange-950/20 dark:border-gray-200 dark:text-foreground',
        success:
          'bg-gradient-to-br from-green-50/60 to-emerald-50/40 border-gray-800 text-foreground dark:from-green-950/30 dark:to-emerald-950/20 dark:border-gray-200 dark:text-foreground',
        activity:
          'bg-gradient-to-br from-purple-50/60 to-indigo-50/40 border-gray-800 text-foreground dark:from-purple-950/30 dark:to-indigo-950/20 dark:border-gray-200 dark:text-foreground',
        concept:
          'bg-gradient-to-br from-cyan-50/60 to-teal-50/40 border-gray-800 text-foreground dark:from-cyan-950/30 dark:to-teal-950/20 dark:border-gray-200 dark:text-foreground',
        practice:
          'bg-gradient-to-br from-indigo-50/60 to-blue-50/40 border-gray-800 text-foreground dark:from-indigo-950/30 dark:to-blue-950/20 dark:border-gray-200 dark:text-foreground',
      },
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'default',
    },
  },
);

const iconMap = {
  info: Info,
  tip: Lightbulb,
  warning: Warning,
  success: CheckCircle,
  activity: Target,
  concept: BookOpen,
  practice: Brain,
};

const iconColorMap = {
  info: 'text-blue-600 dark:text-blue-400',
  tip: 'text-yellow-600 dark:text-yellow-400',
  warning: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400',
  activity: 'text-purple-600 dark:text-purple-400',
  concept: 'text-cyan-600 dark:text-cyan-400',
  practice: 'text-indigo-600 dark:text-indigo-400',
};

interface CalloutProps extends ComponentProps<'div'>, VariantProps<typeof calloutVariants> {
  icon?: ReactNode;
  showIcon?: boolean;
}

export function Callout({
  className,
  variant = 'info',
  size,
  icon,
  showIcon = true,
  children,
  ...props
}: CalloutProps): ReactElement {
  const Icon = iconMap[variant ?? 'info'];
  const iconColor = iconColorMap[variant ?? 'info'];

  return (
    <div role='note' className={cn(calloutVariants({ variant, size }), className)} {...props}>
      <div className='flex items-start gap-4'>
        {showIcon && (
          <div className='flex-shrink-0 mt-0.5'>
            {icon ?? (
              <div
                className={cn(
                  'p-2 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm',
                  iconColor,
                )}
              >
                <Icon className='w-5 h-5' weight='duotone' />
              </div>
            )}
          </div>
        )}
        <div className='flex-1 space-y-2'>{children}</div>
      </div>
      <div className='absolute top-0 right-0 opacity-10'>
        <Sparkle className='w-20 h-20' weight='duotone' />
      </div>
    </div>
  );
}

export function CalloutTitle({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return <div className={cn('font-semibold text-lg mb-1', className)} {...props} />;
}

export function CalloutDescription({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('text-sm leading-relaxed [&>p]:mb-2 last:[&>p]:mb-0', className)}
      {...props}
    />
  );
}
