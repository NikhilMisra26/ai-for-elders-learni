# Backend Features Overview

## Implemented Features

- **User Profiles**: Creation and update of user profile records with email and tier information stored in Supabase (`src/lib/db.ts`).
- **Subscription Persistence**: Retrieval and upserting of subscription details, including trial handling and payment metadata (`src/lib/subscription.ts`, `src/lib/db.ts`).
- **Invoice Tracking**: Local invoice history with optional persistence to Supabase (`src/lib/subscription.ts`, `src/lib/db.ts`).
- **Course & Module Progress**: Supabase tables and utilities to store course and module completion metrics (`src/lib/db.ts`).
- **User Activity Logging**: Recording of user actions for audit and analytics (`src/lib/db.ts`).
- **Security Utilities**: Password/email validation, rate limiting, session management, input sanitization, file upload checks, and security logging (`src/lib/security.ts`).

## Features To Implement

### 1. Real Payment Processing

Integrate a payment provider (e.g., Stripe) instead of `simulatePaymentFlow`.

1. Install provider SDK and set API keys via environment variables.
2. Create checkout endpoints in a secure server (Node/Express or serverless functions).
3. Handle provider webhooks to confirm payments and update `subscriptions` table.
4. Store payment method details and invoice records from provider responses.

### 2. Subscription Access Enforcement

Prevent non-subscribed users from accessing premium content.

1. Add server-side middleware that verifies the user's subscription tier before serving protected routes.
2. On the client, replace `canAccessTier` checks with calls to these secured endpoints.
3. Ensure Supabase RLS policies restrict premium table rows to authorized tiers.

### 3. Persistent Invoice History

Move invoice storage fully to Supabase.

1. Replace local `useKV` storage with queries to `listInvoices` when a user logs in.
2. Add pagination or infinite scroll for large histories.
3. Generate downloadable invoice PDFs and store URLs in `download_url`.

### 4. Email Workflows

Implement transactional emails for verification and receipts.

1. Configure Supabase email templates or connect an external email service.
2. Trigger verification emails after profile creation and payment confirmations after invoices.
3. Record email delivery status for troubleshooting.

### 5. Persistent Rate Limiting

Current limiter resets on app reload.

1. Move rate limiting to a server or edge function using a durable store (Redis, Upstash, etc.).
2. Expose an endpoint that checks and increments attempt counters before authentication.
3. Log lockout events through `SecurityLogger`.

Each task above can be tackled individually using GitHub Copilot or Cursor. Start by scaffolding endpoint files, then add validation with Zod, connect to Supabase, and finally write unit tests to cover happy and error paths.
