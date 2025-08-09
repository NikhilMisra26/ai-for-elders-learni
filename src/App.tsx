import React, { useState, lazy, Suspense, type ReactElement } from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Header } from './components/Header';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { useSessionManager } from './hooks/useSessionManager';

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

type Page = 'home' | 'courses' | 'dashboard' | 'account';

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
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);

  // Initialize session management
  useSessionManager();

  const handleNavigate = (page: string): void => {
    setCurrentPage(page as Page);
  };

  const handleAuthClick = (): void => {
    setShowAuthDialog(true);
  };

  const handleAuthClose = (): void => {
    setShowAuthDialog(false);
  };

  // Security dashboard access (for demo purposes - in production, this would be admin-only)
  const handleKeyPress = (e: KeyboardEvent): void => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      setShowSecurityDashboard(true);
    }
  };

  // Add keyboard listener for security dashboard
  React.useEffect((): (() => void) => {
    window.addEventListener('keydown', handleKeyPress);
    return (): void => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const renderPage = (): ReactElement => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
        );
      case 'courses':
        return <CoursesPage onAuthClick={handleAuthClick} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'account':
        return (
          <AccountPage
            onNavigate={handleNavigate}
            onAuthClick={handleAuthClick}
          />
        );
      default:
        return (
          <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
        );
    }
  };

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

      <Header
        onAuthClick={handleAuthClick}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      <main id='main-content' role='main'>
        <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
      </main>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
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
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
