import * as React from 'react';

import { cn } from '@/lib/utils';

function VisuallyHidden({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.ReactElement {
  return (
    <span
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </span>
  );
}

export { VisuallyHidden };
