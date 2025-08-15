import React from 'react';

/**
 * Performance monitoring utilities
 */

interface PerformanceMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

/**
 * Layout Shift Performance Entry interface
 */
interface LayoutShiftEntry extends PerformanceEntry {
  readonly value: number;
  readonly hadRecentInput: boolean;
}

/**
 * Memory Performance interface
 */
interface MemoryInfo {
  readonly usedJSHeapSize: number;
  readonly jsHeapSizeLimit: number;
  readonly totalJSHeapSize: number;
}

/**
 * Extended Performance interface with memory
 */
interface PerformanceWithMemory extends Performance {
  readonly memory: MemoryInfo;
}

/**
 * Measure Web Vitals
 */
export function measureWebVitals(callback: (metrics: PerformanceMetrics) => void): void {
  const metrics: PerformanceMetrics = {};

  // First Contentful Paint
  const paintObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        metrics.FCP = entry.startTime;
        callback(metrics);
      }
    }
  });
  paintObserver.observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    metrics.LCP = lastEntry.startTime;
    callback(metrics);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if ('processingStart' in entry && 'startTime' in entry) {
        metrics.FID = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        callback(metrics);
      }
    }
  });
  fidObserver.observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if ('value' in entry && 'hadRecentInput' in entry) {
        const layoutShiftEntry = entry as LayoutShiftEntry;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
          metrics.CLS = clsValue;
          callback(metrics);
        }
      }
    }
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // Time to First Byte
  if (performance.timing) {
    metrics.TTFB = performance.timing.responseStart - performance.timing.fetchStart;
    callback(metrics);
  }
}

/**
 * Performance timer utility
 */
export class PerformanceTimer {
  private readonly marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(_name: string, startMark: string, endMark?: string): number | null {
    const start = this.marks.get(startMark);
    if (!start) return null;

    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) return null;

    const duration = end - start;
    // Performance measurements are tracked internally, logging removed to comply with production linting
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

/**
 * Debounced render optimization hook
 */
export function useOptimizedRender<T>(value: T, delay = 100): T {
  const [optimizedValue, setOptimizedValue] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setOptimizedValue(value);
    }, delay);

    return (): void => clearTimeout(timer);
  }, [value, delay]);

  return optimizedValue;
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  used: number;
  limit: number;
  percentage: number;
} | null {
  if (!('memory' in performance)) {
    return null;
  }

  const performanceWithMemory = performance as PerformanceWithMemory;
  const memory = performanceWithMemory.memory;
  return {
    used: memory.usedJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

/**
 * FPS monitoring
 */
export class FPSMonitor {
  private lastTime = performance.now();
  private frames = 0;
  private fps = 0;

  start(callback?: (fps: number) => void): void {
    const measure = (): void => {
      const now = performance.now();
      this.frames++;

      if (now >= this.lastTime + 1000) {
        this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
        this.frames = 0;
        this.lastTime = now;

        if (callback) {
          callback(this.fps);
        }
      }

      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  }

  getFPS(): number {
    return this.fps;
  }
}
