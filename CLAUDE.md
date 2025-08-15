# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MOST IMPORANT STEP

**Before writing or editing any code. MANDATORY STEP!!! DO NOT SKIP!!**:

1. Decide if **multiple subagents can run in parallel** for this task.
2. If YES — list exactly which subagents will be used, their goals, and spawn them now.
3. If NO — write a one-line justification for why parallelization is unnecessary.
4. Always give each subagent a **full standalone brief**:
   - Goal
   - Current problem/context
   - Tech stack (Vite + React + TS + Supabase + Stripe)
   - Constraints/patterns/naming conventions
   - Deliverables (files, diffs, docs, tests)
5. **Default to parallelization unless strict dependencies force sequential work.**

## Important

- After completing a task, edit the readme to reflect the changes you made. Either edit existing stuff in the readme or, for a new feature, add it in a concise way

### Critical Directives

1. It's more important to wirte **Lint and tsc error-free code** to start with than fixing those errors afterwards to ensure efficiency. Please **review the @eslint.config.mjs before writing code** to ensure you write good code first and do not waste tokens later.

2. When fixing bugs or adding features, use the smartest and most minimalistic approach possible white still maintaining UI/UX, security, and all other important things

3. After finishing edits, use pnpm lint:fix

## Project Overview

This is **DISCOVER 50 AI**, a React-based educational platform designed to teach people over 50 how to effectively and safely use artificial intelligence through structured, accessible courses. The platform features a multi-tier subscription system (Free, Advanced $1.99/month, Expert $4.99/month) with user authentication, progress tracking, and accessibility features optimized for learners over 50.

## Development Commands

### Core Development

- `pnpm run dev` - Start the Vite development server on port 5173
- `pnpm run build` - Type check with `tsc -b --noCheck` and build production bundle with Vite
- `pnpm run preview` - Preview production build locally

### Code Quality

- `pnpm run typecheck` - Run TypeScript type checking without emitting files
- `pnpm run lint:fix` - Auto-fix ESLint issues where possible and check remaining ones
- `pnpm run format` - Format all code with Prettier
- `pnpm run format:check` - Check if code formatting is correct

### Utilities

- `pnpm run kill` - Kill process on port 5000 (useful when port is stuck)
- `pnpm run optimize` - Run Vite optimization

## Architecture

### Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: React Context API (AuthContext, AccessibilityContext)
- **Database**: Supabase (PostgreSQL) for user auth, profiles, subscriptions, and progress tracking
- **UI Components**: Custom shadcn/ui components in `src/components/ui/`

### Key Design Patterns

1. **Client-side Routing**: Custom page-based routing in `App.tsx` using state management (no React Router)
   - Pages: home, courses, dashboard, account
   - Auth handled via dialog modal overlay

2. **Offline-First with Cloud Sync**:
   - Local storage for immediate UI updates
   - Supabase sync when authenticated
   - Graceful fallback for network failures

3. **Accessibility-First Design**:
   - AccessibilityContext manages font size, dark mode, and audio narration
   - Web Speech API integration for text-to-speech
   - Minimum font sizes and touch targets optimized for people over 50

4. **Security Architecture**:
   - Comprehensive security module (`src/lib/security.ts`) with rate limiting, CSRF protection, XSS prevention
   - Session management with automatic timeout and suspicious activity detection
   - Security dashboard accessible via Ctrl+Shift+S (admin monitoring)

### Database Schema

The Supabase database includes:

- **profiles**: Extended user data with tier, verification status, security features
- **subscriptions**: Subscription management with billing cycles and grace periods
- **course_progress**: Overall course tracking
- **module_progress**: Individual module completion data
- **user_activity**: Activity logging for analytics
- **invoices**: Billing history

All tables use Row Level Security (RLS) policies for data isolation.

## Environment Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `supabase.schema.sql` in Supabase SQL Editor
3. Copy `.env.example` to `.env.local` and add:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Code Style Guidelines

### TypeScript Configuration

- Strict null checks enabled
- No explicit `any` types (enforced by ESLint)
- Path alias `@/` maps to `src/` directory
- Return types required for all functions

### Component Patterns

- Functional components with explicit return type annotations
- Props interfaces defined inline or as separate types
- Event handlers properly typed (e.g., `React.MouseEvent<HTMLButtonElement>`)
- Use of shadcn/ui components for consistent styling

### State Management

- AuthContext handles authentication state and user profile
- AccessibilityContext manages UI preferences
- Local component state for UI-only concerns
- Supabase for persistent data

## Testing Approach

Currently no test framework is configured. When implementing tests:

1. Check for testing framework preference with the team
2. Consider accessibility testing tools for senior-friendly validation
3. Focus on critical user journeys: auth, subscription, course progress

## Important Considerations

1. **50+ Friendly Design**: All UI decisions should prioritize clarity and ease of use for people over 50
2. **Security First**: The platform handles payment information and personal data - security measures are critical
3. **Progressive Enhancement**: Features should work offline where possible with online sync
4. **Accessibility Compliance**: Maintain WCAG 2.1 AA standards minimum

## Module Structure

- `/src/components/` - React components (pages and UI)
- `/src/components/ui/` - shadcn/ui component library
- `/src/contexts/` - React Context providers
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Core business logic and utilities
- `/src/types/` - TypeScript type definitions
