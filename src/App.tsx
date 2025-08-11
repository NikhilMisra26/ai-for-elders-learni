import React, {
  useState,
  lazy,
  Suspense,
  type ReactElement,
  useEffect,
} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Header } from './components/Header';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { useSessionManager } from './hooks/useSessionManager';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load page components for code splitting
const HomePage = lazy(async () =>
  import('./components/HomePage').then((module) => ({
    default: module.HomePage,
  })),
);
const CoursesPage = lazy(async () =>
  import('./components/CoursesPage').then((module) => ({
    default: module.CoursesPage,
  })),
);
const DashboardPage = lazy(async () =>
  import('./components/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const AccountPage = lazy(async () =>
  import('./components/AccountPage').then((module) => ({
    default: module.AccountPage,
  })),
);
const AuthForm = lazy(async () =>
  import('./components/AuthForm').then((module) => ({
    default: module.AuthForm,
  })),
);
const SecurityDashboard = lazy(async () =>
  import('./components/SecurityDashboard').then((module) => ({
    default: module.SecurityDashboard,
  })),
);

// Loading fallback component for lazy-loaded pages
function PageLoader(): ReactElement {
  return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <div className='text-center'>
        <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4' />
        <p className='text-lg text-muted-foreground'>Loading...</p>
      </div>
    </div>
  );
}

function AppContent(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);

  // Check for auth query param
  const showAuthDialog = searchParams.get('auth') === 'true';

  // Initialize session management
  useSessionManager();

  const handleAuthClick = (): void => {
    setSearchParams({ auth: 'true', redirect: location.pathname });
  };

  const handleAuthClose = (): void => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('auth');
    newParams.delete('redirect');
    setSearchParams(newParams);
  };

  // Security dashboard access (for demo purposes - in production, this would be admin-only)
  const handleKeyPress = (e: KeyboardEvent): void => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      setShowSecurityDashboard(true);
    }
  };

  // Add keyboard listener for security dashboard
  useEffect((): (() => void) => {
    window.addEventListener('keydown', handleKeyPress);
    return (): void => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Skip navigation for accessibility */}
      <a
        href='#main-content'
        className='skip-nav'
        aria-label='Skip to main content'
      >
        Skip to main content
      </a>

      <Header onAuthClick={handleAuthClick} />

      <main id='main-content' role='main'>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path='/'
              element={<HomePage onAuthClick={handleAuthClick} />}
            />
            <Route
              path='/courses'
              element={<CoursesPage onAuthClick={handleAuthClick} />}
            />
            <Route
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path='/account'
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Authentication Dialog */}
      <Dialog
        open={showAuthDialog}
        onOpenChange={(open) => {
          if (!open) handleAuthClose();
        }}
      >
        <DialogContent className='sm:max-w-md'>
          <Suspense fallback={<PageLoader />}>
            <AuthForm onClose={handleAuthClose} />
          </Suspense>
        </DialogContent>
      </Dialog>

      {/* Security Dashboard (Admin) */}
      {showSecurityDashboard && (
        <Suspense fallback={<PageLoader />}>
          <SecurityDashboard onClose={() => setShowSecurityDashboard(false)} />
        </Suspense>
      )}

      {/* Toast notifications with senior-friendly styling */}
      <Toaster
        position='top-right'
        toastOptions={{
          style: {
            fontSize: '16px',
            padding: '16px',
            minHeight: '60px',
          },
          duration: 5000, // Longer duration for seniors to read
        }}
      />
    </div>
  );
}

function App(): ReactElement {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
