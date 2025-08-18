# Performance Optimization Guide

## Overview

This document provides detailed, actionable steps to resolve performance issues identified in the DISCOVER 50 AI platform. Each section contains specific implementation instructions that can be executed independently.

## Current Performance Metrics

- **Bundle Size**: 1.3MB total (91.6KB CSS gzipped + JS chunks)
- **FCP (First Contentful Paint)**: ~2.5-3s on 3G
- **TTI (Time to Interactive)**: ~4-5s on 3G
- **Lighthouse Score**: ~75/100

## Target Performance Metrics

- **Bundle Size**: <800KB total
- **FCP**: <2s on 3G
- **TTI**: <3.5s on 3G
- **Lighthouse Score**: 90+/100

---

## Issue #1: CSS Bundle Optimization (HIGH PRIORITY)

### Problem

- Single 91.6KB gzipped CSS file (608KB uncompressed)
- Render-blocking resource in HTML head
- Delays FCP by 500-600ms on 3G networks
- Contains all Tailwind utilities and animations

### Solution Part 1A: Extract Critical CSS (Immediate Fix)

**Step 1: Install Critical CSS Tools**

```bash
pnpm add -D critical @fullhuman/postcss-purgecss
```

**Step 2: Create Critical CSS Extraction Script**
Create `scripts/extract-critical-css.js`:

```javascript
import critical from 'critical';
import fs from 'fs';
import path from 'path';

// Extract critical CSS for the landing page
critical.generate({
  inline: true,
  base: 'dist/',
  src: 'index.html',
  target: {
    html: 'index-critical.html',
    css: 'critical.css',
  },
  width: 1300,
  height: 900,
  extract: true,
  minify: true,
});

// Read the extracted critical CSS
const criticalCSS = fs.readFileSync('dist/critical.css', 'utf8');

// Update index.html to inline critical CSS
const html = fs.readFileSync('dist/index.html', 'utf8');
const updatedHtml = html.replace(
  '<link rel="stylesheet" href="/assets/index-*.css">',
  `<style>${criticalCSS}</style>
  <link rel="preload" href="/assets/index-*.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/assets/index-*.css"></noscript>`,
);

fs.writeFileSync('dist/index.html', updatedHtml);
```

**Step 3: Update Build Process**
Modify `package.json`:

```json
{
  "scripts": {
    "build": "tsc -b --noEmit && vite build && node scripts/extract-critical-css.js",
    "build:css-optimized": "pnpm run build && pnpm run extract-critical"
  }
}
```

### Solution Part 1B: Implement CSS Code Splitting

**Step 1: Create Route-Specific CSS Files**
Split `src/index.css` into multiple files:

Create `src/styles/critical.css`:

```css
/* Only above-the-fold styles */
@import 'tailwindcss/base';
@import './fonts.css';
@import './reset.css';

/* Critical utility classes used in initial render */
.container {
  @apply mx-auto px-4;
}
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded;
}
/* Add other critical classes */
```

Create `src/styles/animations.css`:

```css
/* All animation-related styles */
@import 'tw-animate-css';
/* Custom animations */
```

Create `src/styles/components.css`:

```css
/* Component-specific styles */
@import 'tailwindcss/components';
@import './ui-components.css';
```

**Step 2: Lazy Load Non-Critical CSS**
Update `src/App.tsx`:

```typescript
import './styles/critical.css'; // Always load

// Lazy load non-critical CSS
const loadAnimations = () => import('./styles/animations.css');
const loadComponents = () => import('./styles/components.css');

useEffect(() => {
  // Load non-critical CSS after initial render
  requestIdleCallback(() => {
    loadAnimations();
    loadComponents();
  });
}, []);
```

### Solution Part 1C: Optimize Tailwind CSS

**Step 1: Configure PurgeCSS**
Update `tailwind.config.js`:

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Add safelist for dynamically generated classes
  safelist: [
    'dark',
    {
      pattern:
        /bg-(red|green|blue|yellow|purple|pink|indigo)-(100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus'],
    },
  ],
  theme: {
    extend: {
      // Remove unused theme extensions
    },
  },
  plugins: [
    // Only include actually used plugins
  ],
};
```

**Step 2: Create PostCSS Config for Production**
Update `postcss.config.js`:

```javascript
import purgecss from '@fullhuman/postcss-purgecss';

