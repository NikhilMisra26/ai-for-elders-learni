# Discover 50 AI

Discover 50 AI is a React-based learning platform that teaches people over 50 how to use AI safely and confidently. The app includes structured courses, progress tracking, audio narration, testimonials, and a secure support workflow.

## Features

- Multi-module AI basics course with audio narration
- Progress tracking and dashboard
- Testimonials and reviews
- Support email workflow via Supabase Edge Function
- Accessibility-first UI and security hardening

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, edge functions)
- Vercel Blob (audio storage)

## Local Development

Prerequisites:

- Node.js 18+
- pnpm
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

### 🎨 **Enhanced Visual Design**

- **Expanded Color Palette**: Vibrant orange, green, purple, and yellow color schemes for visual engagement
- **Tier-Based Visual Differentiation**:
  - Free tier: Orange theme with warm, inviting colors
  - Advanced tier: Purple gradient with premium feel
  - Expert tier: Gold/yellow accents with exclusive appearance
- **Visual Learning Components**:
  - **Callout Boxes**: 7 variants (info, tip, warning, success, activity, concept, practice) for breaking up content
  - **Text Highlighting**: Smart highlighting system for key terms and important concepts
  - **Progress Rings**: Animated circular progress indicators with smooth transitions
  - **Enhanced Tier Badges**: Color-coded badges with icons and micro-animations
- **Improved Contrast**: All text maintains WCAG AA+ contrast ratios with subtle gradient backgrounds
- **Micro-Interactions**: Smooth hover effects, scale animations, and visual feedback
- **Gradient Backgrounds**: Subtle, accessibility-compliant gradients that add depth without reducing readability

### 🔐 **Security & Privacy**

- **Production-Ready CSP**: Strict Content Security Policy with nonce-based inline script protection
- **Zero Unsafe Directives**: No 'unsafe-inline' or 'unsafe-eval' in production CSP
- **Environment-Specific Security**: Dynamic Supabase URL integration, no wildcard domains
- **Enhanced Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Secure Session Management**: Supabase Auth with httpOnly cookies and automatic token refresh
- **Cryptographically Secure**: Web Crypto API enforced, no weak fallbacks
- **XSS Protection**: Multi-layer sanitization with DOMPurify, safe React rendering, CSP enforcement
- **Rate Limiting & CSRF Protection**: Built-in security module with constant-time comparison
- **Row Level Security (RLS)**: All database tables protected with user-scoped policies
- **Production-Ready**: Sourcemaps disabled, console logs conditional, error details sanitized
- **Security Hardened**: All high-confidence vulnerabilities resolved, production-ready

### 💬 **Support System**

- **Email Support Dialog**: Users can send support messages directly from Account page
- **Security-First Design**: Rate limiting (3 emails/hour), input sanitization, XSS protection
- **Accessibility Optimized**: ARIA labels, keyboard navigation, senior-friendly UI
- **Database Tracking**: All support tickets stored with user context and timestamps
- **Optional Email Integration**: Supabase Edge Function sends emails to support team
- **Resend API Integration**: Professional email delivery with reply-to functionality
- **Security Auditing**: All support actions logged for compliance
- **In-App Support Form**: User-friendly form with character counting and validation
- **Ticket History**: Users can view their past support tickets and resolutions

### 💳 **Subscription System**

- **Free**: Complete 6-module AI basics course covering fundamentals, conversations, daily tasks, safety, AI for daily life, and graduation
- **Advanced ($1.99/month)**: Personal assistant course + advanced features
- **Expert ($4.99/month)**: Cutting-edge AI technologies + custom assistants

### 📖 **Course Content**

The free "DISCOVER BASICS: AI for Everyday Life" course is now complete with 6 comprehensive modules:

1. **What is AI, Really?** - Understanding AI through familiar examples like Netflix and GPS
2. **Your First AI Conversation** - Learning natural conversation techniques vs keyword searches
3. **AI for Daily Tasks** - Practical applications for health, family, hobbies, and organization
4. **Staying Safe with AI** - Essential privacy rules, spotting mistakes, and avoiding scams
5. **AI for Daily Life** - In-depth coverage of health/wellness support, family connections, and personal growth
6. **Congratulations - Your AI Journey Begins!** - Course completion and encouragement for continued learning

Each module includes real-world examples, success stories from seniors, practical exercises, and safety reminders specifically designed for learners over 50.

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **State**: React Context API
- **Authentication**: Supabase Auth
- **Analytics**: Vercel Web Analytics for page views and user metrics
- **Icons**: Phosphor Icons


### Development Commands

```bash
pnpm run dev             # Start development server
pnpm run build           # Build for production
pnpm run typecheck       # Run TypeScript checking
pnpm run lint:fix        # Fix linting issues
pnpm run format          # Format code with Prettier

# Security Commands
pnpm run security:audit  # Run dependency vulnerability audit
pnpm run security:check  # Full security check (typecheck + lint + audit)
pnpm run security:full   # Complete check including format validation
```


## ⚡ Performance Optimization

A comprehensive performance audit has been completed and documented. For detailed optimization instructions, see:

- **[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)** - Step-by-step guide to fix all identified performance issues

### Current Performance Status

- **Bundle Size**: 1.3MB (optimizable to <800KB)
- **Lighthouse Score**: ~75/100 (target: 90+)
- **FCP**: 2.5-3s on 3G (target: <2s)
- **TTI**: 4-5s on 3G (target: <3.5s)

### Key Issues Identified

- **HIGH**: CSS render-blocking (91.6KB gzipped, adds 500-600ms to FCP)
- **MEDIUM**: Missing route-based code splitting (200-300ms TTI impact)

### Already Optimized

✅ Audio migration to Vercel Blob Storage (28.8MB moved to CDN, 100GB/month bandwidth)  
✅ Component code-splitting (ModulePage uses React.lazy)  
✅ Efficient vendor chunking  
✅ Production build optimizations  
✅ Memory management (no leaks detected)

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

### 🎨 Content Formatting System

The platform includes a comprehensive content parsing and visual formatting system (`src/lib/contentFormatting.ts`) for rendering course content:

**Content Section Types:**

- **Normal** - Standard text sections with gray styling
- **Warning** - Amber-colored warning blocks (⚠️ prefix)
- **Tips** - Purple-accented helpful tips (💡 prefix)
- **Exercises** - Blue-bordered practice exercises (📝 prefix)
- **Success** - Green success/completion blocks (✅ prefix)
- **Key Points** - Yellow-highlighted important information (🔑/⭐ prefix)

**Parsing Features:**

- **Markdown-style headers** - `#`, `##`, `###` for different heading levels
- **Bullet points** - Lines starting with `-` become formatted lists
- **Numbered lists** - Lines starting with numbers become ordered lists
- **Text formatting** - Support for **bold**, _italic_, and `code` inline styles
- **Paragraph handling** - Automatic paragraph wrapping with proper spacing

**Visual Design:**

- **Senior-friendly styling** - Large fonts, high contrast, adequate spacing
- **Phosphor Icons** - Contextual icons for each section type
- **Tailwind CSS** - Consistent color schemes and responsive design
- **HTML output** - Safe HTML generation with proper sanitization

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

## 🔧 Code Quality & Security Improvements

### CI/CD Security Gates



## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm security:check`
