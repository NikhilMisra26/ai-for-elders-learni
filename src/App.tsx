import React, { useState, type ReactElement } from 'react';

import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { CoursesPage } from './components/CoursesPage';
import { DashboardPage } from './components/DashboardPage';
import { AccountPage } from './components/AccountPage';
import { AuthForm } from './components/AuthForm';
import { SecurityDashboard } from './components/SecurityDashboard';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { useSessionManager } from './hooks/useSessionManager';

type Page = 'home' | 'courses' | 'dashboard' | 'account';

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
        {renderPage()}
      </main>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className='sm:max-w-md'>
          <AuthForm onClose={handleAuthClose} />
        </DialogContent>
      </Dialog>

      {/* Security Dashboard (Admin) */}
      {showSecurityDashboard && (
        <SecurityDashboard onClose={() => setShowSecurityDashboard(false)} />
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
