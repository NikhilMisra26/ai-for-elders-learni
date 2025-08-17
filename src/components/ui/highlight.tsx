import type { ComponentProps, ReactElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const highlightVariants = cva('px-1.5 py-0.5 rounded-md font-medium transition-all duration-200', {
  variants: {
    variant: {
      default: 'bg-yellow-200/50 text-yellow-950  ',
      primary: 'bg-blue-200/50 text-blue-950  ',
      success: 'bg-green-200/50 text-green-950  ',
      warning: 'bg-orange-200/50 text-orange-950  ',
      purple: 'bg-purple-200/50 text-purple-950  ',
      glossary:
        'bg-gradient-to-r from-cyan-100/60 to-blue-100/60 text-cyan-950    border-b-2 border-dotted border-cyan-500  cursor-help',
      code: 'bg-gray-200 text-gray-900   font-mono text-sm',
    },
    animation: {
      none: '',
      pulse: 'animate-pulse',
      glow: 'shadow-[0_0_10px_rgba(251,191,36,0.5)] [0_0_10px_rgba(251,191,36,0.3)]',
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
