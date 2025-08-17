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
  'relative w-full rounded-xl border-2 p-6 shadow-md transition-all duration-200 hover:shadow-lg text-gray-900',
  {
    variants: {
      variant: {
        info: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/60 border-gray-800',
        tip: 'bg-gradient-to-br from-yellow-50/80 to-amber-50/60 border-gray-800',
        warning: 'bg-gradient-to-br from-red-50/80 to-orange-50/60 border-gray-800',
        success: 'bg-gradient-to-br from-green-50/80 to-emerald-50/60 border-gray-800',
        activity: 'bg-gradient-to-br from-purple-50/80 to-indigo-50/60 border-gray-800',
        concept: 'bg-gradient-to-br from-cyan-50/80 to-teal-50/60 border-gray-800',
        practice: 'bg-gradient-to-br from-indigo-50/80 to-blue-50/60 border-gray-800',
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
  info: 'text-blue-600 ',
  tip: 'text-yellow-600 ',
  warning: 'text-red-600 ',
  success: 'text-green-600 ',
  activity: 'text-purple-600 ',
  concept: 'text-cyan-600 ',
  practice: 'text-indigo-600 ',
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
              <div className={cn('p-2 rounded-lg bg-white/80  backdrop-blur-sm', iconColor)}>
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
  return <div className={cn('font-semibold text-lg mb-1 text-gray-900', className)} {...props} />;
}

export function CalloutDescription({ className, ...props }: ComponentProps<'div'>): ReactElement {
  return (
    <div
      className={cn('text-sm leading-relaxed text-gray-800 [&>p]:mb-2 last:[&>p]:mb-0', className)}
      {...props}
    />
  );
}
