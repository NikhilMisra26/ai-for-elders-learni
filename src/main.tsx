import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';

import './main.css';
import './styles/theme.css';
import './index.css';

console.log('[MAIN] Starting application initialization...');
console.log('[MAIN] Environment:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
    ? '✓ Set'
    : '✗ Missing',
});

try {
  console.log('[MAIN] Checking for document availability...');

  const mount =
    typeof document !== 'undefined' ? document.getElementById('root') : null;

  if (!mount) {
    console.error(
      '[MAIN] ✗ Root element not found! Document available:',
      typeof document !== 'undefined',
    );
    if (typeof document !== 'undefined') {
      console.error(
        '[MAIN] Available elements with id:',
        Array.from(document.querySelectorAll('[id]')).map((el) => el.id),
      );
    }
  } else {
    console.log('[MAIN] ✓ Root element found:', mount);
    console.log('[MAIN] Root element details:', {
      id: mount.id,
      className: mount.className,
      tagName: mount.tagName,
    });
  }

  if (mount) {
    console.log('[MAIN] Creating React root and rendering app...');

    const root = createRoot(mount);
    console.log('[MAIN] ✓ React root created successfully');

    root.render(
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error('[MAIN] ✗ Error Boundary caught error:', error);
          console.error('[MAIN] Error Info:', errorInfo);
        }}
      >
        <App />
      </ErrorBoundary>,
    );

    console.log('[MAIN] ✓ App rendered successfully');
  }
} catch (error) {
  console.error('[MAIN] ✗ Critical error during app initialization:', error);
  console.error(
    '[MAIN] Error stack:',
    error instanceof Error ? error.stack : 'No stack trace',
  );
}
