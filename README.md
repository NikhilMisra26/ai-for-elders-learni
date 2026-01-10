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

Setup:

1. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`

2. Run the database migrations in order:
   - `supabase.schema.sql`
   - `supabase-testimonials.sql`
   - `supabase/migrations/20250114_enhanced_rls_no_mfa.sql`
   - `supabase/migrations/support_tickets.sql`

3. Start the app:
   - `pnpm dev`

## Support Email (Optional)

To enable support email sending, deploy the Edge Function in `supabase/functions/send-support-email` and set the following secrets in Supabase:

- `RESEND_API_KEY`
- `ALLOWED_ORIGIN`
- `SUPPORT_FROM_EMAIL`
- `SUPPORT_INBOX_EMAIL`

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm preview`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm security:check`
