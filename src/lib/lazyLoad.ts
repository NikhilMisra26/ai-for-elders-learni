import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Enhanced lazy loading with preload capability
 */
export function lazyWithPreload<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
): LazyExoticComponent<T> & { preload: () => Promise<void> } {
  let preloadedModule: { default: T } | null = null;
  let preloadPromise: Promise<{ default: T }> | null = null;

  const load = (): Promise<{ default: T }> => {
    if (preloadedModule) {
      return Promise.resolve(preloadedModule);
    }

    if (preloadPromise) {
      return preloadPromise;
    }

    preloadPromise = importFn().then((module) => {
      preloadedModule = module;
      return module;
    });

    return preloadPromise;
  };

  const LazyComponent = lazy(load) as LazyExoticComponent<T> & {
    preload: () => Promise<void>;
  };

  LazyComponent.preload = async (): Promise<void> => {
    await load();
  };

  return LazyComponent;
}

/**
 * Preload multiple components
 */
export async function preloadComponents(
  components: Array<{ preload: () => Promise<void> }>,
): Promise<void> {
  await Promise.all(components.map((component) => component.preload()));
}

/**
 * Intersection Observer based lazy loading trigger
 */
export function useLazyLoadOnVisible(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options?: IntersectionObserverInit,
): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      });
    },
    {
      rootMargin: '50px',
      ...options,
    },
  );

  if (ref.current) {
    observer.observe(ref.current);
  }

  return () => {
    observer.disconnect();
  };
}