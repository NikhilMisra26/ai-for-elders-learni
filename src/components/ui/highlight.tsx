import type { ComponentProps, ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const highlightVariants = cva('px-1.5 py-0.5 rounded-md font-medium transition-all duration-200', {
  variants: {
    variant: {
      default: 'bg-yellow-200/50 text-yellow-950 dark:bg-yellow-900/30 dark:text-yellow-100',
      primary: 'bg-blue-200/50 text-blue-950 dark:bg-blue-900/30 dark:text-blue-100',
      success: 'bg-green-200/50 text-green-950 dark:bg-green-900/30 dark:text-green-100',
      warning: 'bg-orange-200/50 text-orange-950 dark:bg-orange-900/30 dark:text-orange-100',
      purple: 'bg-purple-200/50 text-purple-950 dark:bg-purple-900/30 dark:text-purple-100',
      glossary:
        'bg-gradient-to-r from-cyan-100/60 to-blue-100/60 text-cyan-950 dark:from-cyan-900/20 dark:to-blue-900/20 dark:text-cyan-100 border-b-2 border-dotted border-cyan-500 dark:border-cyan-400 cursor-help',
      code: 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 font-mono text-sm',
    },
    animation: {
      none: '',
      pulse: 'animate-pulse',
      glow: 'shadow-[0_0_10px_rgba(251,191,36,0.5)] dark:shadow-[0_0_10px_rgba(251,191,36,0.3)]',
    },
  },
  defaultVariants: {
    variant: 'default',
    animation: 'none',
  },
});

interface HighlightProps extends ComponentProps<'span'>, VariantProps<typeof highlightVariants> {
  tooltip?: string;
}

export function Highlight({
  className,
  variant,
  animation,
  tooltip,
  children,
  ...props
}: HighlightProps): ReactElement {
  const component = (
    <span
      className={cn(highlightVariants({ variant, animation }), className)}
      title={tooltip}
      {...props}
    >
      {children}
    </span>
  );

  return component;
}

// Specialized highlight components for common use cases
export function KeyTerm({
  children,
  definition,
  ...props
}: ComponentProps<'span'> & { definition?: string }): ReactElement {
  return (
    <Highlight variant='glossary' tooltip={definition} {...props}>
      {children}
    </Highlight>
  );
}

export function ImportantText({ children, ...props }: ComponentProps<'span'>): ReactElement {
  return (
    <Highlight variant='warning' animation='glow' {...props}>
      {children}
    </Highlight>
  );
}

export function CodeSnippet({ children, ...props }: ComponentProps<'span'>): ReactElement {
  return (
    <Highlight variant='code' {...props}>
      {children}
    </Highlight>
  );
}
