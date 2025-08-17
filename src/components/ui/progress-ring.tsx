import { useEffect, useState, type ReactElement } from 'react';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'purple' | 'orange';
  animate?: boolean;
}

const colorMap = {
  primary: 'stroke-blue-500 text-blue-600',
  success: 'stroke-green-500 text-green-600',
  warning: 'stroke-yellow-500 text-yellow-600',
  purple: 'stroke-purple-500 text-purple-600',
  orange: 'stroke-orange-500 text-orange-600',
};

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showValue = true,
  label,
  color = 'primary',
  animate = true,
}: ProgressRingProps): ReactElement {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value);

  // Animation effect
  useEffect(() => {
    if (!animate) {
      setAnimatedValue(value);
      return undefined;
    }

    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);

    return (): void => {
      clearTimeout(timer);
    };
  }, [value, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const colorClasses = colorMap[color];

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        className='transform -rotate-90'
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className='stroke-gray-200 '
          fill='none'
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn(colorClasses.split(' ')[0], 'transition-all duration-1000 ease-out')}
          fill='none'
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap='round'
        />

        {/* Decorative dots */}
        {[0, 90, 180, 270].map((angle) => (
          <circle
            key={angle}
            cx={size / 2 + radius * Math.cos((angle * Math.PI) / 180)}
            cy={size / 2 + radius * Math.sin((angle * Math.PI) / 180)}
            r={2}
            className='fill-gray-300 '
          />
        ))}
      </svg>

      {/* Center content */}
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        {showValue && (
          <div className={cn('text-2xl font-bold', colorClasses.split(' ')[1])}>
            {Math.round(animatedValue)}%
          </div>
        )}
        {label && (
          <div className='text-xs text-muted-foreground mt-1 text-center px-2'>{label}</div>
        )}
      </div>
    </div>
  );
}

// Mini version for inline use
export function ProgressRingMini({
  value,
  size = 40,
  strokeWidth = 3,
  color = 'primary',
  className,
}: Pick<ProgressRingProps, 'value' | 'color' | 'className'> & {
  size?: number;
  strokeWidth?: number;
}): ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const colorClasses = colorMap[color];

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        className='transform -rotate-90'
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className='stroke-gray-200 '
          fill='none'
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn(colorClasses.split(' ')[0], 'transition-all duration-500')}
          fill='none'
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap='round'
        />
      </svg>
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='text-xs font-semibold'>{Math.round(value)}%</span>
      </div>
    </div>
  );
}
