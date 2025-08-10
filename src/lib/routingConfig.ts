/**
 * Routing Configuration for AI for Elders
 *
 * This module centralizes all routing logic with security-first design
 * and accessibility features optimized for users 50+.
 */

import type { Tier } from './db';

// ========================================================================
// Types and Interfaces
// ========================================================================

export type PageType =
  | 'home'
  | 'courses'
  | 'dashboard'
  | 'account'
  | 'module'
  | 'upgrade';

export interface RouteConfig {
  id: PageType;
  path: string;
  title: string;
  description?: string;
  requiredAuth: boolean;
  requiredTier?: Tier;
  showInNav: boolean;
  breadcrumbLabel?: string;
}

export interface RouteParams {
  courseId?: string;
  moduleId?: string;
  returnPath?: string;
  requiredTier?: Tier;
}

export interface NavigationState {
  currentPage: PageType;
  params: RouteParams;
  history: Array<{ page: PageType; params: RouteParams }>;
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  label: string;
  page: PageType;
  params?: RouteParams;
  isCurrent: boolean;
}

export interface RouteGuardResult {
  allowed: boolean;
  redirectTo?: PageType;
  reason?: 'unauthenticated' | 'insufficient_tier' | 'expired' | 'invalid';
  requiredTier?: Tier;
  message?: string;
}

// ========================================================================
// Route Configuration
// ========================================================================

export const ROUTES: Record<PageType, RouteConfig> = {
  home: {
    id: 'home',
    path: '/',
    title: 'Home',
    description: 'Welcome to AI for Elders',
    requiredAuth: false,
    showInNav: true,
    breadcrumbLabel: 'Home',
  },
  courses: {
    id: 'courses',
    path: '/courses',
    title: 'AI Learning Courses',
    description: 'Browse and enroll in AI courses',
    requiredAuth: false,
    showInNav: true,
    breadcrumbLabel: 'Courses',
  },
  dashboard: {
    id: 'dashboard',
    path: '/dashboard',
    title: 'My Learning Dashboard',
    description: 'Track your learning progress',
    requiredAuth: true,
    showInNav: true,
    breadcrumbLabel: 'Dashboard',
  },
  account: {
    id: 'account',
    path: '/account',
    title: 'Account Settings',
    description: 'Manage your account and subscription',
    requiredAuth: true,
    showInNav: true,
    breadcrumbLabel: 'Account',
  },
  module: {
    id: 'module',
    path: '/courses/:courseId/modules/:moduleId',
    title: 'Module',
    description: 'Course module content',
    requiredAuth: true,
    showInNav: false,
    breadcrumbLabel: 'Module',
  },
  upgrade: {
    id: 'upgrade',
    path: '/upgrade',
    title: 'Upgrade Subscription',
    description: 'Access more courses with premium subscription',
    requiredAuth: false,
    showInNav: false,
    breadcrumbLabel: 'Upgrade',
  },
};

// ========================================================================
// URL Generation and Parsing
// ========================================================================

/**
 * Generates a semantic URL for a given page and parameters
 * URLs are designed to be clear and memorable for senior users
 */
export function generateUrl(page: PageType, params?: RouteParams): string {
  const route = ROUTES[page];

  if (!route) {
    console.warn(`[Routing] Unknown page type: ${page}`);
    return '/';
  }

  let url = route.path;

  // Replace parameters in path
  if (params) {
    if (params.courseId) {
      url = url.replace(':courseId', encodeURIComponent(params.courseId));
    }
    if (params.moduleId) {
      url = url.replace(':moduleId', encodeURIComponent(params.moduleId));
    }

    // Add return path as query parameter for upgrade flows
    if (params.returnPath) {
      url += `?return=${encodeURIComponent(params.returnPath)}`;
    }
  }

  return url;
}

/**
 * Parses a URL to determine the page and parameters
 */