export default {
  plugins: [
    ...(process.env.NODE_ENV === 'production'
      ? [
          purgecss({
            content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
            defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: {
              standard: ['html', 'body'],
              deep: [/^dark/, /^hover/, /^focus/],
            },
          }),
        ]
      : []),
  ],
};
```

### Verification Steps

1. Run `pnpm run build:css-optimized`
2. Check that `dist/index.html` contains inlined critical CSS
3. Verify non-critical CSS loads asynchronously
4. Test FCP improvement using Lighthouse

### Expected Impact

- **FCP Improvement**: 400-500ms faster
- **CSS Size Reduction**: 30-40% smaller after PurgeCSS
- **Initial Render**: Immediate with critical CSS inlined

---

## Issue #2: Route-Based Code Splitting (MEDIUM PRIORITY)

### Problem

- All route components loaded upfront
- No lazy loading for routes
- Increases initial bundle size unnecessarily

### Solution Part 2A: Implement React.lazy for Routes

**Step 1: Create Lazy-Loaded Route Components**
Update `src/App.tsx`:

```typescript
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Keep critical components eager
import HomePage from '@/components/HomePage';

// Lazy load all other routes
const CoursesPage = lazy(() => import('@/components/CoursesPage'));
const DashboardPage = lazy(() => import('@/components/DashboardPage'));
const AccountPage = lazy(() => import('@/components/AccountPage'));
const ModulePage = lazy(() => import('@/components/ModulePage'));
const NotFoundPage = lazy(() => import('@/components/NotFoundPage'));
const ResetPasswordPage = lazy(() => import('@/components/ResetPasswordPage'));

// Create a route loading component
const RouteLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

function App() {
  // ... existing code ...

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />; // Keep home page eager

      case 'courses':
        return (
          <RouteLoader>
            <CoursesPage
              onStartCourse={handleStartCourse}
              onNavigateToModule={handleNavigateToModule}
            />
          </RouteLoader>
        );

      case 'dashboard':
        return (
          <RouteLoader>
            <DashboardPage onNavigateToModule={handleNavigateToModule} />
          </RouteLoader>
        );

      case 'account':
        return (
          <RouteLoader>
            <AccountPage />
          </RouteLoader>
        );

      case 'module':
        return (
          <RouteLoader>
            <ModulePage
              courseId={currentCourseId}
              moduleId={currentModuleId}
              partId={currentPartId}
              onNavigate={handleModuleNavigation}
              onBackToCourse={handleBackToCourse}
            />
          </RouteLoader>
        );

      case 'reset-password':
        return (
          <RouteLoader>
            <ResetPasswordPage />
          </RouteLoader>
        );

      default:
        return (
          <RouteLoader>
            <NotFoundPage />
          </RouteLoader>
        );
    }
  };

  // ... rest of component
}
```

**Step 2: Create Loading Component**
Create `src/components/ui/LoadingSpinner.tsx`:

```typescript
export default function LoadingSpinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
```

### Solution Part 2B: Implement Route Prefetching

**Step 1: Create Prefetch Utility**
Create `src/lib/routePrefetch.ts`:

```typescript
// Prefetch routes based on user behavior
export const prefetchRoute = (routeName: string): void => {
  switch (routeName) {
    case 'courses':
      import('@/components/CoursesPage');
      break;
    case 'dashboard':
      import('@/components/DashboardPage');
      break;
    case 'account':
      import('@/components/AccountPage');
      break;
    case 'module':
      import('@/components/ModulePage');
      break;
  }
};

// Prefetch likely next routes
export const prefetchLikelyRoutes = (currentRoute: string): void => {
  // After login, prefetch dashboard and courses
  if (currentRoute === 'home') {
    setTimeout(() => {
      prefetchRoute('dashboard');
      prefetchRoute('courses');
    }, 2000);
  }

  // On dashboard, prefetch courses and account
  if (currentRoute === 'dashboard') {
    setTimeout(() => {
      prefetchRoute('courses');
      prefetchRoute('account');
    }, 1000);
  }
};
```

**Step 2: Implement Prefetching in App**
Update `src/App.tsx`:

```typescript
import { prefetchLikelyRoutes } from '@/lib/routePrefetch';

useEffect(() => {
  // Prefetch likely routes after initial render
  if (currentPage) {
    prefetchLikelyRoutes(currentPage);
  }
}, [currentPage]);
```

### Solution Part 2C: Optimize Vite Chunking

**Step 1: Update Vite Config**
Update `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('@phosphor-icons')) {
              return 'icons';
            }
            return 'vendor';
          }

          // Route-based chunks
          if (id.includes('components/HomePage')) return 'home';
          if (id.includes('components/CoursesPage')) return 'courses';
          if (id.includes('components/DashboardPage')) return 'dashboard';
          if (id.includes('components/AccountPage')) return 'account';
          if (id.includes('components/ModulePage')) return 'module';

          // Shared components chunk
          if (id.includes('components/ui')) return 'ui-components';

          // Core utilities
          if (id.includes('lib/') || id.includes('hooks/')) return 'utils';
        },
        // Optimize chunk names for production
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.split('.')[0]
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
});
```

### Verification Steps

1. Run `pnpm run build`
2. Check `dist/assets/` for separate route chunks
3. Open Network tab and verify lazy loading on route changes
4. Measure TTI improvement with Lighthouse

### Expected Impact

- **Initial Bundle**: 30-40% smaller
- **TTI Improvement**: 200-300ms faster
- **Route Navigation**: Slightly slower first visit, instant thereafter

---

## Issue #3: Additional Optimizations (LOW PRIORITY)

### Bundle Analysis and Monitoring

**Step 1: Add Bundle Analyzer**

```bash
pnpm add -D rollup-plugin-visualizer
```

Update `vite.config.ts`:

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... existing plugins
    visualizer({
      open: true,
      filename: 'dist/bundle-stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

**Step 2: Create Performance Budget**
Create `performance-budget.json`:

```json
{
  "bundles": [
    {
      "name": "main",
      "maxSize": "200KB"
    },
    {
      "name": "vendor",
      "maxSize": "150KB"
    },
    {
      "name": "css",
      "maxSize": "50KB"
    }
  ],
  "metrics": {
    "FCP": 2000,
    "TTI": 3500,
    "LCP": 2500,
    "CLS": 0.1
  }
}
```

**Step 3: Add Performance Monitoring Script**
Create `scripts/check-performance.js`:

```javascript
import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';

