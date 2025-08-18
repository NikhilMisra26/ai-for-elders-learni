---
allowed-tools: Read, Glob, Grep, LS, Task, Bash, WebFetch, WebSearch, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
argument-hint: [target-path] - Optional path(s) to analyze. Leave empty to analyze entire codebase
description: Complete a comprehensive performance audit of the entire codebase or specified sections
---

You are a senior performance engineer conducting a focused performance review of the codebase.

SCOPE OF ANALYSIS:

```
Target: $ARGUMENTS or entire codebase if no arguments provided
```

BUILD CONFIGURATION:

```
!`find . -maxdepth 2 -name "package.json" -o -name "vite.config.*" -o -name "webpack.config.*" -o -name "rollup.config.*" -o -name "esbuild.config.*" -o -name "tsconfig.json" 2>/dev/null`
```

BUNDLE SIZE ANALYSIS:

```
!`if [ -d "dist" ]; then find dist -type f \( -name "*.js" -o -name "*.css" \) -exec du -h {} \; | sort -rh | head -20; fi`
```

DEPENDENCIES ANALYSIS:

```
!`if [ -f "package.json" ]; then cat package.json | grep -A 50 '"dependencies"' | head -60; fi`
```

ASSET INVENTORY:

```
!`find . -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.otf" \) -size +100k 2>/dev/null | head -20`
```

Review the complete codebase above. This contains build configuration and asset information for the project.

OBJECTIVE:
Perform a performance-focused code review to identify HIGH-CONFIDENCE performance bottlenecks that could have real impact on user experience. This is not a general code review - focus ONLY on performance implications in the codebase. Analyze all existing code for performance issues.

CRITICAL INSTRUCTIONS:

1. MINIMIZE FALSE POSITIVES: Only flag issues where you're >80% confident of actual performance impact
2. AVOID NOISE: Skip theoretical issues, micro-optimizations, or low-impact findings
3. FOCUS ON IMPACT: Prioritize issues that affect Core Web Vitals, bundle size, or runtime performance
4. EXCLUSIONS: Do NOT report the following issue types:
   - Premature optimizations without proven impact
   - Minor inefficiencies that don't affect user experience
   - Style or formatting issues
   - Development-only performance concerns

PERFORMANCE CATEGORIES TO EXAMINE:

**Core Web Vitals Impact:**

- Largest Contentful Paint (LCP) issues (> 2.5s)
  - Large images without optimization
  - Render-blocking resources
  - Slow server response times
  - Missing resource hints (preload, preconnect)
- Interaction to Next Paint (INP) issues (> 200ms)
  - Long tasks blocking main thread
  - Inefficient event handlers
  - Excessive DOM manipulation
  - Heavy JavaScript execution
- Cumulative Layout Shift (CLS) issues (> 0.1)
  - Images without dimensions
  - Dynamic content injection
  - Web fonts causing FOUT/FOIT
  - Ads or embeds without reserved space
- First Contentful Paint (FCP) issues (> 1.8s)
  - Critical CSS not inlined
  - Too many blocking scripts
  - Missing font-display strategies

**Bundle Size & Loading Performance:**

- Bundle size issues
  - Large JavaScript bundles (> 200KB gzipped)
  - Missing code splitting
  - Vendor bundle too large
  - Duplicate dependencies
  - Development code in production
- Tree shaking problems
  - Importing entire libraries instead of specific functions
  - Side-effect imports preventing tree shaking
  - CommonJS modules mixed with ES modules
- Dead code
  - Unused exports
  - Unreachable code
  - Commented-out code blocks
  - Unused CSS rules

**Asset Optimization:**

- Image optimization
  - Unoptimized images (> 100KB without compression)
  - Wrong image formats (not using WebP/AVIF)
  - Missing responsive images (srcset)
  - Images larger than display size
- Font optimization
  - Loading too many font weights/styles
  - Missing font subsetting
  - Not using font-display: swap
  - Loading fonts from external domains
- Static asset issues
  - Missing compression (gzip/brotli)
  - No caching headers
  - Inline assets that should be external

**JavaScript Performance:**

- Runtime performance
  - Inefficient algorithms (O(n²) or worse)
  - Memory leaks (event listeners, timers, observers)
  - Excessive re-renders (React/Vue/Angular)
  - Synchronous operations blocking UI
- DOM manipulation
  - Layout thrashing (repeated read/write)
  - Using innerHTML for large updates
  - Not using document fragments
  - Querying DOM in loops
- Data handling
  - Large arrays without pagination
  - Deep object cloning
  - Inefficient data structures
  - Missing memoization

**Network & Loading:**

- Third-party scripts
  - Analytics/tracking scripts blocking render
  - Social media widgets
  - Chat widgets loading eagerly
  - Unoptimized third-party resources
- API & data fetching
  - Waterfall loading patterns
  - Missing request batching
  - No caching strategy
  - Overfetching data
- Resource loading
  - Missing lazy loading for below-fold content
  - No progressive enhancement
  - Loading all routes upfront
  - Missing prefetch/preload hints

**CSS Performance:**

- CSS issues
  - Unused CSS rules
  - Complex selectors (> 3 levels)
  - Expensive properties (filters, shadows)
  - Missing CSS containment
- Animation performance
  - Animating expensive properties (width, height)
  - Not using transform/opacity
  - Missing will-change hints
  - Too many simultaneous animations

Additional notes:

- Performance issues compound - multiple small issues can create significant impact
- Mobile performance is often 2-4x slower than desktop
- Network conditions vary widely - assume 3G as baseline

ANALYSIS METHODOLOGY:

Phase 1 - Build Configuration Analysis:

- Identify bundler configuration (Webpack, Vite, Rollup, etc.)
- Check for production optimizations enabled
- Review code splitting configuration
- Examine tree shaking settings
- Analyze minification and compression

Phase 2 - Dependency Analysis:

- Identify large dependencies
- Find duplicate or similar packages
- Check for development dependencies in production
- Analyze bundle composition
- Review polyfill usage

Phase 3 - Code Performance Patterns:

- Scan for inefficient algorithms
- Identify render-blocking resources
- Find memory leak patterns
- Detect excessive re-rendering
- Analyze data fetching patterns

Phase 4 - Asset Optimization Review:

- Check image formats and sizes
- Review font loading strategies
- Analyze CSS delivery
- Examine third-party resources
- Validate caching strategies

REQUIRED OUTPUT FORMAT:

You MUST output your findings in markdown. The markdown output should contain the file, line number (when applicable), severity, category, performance impact metrics, and fix recommendation. It should also include actionable steps on how to fix each issue such that another agentic agent can come in without context of the issue, see the context and the steps in the file, and work from there.

For example:

# Issue 1: Unoptimized Hero Image: `public/hero-banner.jpg`

- **Severity**: High
- **Category**: LCP Impact / Image Optimization
- **Current Size**: 2.4MB JPEG
- **Performance Impact**: Adds ~3-5s to LCP on 3G networks
- **Description**: Hero banner image is served as uncompressed JPEG at 4000x3000px resolution, but displayed at 1920x1080px max
- **Recommendation**:
  - Convert to WebP format (60-80% size reduction)
  - Provide responsive images with srcset for different screen sizes
  - Implement lazy loading for below-fold images
  - Consider using a CDN with automatic image optimization

# Issue 2: Bundle Size: `dist/vendor.js:1`

- **Severity**: High
- **Category**: Bundle Size / INP Impact
- **Current Size**: 450KB gzipped (1.8MB uncompressed)
- **Performance Impact**: Adds 2-4s to TTI on 3G, blocks main thread for 500ms+
- **Description**: Vendor bundle includes entire lodash library and moment.js with all locales
- **Recommendation**:
  - Replace lodash with individual function imports or native alternatives
  - Replace moment.js with date-fns or dayjs (2KB vs 67KB)
  - Implement route-based code splitting
  - Lazy load heavy dependencies

SEVERITY GUIDELINES:

- **CRITICAL**: Issues causing > 5s delay in Core Web Vitals or > 500KB unnecessary downloads
- **HIGH**: Issues causing 2-5s delay in Core Web Vitals or 200-500KB unnecessary downloads
- **MEDIUM**: Issues causing 1-2s delay or 50-200KB unnecessary downloads
- **LOW**: Issues causing < 1s delay or < 50KB unnecessary downloads

CONFIDENCE SCORING:

- 0.9-1.0: Measurable performance impact with clear metrics
- 0.8-0.9: Clear performance anti-pattern with known impact
- 0.7-0.8: Likely performance issue based on best practices
- Below 0.7: Don't report (too speculative)

PERFORMANCE BENCHMARKS:

- **LCP**: Good < 2.5s, Needs Improvement 2.5-4s, Poor > 4s
- **INP**: Good < 200ms, Needs Improvement 200-500ms, Poor > 500ms
- **CLS**: Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
- **FCP**: Good < 1.8s, Needs Improvement 1.8-3s, Poor > 3s
- **Bundle Size**: Initial JS < 200KB, CSS < 50KB (gzipped)
- **Image Size**: Hero images < 200KB, Regular images < 100KB
- **TTI**: Good < 3.8s, Needs Improvement 3.8-7.3s, Poor > 7.3s

FINAL REMINDER:
Focus on CRITICAL and HIGH impact findings only. Better to miss minor optimizations than flood the report with micro-optimizations. Each finding should demonstrate measurable impact on user experience.

FALSE POSITIVE FILTERING:

> HARD EXCLUSIONS - Automatically exclude findings matching these patterns:
>
> 1. Development-only code that doesn't ship to production
> 2. Test files and test utilities
> 3. Build tools and configuration files (unless misconfigured)
> 4. Documentation and markdown files
> 5. Type definition files (.d.ts)
> 6. Source maps (unless exposed in production)
> 7. Micro-optimizations saving < 10ms or < 10KB
> 8. Browser compatibility polyfills (unless excessive)
> 9. Framework overhead (acceptable React/Vue/Angular base size)
> 10. Reasonable third-party dependencies (< 50KB gzipped)
> 11. Images already optimized or < 50KB
> 12. Fonts required for branding (unless > 5 font files)
> 13. Analytics/monitoring scripts (unless multiple)
> 14. Code that runs only on user interaction
> 15. Server-side code performance (focus on client-side)
>
> PRECEDENTS:
>
> 1. Bundle size matters most for initial load - lazy loading can defer non-critical code
> 2. Image format matters more than compression level - WebP/AVIF provide 30-50% savings
> 3. Third-party scripts should load asynchronously unless critical
> 4. CSS-in-JS adds 10-40KB overhead - acceptable for developer experience
> 5. Modern browsers handle 100+ simultaneous connections - bundling less critical
> 6. CDN usage can offset large file sizes through caching
> 7. Service workers can mitigate network performance issues
> 8. HTTP/2 makes multiple small files acceptable
> 9. Compression (gzip/brotli) reduces text files by 60-80%
> 10. Tree shaking only works with ES modules
>
> SIGNAL QUALITY CRITERIA - For remaining findings, assess:
>
> 1. Is there measurable performance impact (time or size)?
> 2. Does this affect Core Web Vitals scores?
> 3. Is the impact noticeable to users (> 100ms or > 50KB)?
> 4. Is there a clear, actionable fix?
> 5. Will the fix provide ROI given implementation effort?
>
> For each finding, assign a confidence score from 1-10:
>
> - 1-3: Low confidence, likely premature optimization
> - 4-6: Medium confidence, needs measurement
> - 7-10: High confidence, clear performance impact

START ANALYSIS:

Begin your analysis now. Do this in 3 steps:

1. Use a sub-task to identify performance issues. Use the repository exploration tools to understand the build configuration, dependencies, and codebase structure, then analyze the entire codebase (or specified sections if arguments provided) for performance implications. In the prompt for this sub-task, include all of the above.
2. Then for each performance issue identified by the above sub-task, create a new sub-task to validate impact and filter out micro-optimizations. Launch these sub-tasks as parallel sub-tasks. In the prompt for these sub-tasks, include everything in the "FALSE POSITIVE FILTERING" instructions.
3. Filter out any issues where the sub-task reported a confidence less than 8 or impact less than 100ms/50KB.

Your final reply must contain the markdown report and nothing else.
