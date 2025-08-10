import React, { useState, lazy, Suspense, type ReactElement } from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { AccessControlProvider } from './contexts/AccessControlContext';
import { Header } from './components/Header';
import { Dialog, DialogContent } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { useSessionManager } from './hooks/useSessionManager';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Breadcrumbs } from './components/Breadcrumbs';
import {
  type PageType,
  type RouteParams,
  generateBreadcrumbs,
  navigationHistory,
  handleKeyboardNavigation,
} from './lib/routingConfig';
import { getCourseById, getModuleById } from './lib/courseData';
import { accessManager } from './lib/accessControl';

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
const ModulePage = lazy(async () => {
  console.log('[APP] Loading ModulePage component...');
  return import('./components/ModulePage').then((module) => {
    console.log('[APP] ✓ ModulePage component loaded successfully');
    return { default: module.ModulePage };
  });
});
const UpgradePage = lazy(async () => {
  console.log('[APP] Loading UpgradePage component...');
  return import('./components/UpgradePage').then((module) => {
    console.log('[APP] ✓ UpgradePage component loaded successfully');
    return { default: module.UpgradePage };
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

// Navigation state
interface NavigationState {
  currentPage: PageType;
  params: RouteParams;
  intendedDestination?: { page: PageType; params: RouteParams };
}

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

  const { user } = useAuth();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPage: 'home',
    params: {},
  });
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);

  console.log('[APP] AppContent state initialized:', {
    currentPage: navigationState.currentPage,
    params: navigationState.params,
    showAuthDialog,
    showSecurityDashboard,
  });

  // Initialize session management
  console.log('[APP] Initializing session manager...');
  useSessionManager();

  const handleNavigate = React.useCallback(
    (page: string, params?: Record<string, string>): void => {
      console.log('[APP] Navigation requested:', {
        from: navigationState.currentPage,
        to: page,
        params,
      });

      // Add to navigation history
      navigationHistory.push(page as PageType, params ?? {});

      // Clear AccessManager cache when user navigates
      if (user) {
        accessManager.clearUserCache(user.id);
      }

      setNavigationState({
        currentPage: page as PageType,
        params: params ?? {},
      });

      console.log('[APP] ✓ Page changed to:', page);
    },
    [user, navigationState.currentPage],
  );

  const handleProtectedNavigation = (
    page: PageType,
    params: RouteParams = {},
  ): void => {
    // Store intended destination for after auth
    if (!user) {
      setNavigationState((prev) => ({
        ...prev,
        intendedDestination: { page, params },
      }));
      setShowAuthDialog(true);
    } else {
      handleNavigate(page, params as Record<string, string>);
    }
  };

  const handleAuthClick = (): void => {
    console.log('[APP] Auth dialog requested - opening auth modal');
    setShowAuthDialog(true);
  };

  const handleAuthClose = (): void => {
    console.log('[APP] Auth dialog close requested');
    setShowAuthDialog(false);

    // Navigate to intended destination after successful auth
    if (user && navigationState.intendedDestination) {
      const { page, params } = navigationState.intendedDestination;
      setNavigationState((prev) => ({
        ...prev,
        intendedDestination: undefined,
      }));
      setTimeout(() => {
        handleNavigate(page, params as Record<string, string>);
      }, 100);
    }
  };

  // Keyboard navigation and security dashboard
  const handleKeyPress = React.useCallback(
    (e: KeyboardEvent): void => {
      console.log('[APP] Keyboard event detected:', {
        key: e.key,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });

      // Security dashboard shortcut
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        console.log(
          '[APP] Security dashboard keyboard shortcut triggered (Ctrl+Shift+S)',
        );
        setShowSecurityDashboard(true);
        return;
      }

      // Navigation shortcuts
      const targetPage = handleKeyboardNavigation(e);
      if (targetPage) {
        handleNavigate(targetPage, {});
      }
    },
    [handleNavigate],
  );

  // Add keyboard listener for security dashboard
  React.useEffect((): (() => void) => {
    console.log(
      '[APP] Setting up keyboard event listener for security dashboard',
    );
    window.addEventListener('keydown', handleKeyPress);

    return (): void => {
      console.log('[APP] Cleaning up keyboard event listener');
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Log component mount
  React.useEffect((): (() => void) => {
    console.log('[APP] ✓ AppContent component mounted successfully');
    console.log('[APP] Initial render state:', {
      currentPage: navigationState.currentPage,
      params: navigationState.params,
      showAuthDialog,
      showSecurityDashboard,
    });

    return (): void => {
      console.log('[APP] AppContent component unmounting...');
    };
  }, [
    navigationState.currentPage,
    navigationState.params,
    showAuthDialog,
    showSecurityDashboard,
  ]);

  // Log page changes
  React.useEffect((): void => {
    console.log('[APP] Page change effect triggered:', {
      currentPage: navigationState.currentPage,
      params: navigationState.params,
    });
  }, [navigationState]);

  // Log dialog state changes
  React.useEffect((): void => {
    console.log('[APP] Auth dialog state changed:', { showAuthDialog });
  }, [showAuthDialog]);

  React.useEffect((): void => {
    console.log('[APP] Security dashboard state changed:', {
      showSecurityDashboard,
    });
  }, [showSecurityDashboard]);

  // Generate breadcrumbs
  const getBreadcrumbs = (): ReturnType<typeof generateBreadcrumbs> => {
    let courseTitle: string | undefined;
    let moduleTitle: string | undefined;

    if (navigationState.params.courseId) {
      const course = getCourseById(navigationState.params.courseId);
      courseTitle = course?.title;

      if (navigationState.params.moduleId && course) {
        const module = getModuleById(
          navigationState.params.courseId,
          navigationState.params.moduleId,
        );
        moduleTitle = module?.title;
      }
    }

    return generateBreadcrumbs(
      navigationState.currentPage,
      navigationState.params,
      courseTitle,
      moduleTitle,
    );
  };

  const renderPage = (): ReactElement => {
    console.log('[APP] Rendering page:', navigationState.currentPage);

    const { currentPage, params } = navigationState;

    // Module page requires special handling
    if (currentPage === 'module' && params.courseId && params.moduleId) {
      console.log('[APP] ✓ Rendering ModulePage with protection');
      return (
        <ProtectedRoute
          page='module'
          params={params}
          onAuthRequired={handleAuthClick}
          onUpgradeRequired={(tier) => {
            console.log('[APP] Upgrade required to tier:', tier);
            handleNavigate('upgrade', {
              requiredTier: tier,
              returnPath: window.location.pathname,
            });
          }}
          onNavigate={handleNavigate}
        >
          <ModulePage
            courseId={params.courseId}
            moduleId={params.moduleId}
            onBack={() => handleNavigate('courses')}
            onNavigate={(courseId, moduleId) =>
              handleNavigate('module', { courseId, moduleId })
            }
          />
        </ProtectedRoute>
      );
    }

    switch (currentPage) {
      case 'module':
        // Handled above
        throw new Error('Module page should have been handled earlier');
      case 'home':
        console.log('[APP] ✓ Rendering HomePage');
        return (
          <HomePage onNavigate={handleNavigate} onAuthClick={handleAuthClick} />
        );

      case 'courses':
        console.log('[APP] ✓ Rendering CoursesPage');
        return (
          <CoursesPage
            onAuthClick={handleAuthClick}
            onUpgradeClick={(tier) =>
              handleProtectedNavigation('upgrade', {
                requiredTier: tier,
                returnPath: window.location.pathname,
              })
            }
            onNavigateToModule={(courseId, moduleId) =>
              handleProtectedNavigation('module', { courseId, moduleId })
            }
          />
        );

      case 'dashboard':
        console.log('[APP] ✓ Rendering DashboardPage with protection');
        return (
          <ProtectedRoute
            page='dashboard'
            params={params}
            onAuthRequired={handleAuthClick}
            onNavigate={handleNavigate}
          >
            <DashboardPage
              onNavigate={handleNavigate}
              onNavigateToModule={(courseId, moduleId) =>
                handleProtectedNavigation('module', { courseId, moduleId })
              }
            />
          </ProtectedRoute>
        );

      case 'account':
        console.log('[APP] ✓ Rendering AccountPage with protection');
        return (
          <ProtectedRoute
            page='account'
            params={params}
            onAuthRequired={handleAuthClick}
            onNavigate={handleNavigate}
          >
            <AccountPage
              onNavigate={handleNavigate}
              onAuthClick={handleAuthClick}
            />
          </ProtectedRoute>
        );

      case 'upgrade':
        console.log('[APP] ✓ Rendering UpgradePage');
        return (
          <UpgradePage
            requiredTier={
              params.requiredTier as 'advanced' | 'expert' | undefined
            }
            onBack={() => handleNavigate(params.returnPath ?? 'courses')}
            onUpgradeSuccess={() => {
              // Navigate to intended destination after upgrade
              if (params.returnPath) {
                const returnRoute = params.returnPath.split('/');
                if (
                  returnRoute[1] === 'courses' &&
                  returnRoute[3] === 'modules'
                ) {
                  handleNavigate('module', {
                    courseId: returnRoute[2],
                    moduleId: returnRoute[4],
                  });
                } else {
                  handleNavigate('courses');
                }
              } else {
                handleNavigate('courses');
              }
            }}
          />
        );

      default:
        console.warn(
          '[APP] ⚠️ Unknown page requested, falling back to HomePage:',
          currentPage,
        );
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
        currentPage={navigationState.currentPage}
      />

      <main id='main-content' role='main'>
        {/* Breadcrumbs for better navigation */}
        {navigationState.currentPage !== 'home' && (
          <div className='max-w-7xl mx-auto px-6'>
            <Breadcrumbs items={getBreadcrumbs()} onNavigate={handleNavigate} />
          </div>
        )}

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

  React.useEffect((): (() => void) => {
    console.log('[APP] ✓ App component mounted - providers initialized');

    return (): void => {
      console.log('[APP] App component unmounting...');
    };
  }, []);

  return (
    <AuthProvider>
      <AccessControlProvider>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
      </AccessControlProvider>
    </AuthProvider>
  );
}

export default App;
