import { lazy, type ComponentType } from 'react';

/**
 * Route-based code splitting configuration
 */
export const ROUTE_CHUNKS = {
  // Core pages
  home: () => import('@/components/HomePage'),
  courses: () => import('@/components/CoursesPage'),
  dashboard: () => import('@/components/DashboardPage'),
  account: () => import('@/components/AccountPage'),
  
  // Auth-related
  auth: () => import('@/components/AuthForm'),
  resetPassword: () => import('@/components/ResetPasswordPage'),
  
  // Course modules
  module: () => import('@/components/ModulePage'),
  
  // Admin/Security
  security: () => import('@/components/SecurityDashboard'),
  
  // Error pages
  notFound: () => import('@/components/NotFoundPage'),
};

/**
 * Named exports helper for lazy loading
 */
export function lazyNamed<T extends Record<string, ComponentType<unknown>>>(
  loader: () => Promise<T>,
  name: keyof T,
): React.LazyExoticComponent<T[typeof name]> {
  return lazy(async () => {
    const module = await loader();
    return { default: module[name] };
  });
}

/**
 * Prefetch routes based on user behavior
 */
export function prefetchRoute(routeName: keyof typeof ROUTE_CHUNKS): void {
  if (routeName in ROUTE_CHUNKS) {
    // Start loading the chunk but don't wait for it
    void ROUTE_CHUNKS[routeName]();
  }
}

/**
 * Prefetch multiple routes
 */
export function prefetchRoutes(routeNames: Array<keyof typeof ROUTE_CHUNKS>): void {
  routeNames.forEach(prefetchRoute);
}

/**
 * Smart prefetch based on current route
 */
export function smartPrefetch(currentRoute: string): void {
  // Define likely next routes based on current route
  const prefetchMap: Record<string, Array<keyof typeof ROUTE_CHUNKS>> = {
    home: ['courses', 'auth'],
    courses: ['module', 'dashboard'],
    dashboard: ['courses', 'account'],
    account: ['dashboard', 'courses'],
  };
  
  const routesToPrefetch = prefetchMap[currentRoute];
  if (routesToPrefetch) {
    // Delay prefetch to avoid competing with current page load
    setTimeout(() => {
      prefetchRoutes(routesToPrefetch);
    }, 2000);
  }
}

/**
 * Bundle analyzer helper (development only)
 */
export function analyzeBundleSize(): void {
  if (import.meta.env.DEV) {
    // Log module sizes
    const modules = import.meta.glob('@/components/*.tsx');
    console.log('Available modules:', Object.keys(modules));
  }
}