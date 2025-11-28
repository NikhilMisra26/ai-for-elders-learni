import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Analytics } from '@vercel/analytics/react';

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';
import { logError } from './lib/errorHandler.ts';
import { applyCSPWithNonce } from './lib/contentSecurityPolicy.ts';

import './main.css';
import './styles/theme.css';
import './index.css';

// Apply Content Security Policy for XSS protection with nonce support
if (typeof window !== 'undefined') {
  try {
    applyCSPWithNonce();
  } catch (error) {
    logError('Failed to apply CSP', error instanceof Error ? error : new Error(String(error)), {
      component: 'main',
      action: 'applyCSP',
    });
  }
}

// Note: Global React exposure removed for security - modern React doesn't require it

// Initialize app with error handling
const initApp = (): void => {
  try {
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      logError('Root element not found', new Error('Root element missing'), {
        component: 'main',
        action: 'init',
      });
      return;
    }

    // Check if already initialized
    if (rootElement.hasAttribute('data-react-root')) {
      return;
    }

    // Mark as initialized
    rootElement.setAttribute('data-react-root', 'true');

    // Create React root and render app
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <App />
          <Analytics
            debug={import.meta.env.DEV}
            mode={import.meta.env.PROD ? 'production' : 'development'}
          />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    logError(
      'Failed to initialize app',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'main',
        action: 'init',
      },
    );
    // Fallback rendering without StrictMode
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <App />
          <Analytics
            debug={import.meta.env.DEV}
            mode={import.meta.env.PROD ? 'production' : 'development'}
          />
        </ErrorBoundary>,
      );
    }
  }
};

// Ensure DOM is ready before initializing
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
  } else {
    // DOM is already ready, run immediately
    setTimeout(initApp, 0);
  }
}