export function parseUrl(url: string): { page: PageType; params: RouteParams } {
  // Remove query string for initial parsing
  const [pathname, queryString] = url.split('?');
  const params: RouteParams = {};

  // Parse query parameters
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    const returnPath = searchParams.get('return');
    if (returnPath) {
      params.returnPath = returnPath;
    }
  }

  // Match module route pattern
  const moduleMatch = pathname.match(/^\/courses\/([^/]+)\/modules\/([^/]+)$/);
  if (moduleMatch) {
    return {
      page: 'module',
      params: {
        ...params,
        courseId: decodeURIComponent(moduleMatch[1]),
        moduleId: decodeURIComponent(moduleMatch[2]),
      },
    };
  }

  // Match static routes
  for (const [pageType, route] of Object.entries(ROUTES)) {
    if (route.path === pathname) {
      return { page: pageType as PageType, params };
    }
  }

  // Default to home
  return { page: 'home', params };
}

// ========================================================================
// Breadcrumb Generation
// ========================================================================

/**
 * Generates breadcrumb trail for current navigation state
 * Breadcrumbs help seniors understand their location in the app
 */
export function generateBreadcrumbs(
  currentPage: PageType,
  params: RouteParams,
  courseTitle?: string,
  moduleTitle?: string,
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always start with home (unless we're on home)
  if (currentPage !== 'home') {
    breadcrumbs.push({
      label: 'Home',
      page: 'home',
      isCurrent: false,
    });
  }

  // Add intermediate breadcrumbs based on current page
  switch (currentPage) {
    case 'module':
      // Home > Courses > [Course Name] > [Module Name]
      breadcrumbs.push({
        label: 'Courses',
        page: 'courses',
        isCurrent: false,
      });

      if (courseTitle && params.courseId) {
        breadcrumbs.push({
          label: courseTitle,
          page: 'courses',
          params: { courseId: params.courseId },
          isCurrent: false,
        });
      }

      if (moduleTitle) {
        breadcrumbs.push({
          label: moduleTitle,
          page: 'module',
          params,
          isCurrent: true,
        });
      }
      break;

    case 'dashboard':
    case 'account':
    case 'courses':
      breadcrumbs.push({
        label: ROUTES[currentPage].breadcrumbLabel!,
        page: currentPage,
        isCurrent: true,
      });
      break;

    case 'upgrade':
      if (params.returnPath) {
        // Add context of where user came from
        const returnRoute = parseUrl(params.returnPath);
        if (returnRoute.page !== 'home') {
          breadcrumbs.push({
            label: ROUTES[returnRoute.page].breadcrumbLabel!,
            page: returnRoute.page,
            params: returnRoute.params,
            isCurrent: false,
          });
        }
      }
      breadcrumbs.push({
        label: 'Upgrade',
        page: 'upgrade',
        isCurrent: true,
      });
      break;
  }

  return breadcrumbs;
}

// ========================================================================
// Navigation History Management
// ========================================================================

export class NavigationHistory {
  private history: Array<{ page: PageType; params: RouteParams }> = [];
  private readonly maxSize = 10;

  push(page: PageType, params: RouteParams = {}): void {
    // Don't add duplicate consecutive entries
    const last = this.history[this.history.length - 1];
    if (
      last?.page === page &&
      JSON.stringify(last.params) === JSON.stringify(params)
    ) {
      return;
    }

    this.history.push({ page, params });

    // Keep history size manageable
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  canGoBack(): boolean {
    return this.history.length > 1;
  }

  goBack(): { page: PageType; params: RouteParams } | null {
    if (this.history.length > 1) {
      this.history.pop(); // Remove current
      return this.history[this.history.length - 1];
    }
    return null;
  }

  getLastVisitedCourse(): { courseId: string; moduleId?: string } | null {
    // Find the most recent module or course visit
    for (let i = this.history.length - 1; i >= 0; i--) {
      const entry = this.history[i];
      if (entry.page === 'module' && entry.params.courseId) {
        return {
          courseId: entry.params.courseId,
          moduleId: entry.params.moduleId,
        };
      }
    }
    return null;
  }

  clear(): void {
    this.history = [];
  }

  getHistory(): Array<{ page: PageType; params: RouteParams }> {
    return [...this.history];
  }
}

// ========================================================================
// Route Guards
// ========================================================================

/**
 * Validates if a user can access a specific route
 * Returns detailed information about why access was denied
 */
export function validateRouteAccess(
  page: PageType,
  params: RouteParams,
  isAuthenticated: boolean,
  userTier: Tier,
  courseTier?: Tier,
): RouteGuardResult {
  const route = ROUTES[page];

  // Check authentication requirement
  if (route.requiredAuth && !isAuthenticated) {
    return {
      allowed: false,
      redirectTo: 'home',
      reason: 'unauthenticated',
      message: 'Please sign in to access this content',
    };
  }

  // Check tier requirements for module pages
  if (page === 'module' && courseTier) {
    const tierHierarchy: Record<Tier, number> = {
      free: 1,
      advanced: 2,
      expert: 3,
    };

    if (tierHierarchy[userTier] < tierHierarchy[courseTier]) {
      return {
        allowed: false,
        redirectTo: 'upgrade',
        reason: 'insufficient_tier',
        requiredTier: courseTier,
        message: `This content requires ${courseTier} subscription`,
      };
    }
  }

  return { allowed: true };
}

// ========================================================================
// Common URL Mistakes Handler
// ========================================================================

/**
 * Handles common URL mistakes that seniors might make
 * Returns the corrected page and params
 */
export function handleCommonUrlMistakes(url: string): {
  page: PageType;
  params: RouteParams;
} {
  const lowercaseUrl = url.toLowerCase().trim();

  // Common misspellings and variations
  const corrections: Record<string, PageType> = {
    '/course': 'courses',
    '/class': 'courses',
    '/classes': 'courses',
    '/lesson': 'courses',
    '/lessons': 'courses',
    '/learn': 'courses',
    '/learning': 'courses',
    '/my-dashboard': 'dashboard',
    '/my-account': 'account',
    '/settings': 'account',
    '/profile': 'account',
    '/subscription': 'account',
    '/billing': 'account',
    '/payment': 'account',
    '/signin': 'home',
    '/sign-in': 'home',
    '/login': 'home',
    '/log-in': 'home',
    '/signup': 'home',
    '/sign-up': 'home',
    '/register': 'home',
  };

  for (const [mistake, correction] of Object.entries(corrections)) {
    if (lowercaseUrl.startsWith(mistake)) {
      console.log(`[Routing] Correcting URL from ${url} to ${correction}`);
      return { page: correction, params: {} };
    }
  }

  // If no correction found, try normal parsing
  return parseUrl(url);
}

// ========================================================================
// Keyboard Navigation Support
// ========================================================================

/**
 * Maps keyboard shortcuts to navigation actions
 */
export const KEYBOARD_SHORTCUTS: Record<
  string,
  { page: PageType; description: string }
> = {
  'Alt+H': { page: 'home', description: 'Go to Home' },
  'Alt+C': { page: 'courses', description: 'Go to Courses' },
  'Alt+D': { page: 'dashboard', description: 'Go to Dashboard' },
  'Alt+A': { page: 'account', description: 'Go to Account' },
};

/**
 * Handles keyboard navigation events
 */
export function handleKeyboardNavigation(
  event: KeyboardEvent,
): PageType | null {
  const key = `${event.altKey ? 'Alt+' : ''}${event.key.toUpperCase()}`;
  const shortcut = KEYBOARD_SHORTCUTS[key];

  if (shortcut) {
    event.preventDefault();
    console.log(`[Routing] Keyboard navigation: ${key} -> ${shortcut.page}`);
    return shortcut.page;
  }

  return null;
}

// ========================================================================
// Export utilities
// ========================================================================

export const navigationHistory = new NavigationHistory();

export default {
  ROUTES,
  generateUrl,
  parseUrl,
  generateBreadcrumbs,
  validateRouteAccess,
  handleCommonUrlMistakes,
  handleKeyboardNavigation,
  navigationHistory,
};