const distPath = './dist/assets';
const budget = JSON.parse(fs.readFileSync('./performance-budget.json', 'utf8'));

// Check bundle sizes
const files = fs.readdirSync(distPath);
const violations = [];

files.forEach((file) => {
  if (file.endsWith('.js') || file.endsWith('.css')) {
    const content = fs.readFileSync(path.join(distPath, file));
    const gzippedSize = gzipSync(content).length / 1024; // KB

    const budgetItem = budget.bundles.find((b) => file.includes(b.name));

    if (budgetItem && gzippedSize > parseInt(budgetItem.maxSize)) {
      violations.push({
        file,
        size: `${gzippedSize.toFixed(2)}KB`,
        limit: budgetItem.maxSize,
      });
    }
  }
});

if (violations.length > 0) {
  console.error('Performance budget violations:');
  violations.forEach((v) => {
    console.error(`  ❌ ${v.file}: ${v.size} (limit: ${v.limit})`);
  });
  process.exit(1);
} else {
  console.log('✅ All bundles within performance budget');
}
```

Add to `package.json`:

```json
{
  "scripts": {
    "perf:check": "node scripts/check-performance.js",
    "build:prod": "pnpm run build && pnpm run perf:check"
  }
}
```

---

## Implementation Order

### Phase 1: Quick Wins (1-2 hours)

1. Extract and inline critical CSS (Part 1A)
2. Implement route-based code splitting (Part 2A)
3. Add bundle analyzer

### Phase 2: Optimization (2-3 hours)

1. Optimize Tailwind with PurgeCSS (Part 1C)
2. Implement route prefetching (Part 2B)
3. Optimize Vite chunking (Part 2C)

### Phase 3: Monitoring (1 hour)

1. Set up performance budgets
2. Add performance monitoring scripts
3. Create CI/CD performance checks

---

## Testing Checklist

### Before Each Change

- [ ] Run Lighthouse audit and record scores
- [ ] Measure bundle sizes with `pnpm run build`
- [ ] Test on throttled 3G connection

### After Implementation

- [ ] Verify FCP < 2s on 3G
- [ ] Verify TTI < 3.5s on 3G
- [ ] Check no console errors
- [ ] Test all routes load correctly
- [ ] Verify lazy loading in Network tab
- [ ] Run `pnpm run perf:check`

### Performance Validation

```bash
# Run full performance check
pnpm run build:prod
npx lighthouse http://localhost:5173 --view

# Check bundle sizes
du -sh dist/assets/*.js | sort -h

# Analyze bundle composition
pnpm run build -- --analyze
```

---

## Troubleshooting

### Issue: CSS not loading after optimization

**Solution**: Ensure critical CSS includes all above-the-fold styles. Run visual regression tests.

### Issue: Routes showing blank during lazy load

**Solution**: Improve loading component, add skeleton screens, ensure Suspense boundaries are correct.

### Issue: Performance worse after changes

**Solution**: Check Network tab for duplicate resource loading, verify tree-shaking is working, ensure dev dependencies aren't in production.

---

## Expected Results

After implementing all optimizations:

| Metric      | Before | After  | Improvement |
| ----------- | ------ | ------ | ----------- |
| FCP         | 2.5-3s | <2s    | 20-33%      |
| TTI         | 4-5s   | <3.5s  | 22-30%      |
| Bundle Size | 1.3MB  | <800KB | 38%         |
| CSS Size    | 91.6KB | <50KB  | 45%         |
| Lighthouse  | 75     | 90+    | 20%         |

---

## Maintenance

- Review performance metrics monthly
- Update performance budgets as features are added
- Run bundle analyzer before each release
- Monitor Core Web Vitals in production using tools like Google Analytics or Sentry

## Resources

- [Web.dev Performance Guide](https://web.dev/performance/)
- [Vite Performance Docs](https://vitejs.dev/guide/performance.html)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing
