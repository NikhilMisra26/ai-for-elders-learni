# DISCOVER 50 AI 🧠✨

**DISCOVER 50 AI** is a React-based educational platform designed to teach people over 50 how to effectively and safely use artificial intelligence. The platform features a multi-tier subscription system, user authentication, progress tracking, and accessibility features optimized for learners over 50.

## 🌟 Key Features

### 📊 **Dynamic Metrics System**

- **Smart Thresholds**: Metrics only display when impressive enough
  - User count: Shows only when ≥ 1000 users
  - Course completion: Shows only when ≥ 85%
  - Average rating: Shows only when ≥ 4.0 stars with testimonials
  - Countries: Shows only when ≥ 5 countries
- **Real-time Data**: Fetches actual statistics from Supabase database
- **Responsive Layout**: Automatically adjusts grid to maintain symmetry
- **Performance Optimized**: 5-minute caching for fast load times

### 🎯 **Testimonials & Reviews**

- **Real User Reviews**: Displays approved testimonials from actual users
- **Review Submission**: Authenticated users can submit reviews via dialog
- **Admin Approval Workflow**: Reviews require approval before display
- **Fallback CTA**: Shows "Be the First to Review" when no testimonials exist
- **Duplicate Prevention**: Users can only submit one review

### 🎨 **Senior-Friendly Design**
- Large fonts and high contrast design for people over 50
- **Robust Audio narration** with intelligent error handling, smooth state management, and instance isolation
- Touch-friendly interface with proper target sizes
- Clear navigation with breadcrumbs
- WCAG 2.1 AA accessibility compliance
- **Error-resilient UI** preventing blank screens from component failures
- **Comprehensive Error Boundaries** wrapping all critical components (ModulePage, CoursesPage, DashboardPage)
- **User-friendly 404 page** with clear navigation options and senior-friendly messaging
- **50+ optimized error messages** with larger buttons and simplified language
- **Custom BrandName Component**: Visually distinctive branding with rainbow gradient "OVER 50" badge, responsive hero variant, and full accessibility support

### 🔐 **Security & Privacy**

- **Enhanced Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Secure Session Management**: Supabase Auth with httpOnly cookies and automatic token refresh
- **Cryptographically Secure**: Web Crypto API enforced, no weak fallbacks
- **XSS Protection**: Safe DOM manipulation, sanitized error messages in production
- **Rate Limiting & CSRF Protection**: Built-in security module
- **Row Level Security (RLS)**: All database tables protected with user-scoped policies
- **Production-Ready**: Sourcemaps disabled, console logs conditional, error details sanitized

### 💳 **Subscription System**

- **Free**: Basic AI course with community access
- **Advanced ($1.99/month)**: Personal assistant course + advanced features
- **Expert ($4.99/month)**: Cutting-edge AI technologies + custom assistants
- **Secure Stripe Integration**: PCI-compliant checkout with JWT authentication
- **Automatic Subscription Management**: Webhook handling for payment updates

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State**: React Context API
- **Authentication**: Supabase Auth
- **Icons**: Phosphor Icons

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Development Commands

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run typecheck    # Run TypeScript checking
pnpm run lint:fix     # Fix linting issues
pnpm run format       # Format code with Prettier
```

## 🗄️ Database Setup

### 1. Create Supabase Project

- Create a new project at [supabase.com](https://supabase.com)
- Get your project URL and anon key

### 2. Run Database Migrations

Execute these SQL files in your Supabase SQL Editor in order:

1. **Main Schema** (`supabase.schema.sql`):

   ```sql
   -- Creates profiles, subscriptions, progress, and activity tables
   -- Includes Row Level Security policies
   ```

2. **Testimonials System** (`supabase-testimonials.sql`):
   ```sql
   -- Creates testimonials table for user reviews
   -- Adds get_platform_stats() function for dynamic metrics
   -- Includes admin approval workflow
   ```

### 3. Environment Configuration

Copy `.env.example` to `.env.local` and add:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📊 Managing Dynamic Metrics

### Testimonials Administration

1. **View Submissions**: Query `testimonials` table in Supabase
2. **Approve Reviews**: Set `is_approved = true`
3. **Order Display**: Set `display_order` for custom sorting
4. **Thresholds**: Adjust thresholds in `src/hooks/useMetrics.ts`

### Metrics Thresholds

Current settings ensure only impressive metrics are shown:

- **Users**: 1000+ (configurable in `THRESHOLDS.MIN_USERS`)
- **Completion Rate**: 85%+ (configurable in `THRESHOLDS.MIN_COMPLETION_RATE`)
- **Rating**: 4.0+ stars (configurable in `THRESHOLDS.MIN_RATING`)
- **Countries**: 5+ (configurable in `THRESHOLDS.MIN_COUNTRIES`)

## 🛡️ Route Protection System

### React Router Compatible Components

The platform includes comprehensive route protection for future React Router migration:

- **`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`): React Router v6/v7 compatible route wrapper
- **`RouteGuard`** (`src/components/RouteGuard.tsx`): Works with current custom routing system
- **`useRouteProtection`** (`src/hooks/useRouteProtection.ts`): Core protection logic hook

### Features

- **Authentication Guard**: Redirects unauthenticated users with preserved destination
- **Role-Based Access**: Supports `free`, `advanced`, `expert`, and `admin` roles
- **Tier Upgrades**: Shows upgrade prompts for insufficient subscription tiers
- **Accessibility**: Full WCAG compliance with proper ARIA labels and keyboard navigation
- **50+ Friendly**: Large touch targets, clear messaging, and simplified UI flows

### Usage Examples

```tsx
// React Router compatible (future migration)
<Route path="/dashboard" element={
  <ProtectedRoute requiredRole="advanced">
    <DashboardPage />
  </ProtectedRoute>
} />

