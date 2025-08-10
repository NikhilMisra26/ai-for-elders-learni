import type { CSSProperties, ReactElement } from 'react';
import type { ToasterProps } from 'sonner';
import { Toaster as Sonner } from 'sonner';

interface ToasterComponentProps extends ToasterProps {
  theme?: 'light' | 'dark' | 'system';
}

const Toaster = ({
  theme = 'system',
  ...props
}: ToasterComponentProps): ReactElement => {
  try {
    console.log('[Sonner] Toaster component rendering with theme:', theme);
    console.log('[Sonner] Additional props:', props);

    const toasterElement = (
      <Sonner
        theme={theme as ToasterProps['theme']}
        className='toaster group'
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as CSSProperties
        }
        {...props}
      />
    );

    console.log('[Sonner] Toaster component rendered successfully');
    return toasterElement;
  } catch (error) {
    console.error('[Sonner] Error rendering Toaster component:', error);
    console.error('[Sonner] Error stack:', (error as Error).stack);

    // Fallback: return a minimal Toaster without custom styling
    console.warn('[Sonner] Falling back to minimal Toaster configuration');
    return <Sonner theme={theme as ToasterProps['theme']} {...props} />;
  }
};

export { Toaster };
