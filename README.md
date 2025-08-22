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
- **Icons**: Phosphor Icons

## 🚀 Quick Start

### **For Email Support Feature Setup:**

1. **Database Setup** (Required):

   ```sql
   -- Copy this into Supabase SQL Editor and run:
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   CREATE TABLE IF NOT EXISTS public.support_tickets (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
       status TEXT NOT NULL DEFAULT 'pending',
       user_email TEXT NOT NULL,
       user_name TEXT,
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   CREATE TABLE IF NOT EXISTS public.rate_limiting_support (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
       action_type TEXT NOT NULL DEFAULT 'ticket_create',
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
   CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
   CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
   CREATE INDEX IF NOT EXISTS idx_rate_limiting_user_time ON public.rate_limiting_support(user_id, created_at DESC);

   ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.rate_limiting_support ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can create their own tickets" ON public.support_tickets
       FOR INSERT WITH CHECK (auth.uid() = user_id);
   CREATE POLICY "Users can view their own tickets" ON public.support_tickets
       FOR SELECT USING (auth.uid() = user_id);
   CREATE POLICY "Users can track their rate limits" ON public.rate_limiting_support
       FOR ALL USING (auth.uid() = user_id);
   ```

2. **Test the Feature**:
   - Run `pnpm run dev`
   - Go to Account page
   - Click "Email Support" button
   - Submit a test message

3. **Optional Email Setup** (for actual email sending):
   - Sign up at [resend.com](https://resend.com)
   - Get API key
   - Add to Supabase → Edge Functions → Secrets:
     - `RESEND_API_KEY`: your key
     - `ALLOWED_ORIGIN`: `http://localhost:5173`
   - Deploy: `supabase functions deploy send-support-email`

### **For Full Project Setup:**

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

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

## 🎵 Audio Infrastructure

The platform utilizes **Vercel Blob Storage** for efficient audio file delivery:

- **28 MP3 files** (28.8MB total) hosted on Vercel's global CDN
- **100GB/month bandwidth** on free tier (50x more than alternatives)
- **Edge caching** for ~50ms global latency
- **Streaming support** for progressive audio loading
- **Migration Guide**: See [AUDIO_MIGRATION.md](./AUDIO_MIGRATION.md) for implementation details

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

The project now includes comprehensive security automation via GitHub Actions:

#### **Security Workflow** (`.github/workflows/security.yml`)

- **Dependency Auditing**: Automated vulnerability scanning with `pnpm audit`
- **Type Safety**: TypeScript type checking on every commit
- **Code Quality**: ESLint and Prettier validation
- **Secret Scanning**: TruffleHog integration for credential detection
- **Bundle Size Monitoring**: 5MB limit enforcement with detailed analysis
- **License Compliance**: Automated license checking for legal compliance
- **Environment Variable Security**: Detection of hardcoded secrets in code

#### **Automated Triggers**

- ✅ Every push to main branch
- ✅ All pull requests
- ✅ Weekly scheduled dependency audits
- ✅ Manual workflow dispatch for on-demand checks

#### **Security Thresholds**

- **Vulnerabilities**: Zero tolerance for moderate+ severity issues
- **Bundle Size**: Maximum 5MB production bundle
- **Secrets**: No hardcoded credentials or API keys allowed
- **Type Safety**: Strict TypeScript checking required

### Production-Ready Console Statements

- **Console Statement Optimization**: Conditionally disabled all console.log/warn/error statements in production builds using `import.meta.env.DEV` checks
- **Error Handler Integration**: Replaced production console statements with proper errorHandler service calls for centralized logging
- **Vite Environment Variables**: Fixed `process.env` usage to use `import.meta.env` for proper Vite compatibility
- **Package Naming**: Updated package.json name from "spark-template" to "discover-50-ai" for proper project identification