// Current custom routing system
<RouteGuard requiredRole="expert" onAuthRequired={openAuthDialog}>
  <ExpertContent />
</RouteGuard>
```

## 🔒 Security & Production Readiness

### Recent Security Audit (2025-08-12)

A comprehensive security audit was performed with the following fixes applied:

#### Critical Security Fixes ✅

- **Security Headers**: Added CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Session Management**: Migrated from localStorage to Supabase Auth's secure httpOnly cookies
- **Crypto Security**: Removed Math.random() fallback, now requires Web Crypto API
- **XSS Prevention**: Fixed innerHTML usage with safe DOMParser, sanitized all user inputs

#### Production Optimizations ✅

- **Sourcemaps**: Disabled in production builds to prevent source code exposure
- **Console Logs**: Conditionally disabled in production (only show in development)
- **Error Messages**: Sanitized to prevent information leakage
- **Bundle Splitting**: Optimized chunks for React, Supabase, UI libraries
- **Environment Variables**: Secured with proper .gitignore patterns

#### Testing Requirements

After deployment, verify:

- Sign-in/sign-out flows work correctly
- Session refresh and token expiration behave properly
- CORS and cookies work in production environment
- Error boundaries catch and display user-friendly messages

### Deployment Security Headers

For **Vercel** deployments, `vercel.json` includes:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

For **Netlify** deployments, `_headers` file is configured with equivalent security headers.

## 🏗️ Architecture Notes

- **Offline-First**: Local storage with cloud sync when authenticated
- **Caching**: 5-minute cache on analytics data for performance
- **Security**: Comprehensive rate limiting and session management
- **Accessibility**: Designed specifically for people over 50 with accessibility features
- **React Router v7**: Modern client-side routing with lazy loading and protected routes
- **Performance Optimizations**: Infinite loop prevention in module navigation with ref-based tracking
- **Production Build Optimization**: Sourcemaps disabled in production, optimized bundle splitting with separate chunks for Supabase, Radix UI, and other large dependencies

### 📚 Course Navigation System

The platform now uses React Router v7 for seamless course and module navigation:

**Route Structure:**

- `/courses` - Course listing page
- `/courses/basic` - Free AI basics course (redirects to first module)
- `/courses/advanced` - Advanced course ($1.99/month, redirects to first module)
- `/courses/expert` - Expert course ($4.99/month, redirects to first module)
- `/courses/:courseType/module/:moduleId` - Individual module pages

**Navigation Features:**

- **Automatic Redirection**: Course root paths redirect to the first module automatically
- **URL Parameters**: Course type and module ID are preserved in the URL for bookmarking
- **Smart Back Navigation**: Back buttons intelligently navigate to course overview or main courses page
- **Module Progression**: Previous/Next buttons update the URL for proper navigation history
- **Course Outline Navigation**: Module sidebar allows direct navigation to any module within a course

**Course Type Mapping:**

- `basic` ↔ `ai-basics` (Free tier)
- `advanced` ↔ `ai-assistant` (Advanced tier, $1.99/month)
- `expert` ↔ `advanced-ai` (Expert tier, $4.99/month)

**Recent Bug Fixes:**

- **Module Navigation Performance**: Fixed "Maximum update depth exceeded" error in ModulePage.tsx by implementing ref-based tracking to prevent redundant `setCurrentModule` calls in useEffect hooks
- **Audio Narration Hook Recreation Fix**:
  - **Fixed hook recreation issue**: Added `useMemo` to memoize module content passed to `useAudioNarration` hook, preventing unnecessary hook recreation on every render
  - **Improved cleanup logic**: Fixed cleanup effect to only run on actual component unmount by removing problematic dependencies that caused audio to stop immediately after starting
  - **Double-cleanup prevention**: Added ref tracking to ensure cleanup operations only run once per component lifecycle
  - **Enhanced unmount handling**: Cleanup now properly detects component unmount vs effect re-run to preserve audio playback during normal state changes
- **Audio Narration Critical Fixes**:
  - **Fixed utterance recreation bug**: Moved utterance to ref to prevent recreation during state changes that interrupted active speech
  - **Resolved race conditions**: Added separate ref tracking for actual speech state vs React state to prevent sync issues
  - **Enhanced state management**: Only recreate utterance when text changes, not on rate/volume/voice adjustments
  - **Improved settings handling**: Apply rate/volume/voice changes to existing utterance dynamically without interruption
  - **Extensive debugging**: Added comprehensive console logging with timestamps and context for troubleshooting
  - **Better error handling**: Graceful handling of 'interrupted' errors and proper cleanup on component unmount
  - **Pause/Resume intelligence**: Improved logic to resume paused speech instead of restarting unnecessarily

## 🔧 Code Quality Improvements

### Production-Ready Console Statements

- **Console Statement Optimization**: Conditionally disabled all console.log/warn/error statements in production builds using `import.meta.env.DEV` checks
- **Error Handler Integration**: Replaced production console statements with proper errorHandler service calls for centralized logging
- **Vite Environment Variables**: Fixed `process.env` usage to use `import.meta.env` for proper Vite compatibility
- **Package Naming**: Updated package.json name from "spark-template" to "discover-50-ai" for proper project identification
