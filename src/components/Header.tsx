import React, { useState, type ReactElement } from 'react';
import { TextAa, User, SignOut, List } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { BrandName } from '@/components/BrandName';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface HeaderProps {
  onAuthClick: () => void;
}

export function Header({ onAuthClick }: HeaderProps): ReactElement {
  const { user, logout } = useAuth();
  const { fontSize, increaseFontSize, decreaseFontSize } = useAccessibility();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'home', label: 'Home', path: '/home' },
    { id: 'courses', label: 'Courses', path: '/courses' },
    { id: 'dashboard', label: 'Progress', path: '/dashboard' },
    { id: 'account', label: 'Account', path: '/account' },
  ];

  // Get current page from location
  const getCurrentPage = (): string => {
    const path = location.pathname;
    if (path === '/home') return 'home';
    if (path.startsWith('/courses')) return 'courses';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/account')) return 'account';
    return 'home';
  };

  const currentPage = getCurrentPage();

  const handleLogout = (): void => {
    // If logout returns a Promise, explicitly ignore it to satisfy linting
    void logout();
    void navigate('/home');
    setShowMobileMenu(false);
  };

  return (
    <header className='sticky top-0 z-50 bg-background border-b border-border'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <button
              onClick={() => void navigate('/home')}
              className='text-xl font-bold text-primary hover:text-primary/80 transition-colors'
            >
              <BrandName variant='short' size='md' />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav
            className='hidden md:flex items-center space-x-8'
            role='navigation'
            aria-label='Main navigation'
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => void navigate(item.path)}
                className={`text-base font-medium transition-colors hover:text-primary ${
                  currentPage === item.id
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-foreground'
                }`}
                aria-current={currentPage === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Controls */}
          <div className='hidden md:flex items-center space-x-4'>
            {/* Font Size Controls */}
            <div
              className='flex items-center space-x-1'
              role='group'
              aria-label='Font size controls'
            >
              <Button
                variant='ghost'
                size='sm'
                onClick={decreaseFontSize}
                aria-label='Decrease font size'
                disabled={fontSize === 'small'}
                className='h-11 w-11'
              >
                <TextAa weight='regular' className='text-sm' />
                <span className='sr-only'>A-</span>
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={increaseFontSize}
                aria-label='Increase font size'
                disabled={fontSize === 'large'}
                className='h-11 w-11'
              >
                <TextAa weight='bold' className='text-lg' />
                <span className='sr-only'>A+</span>
              </Button>
            </div>

            {/* User Menu */}
            {user ? (
              <div className='flex items-center space-x-3'>
                <div className='flex items-center space-x-2'>
                  <User weight='regular' className='text-muted-foreground' />
                  <span className='text-sm font-medium'>{user.name}</span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleLogout}
                  aria-label='Sign out'
                  className='h-11 w-11'
                >
                  <SignOut weight='regular' />
                </Button>
              </div>
            ) : (
              <Button onClick={onAuthClick}>Sign In</Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label='Toggle menu'
              aria-expanded={showMobileMenu}
              className='h-8 w-8 p-0'
            >
              <List weight='regular' />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className='md:hidden border-t border-border bg-background'>
            <div className='px-4 py-4 space-y-3'>
              {/* Mobile Navigation */}
              <nav className='space-y-2' role='navigation' aria-label='Mobile navigation'>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      void navigate(item.path);
                      setShowMobileMenu(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      currentPage === item.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted'
                    }`}
                    aria-current={currentPage === item.id ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Mobile Controls */}
              <div className='border-t border-border pt-3 space-y-3'>
                {/* Font Size Controls */}
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Font Size:</span>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={decreaseFontSize}
                      disabled={fontSize === 'small'}
                    >
                      A-
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={increaseFontSize}
                      disabled={fontSize === 'large'}
                    >
                      A+
                    </Button>
                  </div>
                </div>

                {/* User Section */}
                {user ? (
                  <div className='border-t border-border pt-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <User weight='regular' />
                        <span className='font-medium'>{user.name}</span>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleLogout}
                        className='flex items-center gap-2'
                      >
                        <SignOut weight='regular' />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      onAuthClick();
                      setShowMobileMenu(false);
                    }}
                    className='w-full'
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Memoized version for performance optimization
export const MemoizedHeader = React.memo(Header);
