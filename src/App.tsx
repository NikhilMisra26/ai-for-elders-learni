import { useState, lazy, Suspense, type ReactElement, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Header } from './components/Header';
import { errorHandler } from './lib/errorHandler';
import { logger } from './lib/logger';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  VisuallyHidden,
} from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { useSessionManager } from './hooks/useSessionManager';
import { ErrorFallback } from './ErrorFallback';

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
const ModulePage = lazy(async () =>
  import('./components/ModulePage').then((module) => ({
    default: module.ModulePage,
  })),
);
const ResetPasswordPage = lazy(async () =>
  import('./components/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const ReviewForm = lazy(async () =>
  import('./components/ReviewForm').then((module) => ({
    default: module.ReviewForm,
  })),
);
const NotFoundPage = lazy(async () =>
  import('./components/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
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
  const navigate = useNavigate();
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const { user } = useAuth();

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

  // Security dashboard access - restricted to authenticated admin users
  const handleKeyPress = (e: KeyboardEvent): void => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      // Check if user is authenticated and has admin privileges
      // Admin check based on email domain and verified status for better security
      // In production, implement proper role-based access control via database
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
      const isAdmin =
        user &&
        user.verified &&
        user.email &&
        // Check for admin domain (more secure than hardcoded emails)
        (user.email.endsWith('@discover50ai.com') ||
          // Allow specific admin email from environment variable
          (adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase()));

      if (isAdmin) {
        setShowSecurityDashboard(true);
      } else {
        // Silently ignore for non-admin users (no error message to avoid revealing feature existence)
        logger.warn('Unauthorized access attempt to security dashboard', {
          component: 'App',
          action: 'securityDashboardAccess',
          metadata: {
            userId: user?.id,
            email: user?.email,
          },
        });
      }
    }
  };

  // Add keyboard listener for security dashboard
  useEffect((): (() => void) => {
    window.addEventListener('keydown', handleKeyPress);
    return (): void => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation handler for NotFoundPage
  const handleNotFoundNavigate = (page: string): void => {
    switch (page) {
      case 'home':
        void navigate('/home');
        break;
      case 'courses':
        void navigate('/courses');
        break;
      default:
        void navigate('/home');
    }
  };

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Skip navigation for accessibility */}
      <a href='#main-content' className='skip-nav' aria-label='Skip to main content'>
        Skip to main content
      </a>

      <Header onAuthClick={handleAuthClick} />

      <main id='main-content' role='main'>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(error) => {
            // Error logging handled internally by errorHandler
            errorHandler.logError('Application boundary error', error, {
              component: 'App',
              action: 'error_boundary',
            });
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Root redirects to home */}
              <Route path='/' element={<Navigate to='/home' replace />} />

              {/* Password reset route */}
              <Route
                path='/reset-password'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <ResetPasswordPage />
                  </ErrorBoundary>
                }
              />

              {/* Main pages */}
              <Route
                path='/home'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <HomePage onAuthClick={handleAuthClick} />
                  </ErrorBoundary>
                }
              />

              {/* Courses section */}
              <Route
                path='/courses'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <CoursesPage onAuthClick={handleAuthClick} />
                  </ErrorBoundary>
                }
              />
              <Route
                path='/courses/basic'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <ModulePage courseType='basic' />
                  </ErrorBoundary>
                }
              />
              <Route
                path='/courses/advanced'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <ModulePage courseType='advanced' />
                  </ErrorBoundary>
                }
              />
              <Route
                path='/courses/expert'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <ModulePage courseType='expert' />
                  </ErrorBoundary>
                }
              />

              {/* Module routes */}
              <Route
                path='/courses/:courseType/module/:moduleId'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <ModulePage />
                  </ErrorBoundary>
                }
              />

              {/* Module part routes */}
              <Route
                path='/courses/:courseType/module/:moduleId/part/:partId'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <ModulePage />
                  </ErrorBoundary>
                }
              />

              {/* Dashboard/Progress */}
              <Route
                path='/dashboard'
                element={
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <DashboardPage />
                  </ErrorBoundary>
                }
              />
              <Route path='/progress' element={<Navigate to='/dashboard' replace />} />

              {/* Account section */}
              <Route path='/account' element={<AccountPage />} />
              <Route path='/profile' element={<Navigate to='/account' replace />} />
              <Route path='/settings' element={<AccountPage />} />

              {/* Reviews */}
              <Route path='/reviews' element={<ReviewForm />} />

              {/* 404 - Not Found */}
              <Route path='*' element={<NotFoundPage onNavigate={handleNotFoundNavigate} />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Authentication Dialog */}
      <Dialog
        open={showAuthDialog}
        onOpenChange={(open) => {
          if (!open) handleAuthClose();
        }}
      >
        <DialogContent className='sm:max-w-md' hideCloseButton>
          <VisuallyHidden>
            <DialogTitle>Authentication</DialogTitle>
            <DialogDescription>Sign in or create an account to continue</DialogDescription>
          </VisuallyHidden>
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
