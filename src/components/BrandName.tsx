import React, { type ReactElement } from 'react';

import { cn } from '@/lib/utils';

interface BrandNameProps {
  /** Display variant of the brand name */
  variant: 'full' | 'short' | 'hero';
  /** Size of the text */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

/**
 * BrandName component for displaying "DISCOVER 50 AI" with special "OVER 50" styling
 *
 * @example
 * ```tsx
 * // Full brand name with default size
 * <BrandName variant="full" />
 *
 * // Short version without "AI"
 * <BrandName variant="short" size="lg" />
 *
 * // Hero version for homepage
 * <BrandName variant="hero" />
 * ```
 */
export function BrandName({ variant, size = 'md', className }: BrandNameProps): ReactElement {
  // Size mappings for regular text
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  // Removed unused boxPaddingClasses - now using text gradient instead of box

  // Rainbow gradient text style for "OVER 50"
  const rainbowTextStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #FF9A9E, #FBC2EB, #A18CD1, #FBC2EB)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline-block', // ensure gradient clips properly inside headings
    color: 'transparent', // ensure non-webkit browsers hide base text color
  };

  if (variant === 'hero') {
    return (
      <div
        className={cn(
          'py-6 px-6 md:py-8 md:px-10 bg-[#0B1E3D] rounded-xl shadow-xl',
          'inline-block',
          'transition-all duration-300',
          className,
        )}
        aria-label='Discover 50 AI'
        role='banner'
      >
        <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight'>
          <span>DISC</span>
          <span className='font-bold' style={rainbowTextStyle} role='text' aria-label='Over 50'>
            OVER 50
          </span>
          <span> AI</span>
        </h1>
        <p className='mt-4 text-base md:text-lg text-white/90 max-w-md'>
          Empowering adults over 50 to confidently navigate the world of artificial intelligence
        </p>
      </div>
    );
  }

  // Regular full variant: "DISCOVER OVER 50 AI"
  if (variant === 'full') {
    return (
      <span
        className={cn(
          sizeClasses[size],
          'font-bold inline-flex items-center leading-none',
          'text-gray-900 dark:text-white',
          className,
        )}
        aria-label='Discover 50 AI'
        role='text'
      >
        <span>DISC</span>
        <span
          className='font-bold bg-gradient-to-r from-[#FF9A9E] via-[#FBC2EB] to-[#A18CD1] bg-clip-text text-transparent'
          style={rainbowTextStyle}
          role='text'
          aria-label='Over 50'
        >
          OVER 50
        </span>
        <span> AI</span>
      </span>
    );
  }

  // Short variant: "DISCOVER 50 AI"
  return (
    <span
      className={cn(
        'font-bold inline-flex items-center',
        className
      )}
      aria-label='Discover 50 AI'
      role='text'
    >
      <span>DISC</span>
      <span
        className='font-bold bg-gradient-to-r from-[#FF9A9E] via-[#FBC2EB] to-[#A18CD1] bg-clip-text text-transparent'
        style={rainbowTextStyle}
        role='text'
        aria-label='Over 50'
      >
        OVER 50
      </span>
      <span>&nbsp;AI</span>
    </span>
  );
}

// Memoized version for performance optimization
export const MemoizedBrandName = React.memo(BrandName);
