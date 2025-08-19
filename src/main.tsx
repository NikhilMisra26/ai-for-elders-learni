import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';

import './main.css';
import './styles/theme.css';
import './index.css';

// Ensure React is available globally for compatibility
if (typeof window !== 'undefined') {
  window.React = React;
}

// Initialize app with error handling
const initApp = (): void => {
  try {
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      console.error('Root element not found');
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
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Fallback rendering without StrictMode
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <App />
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
