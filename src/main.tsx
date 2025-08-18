import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';

import './main.css';
import './styles/theme.css';
import './index.css';

// Ensure React is available globally for older bundlers
if (typeof window !== 'undefined' && !window.React) {
  window.React = React;
}

// Wait for DOM to be ready
const initApp = (): void => {
  const mount = document.getElementById('root');
  if (mount && !mount.hasAttribute('data-react-root')) {
    mount.setAttribute('data-react-root', 'true');
    createRoot(mount).render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>,
    );
  }
};

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
