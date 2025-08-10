import React, { useState, lazy, Suspense, type ReactElement } from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Header } from './components/Header';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { useSessionManager } from './hooks/useSessionManager';

// Lazy load page components for code splitting
const HomePage = lazy(async () => {
  console.log('[APP] Loading HomePage component...');
  return import('./components/HomePage').then((module) => {
    console.log('[APP] ✓ HomePage component loaded successfully');
    return { default: module.HomePage };
  });
});
const CoursesPage = lazy(async () => {
  console.log('[APP] Loading CoursesPage component...');
  return import('./components/CoursesPage').then((module) => {
    console.log('[APP] ✓ CoursesPage component loaded successfully');
    return { default: module.CoursesPage };
  });
});
const DashboardPage = lazy(async () => {
  console.log('[APP] Loading DashboardPage component...');
  return import('./components/DashboardPage').then((module) => {
    console.log('[APP] ✓ DashboardPage component loaded successfully');
    return { default: module.DashboardPage };
  });
});
const AccountPage = lazy(async () => {
  console.log('[APP] Loading AccountPage component...');
  return import('./components/AccountPage').then((module) => {
    console.log('[APP] ✓ AccountPage component loaded successfully');
    return { default: module.AccountPage };
  });
});
const AuthForm = lazy(async () => {
  console.log('[APP] Loading AuthForm component...');
  return import('./components/AuthForm').then((module) => {
    console.log('[APP] ✓ AuthForm component loaded successfully');
    return { default: module.AuthForm };
  });
});
const SecurityDashboard = lazy(async () => {
  console.log('[APP] Loading SecurityDashboard component...');
  return import('./components/SecurityDashboard').then((module) => {
    console.log('[APP] ✓ SecurityDashboard component loaded successfully');
    return { default: module.SecurityDashboard };
  });
});

type Page = 'home' | 'courses' | 'dashboard' | 'account';

// Loading fallback component for lazy-loaded pages
function PageLoader(): ReactElement {
  console.log('[APP] PageLoader component rendered - showing loading spinner');
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
  console.log('[APP] AppContent component mounting...');
  
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);

  console.log('[APP] AppContent state initialized:', {
    currentPage,
    showAuthDialog,
    showSecurityDashboard,
  });

  // Initialize session management
  console.log('[APP] Initializing session manager...');
  useSessionManager();

  const handleNavigate = (page: string): void => {
    console.log('[APP] Navigation requested:', { from: currentPage, to: page });
    setCurrentPage(page as Page);
    console.log('[APP] ✓ Page changed to:', page);
  };

  const handleAuthClick = (): void => {
    console.log('[APP] Auth dialog requested - opening auth modal');
    setShowAuthDialog(true);
  };

  const handleAuthClose = (): void => {
    console.log('[APP] Auth dialog close requested');
    setShowAuthDialog(false);
  };

  // Security dashboard access (for demo purposes - in production, this would be admin-only)
  const handleKeyPress = (e: KeyboardEvent): void => {
    console.log('[APP] Keyboard event detected:', {
      key: e.key,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
    });
    
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      console.log('[APP] Security dashboard keyboard shortcut triggered (Ctrl+Shift+S)');
      setShowSecurityDashboard(true);
    }
  };

  // Add keyboard listener for security dashboard
  React.useEffect((): (() => void) => {
    console.log('[APP] Setting up keyboard event listener for security dashboard');
    window.addEventListener('keydown', handleKeyPress);
    
    return (): void => {
      console.log('[APP] Cleaning up keyboard event listener');
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  
  // Log component mount
  React.useEffect(() => {
    console.log('[APP] ✓ AppContent component mounted successfully');
    console.log('[APP] Initial render state:', {
      currentPage,
      showAuthDialog,
      showSecurityDashboard,
    });
    
    return () => {
      console.log('[APP] AppContent component unmounting...');
    };
  }, []);
  
  // Log page changes
  React.useEffect(() => {
    console.log('[APP] Page change effect triggered:', { currentPage });
  }, [currentPage]);
  
  // Log dialog state changes
  React.useEffect(() => {
    console.log('[APP] Auth dialog state changed:', { showAuthDialog });
  }, [showAuthDialog]);
  
  React.useEffect(() => {
    console.log('[APP] Security dashboard state changed:', { showSecurityDashboard });
  }, [showSecurityDashboard]);

  const renderPage = (): ReactElement => {
    console.log('[APP] Rendering page:', currentPage);
    
    switch (currentPage) {
      case 'home':
        console.log('[APP] ✓ Rendering HomePage');
        return (
          <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
        );
      case 'courses':
        console.log('[APP] ✓ Rendering CoursesPage');
        return <CoursesPage onAuthClick={handleAuthClick} />;
      case 'dashboard':
        console.log('[APP] ✓ Rendering DashboardPage');
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'account':
        console.log('[APP] ✓ Rendering AccountPage');
        return (
          <AccountPage
            onNavigate={handleNavigate}
            onAuthClick={handleAuthClick}
          />
        );
      default:
        console.warn('[APP] ⚠️ Unknown page requested, falling back to HomePage:', currentPage);
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
  console.log('[APP] App component mounting...');
  
  React.useEffect(() => {
    console.log('[APP] ✓ App component mounted - providers initialized');
    
    return () => {
      console.log('[APP] App component unmounting...');
    };
  }, []);
  
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </AuthProvider>
  );
}

export default App;
