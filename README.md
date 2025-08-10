# AI for Elders 🧠✨

**AI for Elders** is a React-based educational platform designed to teach adults 50+ how to effectively and safely use artificial intelligence. The platform features a multi-tier subscription system, user authentication, progress tracking, and accessibility features optimized for older learners.

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

- Large fonts and high contrast design
- Audio narration for all content
- Touch-friendly interface with proper target sizes
- Clear navigation with breadcrumbs
- WCAG 2.1 AA accessibility compliance

### 🔐 **Security & Privacy**

- **Frontend Security**: Comprehensive security module with rate limiting, CSRF protection, and XSS prevention
- **Backend Security**: Enhanced Express server with Helmet headers, request size limits, and input validation
- **Database Security**: Row Level Security (RLS) on all database tables
- **Session Management**: Automatic timeout and suspicious activity detection
- **Defensive Initialization**: Robust Supabase client with graceful degradation when configuration is invalid

### 💳 **Subscription System**

- **Free**: Basic AI course with community access
- **Advanced ($1.99/month)**: Personal assistant course + advanced features
- **Expert ($4.99/month)**: Cutting-edge AI technologies + custom assistants
- **Stripe Payment Integration**: Real payment processing (no free trials)
  - Automatic tier updates via webhooks with idempotency protection
  - Customer portal for subscription management
  - Secure checkout with immediate payment
  - Invoice history with downloadable PDFs
  - Database transaction safety for webhook processing

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express with security middleware
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Database**: Supabase (PostgreSQL) with defensive client initialization
- **State**: React Context API
- **Authentication**: Supabase Auth
- **Payment**: Stripe with webhook integration
- **Security**: Helmet, rate limiting, input validation
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

3. **Stripe Integration** (`supabase/migrations/002_add_stripe_fields.sql`):
   ```sql
   -- Adds Stripe customer and subscription fields
   -- Creates automatic tier update triggers
   -- Implements subscription-based RLS policies
   ```

4. **Webhook Idempotency** (`supabase/migrations/003_add_webhook_idempotency.sql`):
   ```sql
   -- Creates webhook_events table for idempotency tracking
   -- Prevents duplicate processing of Stripe webhook events
   -- Includes helper functions for transaction safety
   ```

### 3. Environment Configuration

Copy `.env.example` to `.env.local` and add required variables. See [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md) for complete documentation of all configurable options.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. Stripe Setup

See `STRIPE_SETUP.md` for detailed instructions on:
- Creating Stripe products and prices
- Deploying Supabase Edge Functions
- Configuring webhooks
- Setting up the customer portal

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

## 🧪 Testing & Development

### Debugging & Logging

The application includes extensive logging throughout the startup and runtime process to help debug issues:

#### **Application Startup Logging** (`src/main.tsx`):
- Environment variable validation with status indicators
- Root element detection and DOM inspection
- React root creation and rendering process tracking
- Error boundary integration with detailed error reporting
- Critical error handling with stack traces

#### **Component Lifecycle Logging** (`src/App.tsx`):
- App component mount/unmount tracking
- AppContent component initialization and state logging
- Page navigation events with source and destination tracking
- Auth dialog state changes and user interactions
- Security dashboard keyboard shortcut detection
- Lazy component loading progress for all page components

#### **Accessing Debug Information**:
- Open browser DevTools (F12) to view console logs
- All logs are prefixed with `[MAIN]` or `[APP]` for easy filtering
- Success messages marked with ✓, errors with ✗, warnings with ⚠️
- Component mount/unmount lifecycle clearly tracked
- Real-time state changes logged for debugging user interactions

### Stripe Payment Testing

The `StripeTestDashboard` component provides comprehensive testing capabilities for the payment system:

- **Payment Flow Testing**: Simulate successful and failed payment scenarios using official Stripe test cards
- **Subscription Management**: Test tier changes, billing cycles, and subscription status updates
- **Webhook Event Monitoring**: View and track webhook events for payment processing
- **Database State Verification**: Inspect user profiles and subscription data in real-time
- **Test User Profiles**: Switch between different user contexts for comprehensive testing

**Access**: Available only in development mode - automatically disabled in production.

**Test Cards Included**:
- Success: `4242424242424242`
- Card Declined: `4000000000000002`
- Insufficient Funds: `4000000000009995`
- Fraud Prevention: `4000000000000069`
- 3D Secure Required: `4000002500003155`

## 🏗️ Architecture Notes

- **Offline-First**: Local storage with cloud sync when authenticated
- **Caching**: 5-minute cache on analytics data for performance
- **Security**: Comprehensive rate limiting and session management
- **Accessibility**: Designed specifically for users 50+ with accessibility features
- **Defensive Database Client**: Supabase client with crash-prevention and graceful degradation
  - Extensive validation of environment variables with detailed console logging
  - Automatic fallback to mock client when configuration is invalid
  - Safe error handling with comprehensive try-catch blocks
  - Health check system for monitoring connection status
  - Application continues to function (with limited features) even when Supabase is unavailable
