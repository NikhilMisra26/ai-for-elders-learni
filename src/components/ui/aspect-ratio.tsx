import type { ComponentProps, ReactElement } from 'react';
import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio';

function AspectRatio({
  ...props
}: ComponentProps<typeof AspectRatioPrimitive.Root>): ReactElement {
  return <AspectRatioPrimitive.Root data-slot='aspect-ratio' {...props} />;
}

export { AspectRatio };
