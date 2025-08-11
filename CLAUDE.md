# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
**MOST IMPORTANT AND MANDATORY STEP**
**Parallelization Protocol (MANDATORY)**
- When in "Plan Mode," come up with a very brief summary of how you will use subagents IF you plan to use them in order to maximize efficiency
- If you decide NOT to use subagnets **justify why they are unnecesary**. 
- **Look at Critical Directive** for more info on **HOW to decide which subagents to use**

## Subagent Parallel Execution Strategy

### Common Parallel Patterns

**Feature Implementation Pattern:**
User: "Add a subscription management feature"
→ Launch IN PARALLEL:
- ui-component-builder (subscription UI)
- api-endpoint-generator (subscription endpoints)  
- database-schema-designer (subscription schema)
- payment-integration-specialist (Stripe setup)

**Code Quality Pattern:**
User: "Clean up and optimize the codebase"
→ Launch IN PARALLEL:
- code-refactorer (optimize code)
- ts-lint-fixer (fix type issues)
- test-suite-writer (add missing tests)

**Deployment Pattern:**
User: "Prepare for production deployment"
→ Launch IN PARALLEL:
- deployment-configurator (setup deployment)
- security-hardener (security audit)
- test-suite-writer (E2E tests)

**Authentication Pattern:**
User: "Implement user authentication"
→ Launch IN PARALLEL:
- authentication-implementer (auth logic)
- database-schema-designer (user tables)
- ui-component-builder (login/signup forms)
- api-endpoint-generator (auth endpoints)

### Trigger Keywords → Agent Mapping

- "component", "UI", "form", "button", "modal", "page" → ui-component-builder
- "type error", "lint", "TypeScript", "ESLint" → ts-lint-fixer  
- "security", "vulnerability", "audit", "OWASP" → security-hardener
- "database", "table", "schema", "migration", "RLS" → database-schema-designer
- "API", "endpoint", "route", "server", "webhook" → api-endpoint-generator
- "login", "auth", "user", "protected", "OAuth" → authentication-implementer
- "refactor", "optimize", "clean", "performance" → code-refactorer
- "test", "testing", "coverage", "E2E" → test-suite-writer
- "payment", "Stripe", "subscription", "billing" → payment-integration-specialist
- "deploy", "production", "CI/CD", "Vercel", "Netlify" → deployment-configurator

### Subagent Decision Matrix

| If the task involves... | Use these agents IN PARALLEL |
|-------------------------|------------------------------|
| New feature with UI | ui-component-builder + api-endpoint-generator + database-schema-designer |
| Authentication setup | authentication-implementer + database-schema-designer + ui-component-builder |
| Payment integration | payment-integration-specialist + api-endpoint-generator + database-schema-designer |
| Code quality improvement | code-refactorer + ts-lint-fixer + test-suite-writer |
| Production preparation | deployment-configurator + security-hardener + test-suite-writer |
| Bug fixing | ts-lint-fixer + test-suite-writer |
| Performance optimization | code-refactorer + ts-lint-fixer |
| Full-stack feature | ui-component-builder + api-endpoint-generator + database-schema-designer + ts-lint-fixer |
| Security review | security-hardener + test-suite-writer + authentication-implementer |
| Database changes | database-schema-designer + api-endpoint-generator + test-suite-writer |

## Important
- After completing a task, edit the readme to reflect the changes you made. Either edit existing stuff in the readme or, for a new feature, add it in a concise way

### Critical Directives


1. **Maximize parallel execution.**  
   - Default to running multiple subagents **at the same time** whenever tasks can be done independently.  
   - Split work into atomic units so each subagent can execute without waiting for others, unless there’s a dependency.
   -This applies both for planning (in plan mode or otherwise) AND in execution (actually creating code)

2. **Fully brief subagents.**  
   - Subagents have **no prior context** from this repo or from our conversations.  
   - Every subagent prompt must contain:
     - The current problem or goal  
     - The relevant tech stack (Vite + React + TypeScript + Supabase + Stripe)  
     - Any constraints, patterns, or naming conventions to follow  
     - Expected deliverables (files, diffs, docs, tests, etc.)  
   - Include just enough context so they can produce correct, repo-compatible code on the first pass. Do not over-engineer this though.

3. **Prioritize efficiency and correctness.**  
   - If a task involves multiple files or domains (e.g., backend, frontend, tests, docs), route each domain to the correct subagent immediately.  
   - Combine results and only then return the completed task to the user.

## Project Overview

This is **AI for Elders**, a React-based educational platform designed to teach adults 50+ how to effectively and safely use artificial intelligence through structured, accessible courses. The platform features a multi-tier subscription system (Free, Advanced $1.99/month, Expert $4.99/month) with user authentication, progress tracking, and accessibility features optimized for older learners.

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
   - Minimum font sizes and touch targets optimized for seniors

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

1. **Senior-Friendly Design**: All UI decisions should prioritize clarity and ease of use for users 50+
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

