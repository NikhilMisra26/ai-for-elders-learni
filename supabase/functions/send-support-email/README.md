# Send Support Email Edge Function

This Supabase Edge Function handles secure support email sending with rate limiting, input validation, and audit logging.

## Features

- JWT authentication verification
- Rate limiting (3 requests per hour per user)
- Input sanitization to prevent XSS
- Email sending via Resend API
- Emails go to your support inbox (configurable)
- Support ticket tracking in database
- Security audit logging
- CORS configuration for your domain
- Modern Deno/npm imports (no deprecated patterns)

## 📋 Complete Setup Instructions

### Step 1: Database Setup (REQUIRED)

Run this SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- Run the support tickets migration
-- File: supabase/migrations/support_tickets.sql
```

Copy the entire contents of `supabase/migrations/support_tickets.sql` and run it in Supabase SQL Editor.

This creates:

- `support_tickets` table with comprehensive tracking
- `rate_limiting_support` table for rate limiting
- Optimized RLS policies with wrapped `auth.uid()` for performance
- Security definer functions to bypass RLS overhead
- Proper indexes for query performance

### Step 2: Test the Database Setup

Run the comprehensive test to verify all schemas work together:

This will test:

- Base schema (profiles, subscriptions, etc.)
- Testimonials schema
- Enhanced RLS security
- Support tickets system
- All cross-schema relationships

### Step 3: Deploy the Edge Function

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project-ref from Supabase Dashboard → Settings → General)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-support-email
```

### Step 4: Set Environment Variables

In **Supabase Dashboard → Edge Functions → Secrets**, add:

| Secret Name           | Value                                    | Description                                        |
| --------------------- | ---------------------------------------- | -------------------------------------------------- |
| `RESEND_API_KEY`      | `re_ABcd1234...`                         | Get from [resend.com](https://resend.com/api-keys) |
| `ALLOWED_ORIGIN`      | `http://localhost:5173`                  | For development                                    |
| `ALLOWED_ORIGIN`      | `https://yourdomain.com`                 | For production                                     |
| `SUPPORT_INBOX_EMAIL` | `discover50ai@gmail.com`                 | Where support requests are delivered               |
| `SUPPORT_FROM_EMAIL`  | `Discover 50 AI <onboarding@resend.dev>` | From address shown to recipients (dev-safe)        |

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically set by Supabase.

### Step 5: Configure Resend (for email sending)

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** and create a new key
3. For production, verify your domain in Resend
4. Optionally set `SUPPORT_FROM_EMAIL` (e.g., `Support <noreply@yourdomain.com>`). If using a custom domain, verify it in Resend first.

Who receives the email?

- The function sends an email to `SUPPORT_INBOX_EMAIL` (your inbox) containing the user's message and context. The user does not get an email; they just open a ticket. The reply-to is set to the user's email so you can reply from your inbox.

## Testing

### Test the UI First (works without email setup)

1. Run `pnpm run dev`
2. Navigate to Account page
3. Click "Email Support" button
4. Submit a test message

The dialog will work and create tickets even without email configuration.

### Test with cURL

```bash
# Get a USER access token (must be a logged-in user's JWT), not the anon key
# Easiest path: trigger from the frontend which attaches the session token automatically
# For raw testing, obtain a user JWT via Supabase auth and place it below
USER_JWT="ey..."
PROJECT_URL="https://your-project.supabase.co"

# Test the function
curl -X POST "$PROJECT_URL/functions/v1/send-support-email" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message": "This is a test support message that needs help."}'
```

### Expected Responses

#### Success

```json
{
  "success": true,
  "ticketId": "uuid-here"
}
```

#### Rate Limited (429)

```json
{
  "success": false,
  "error": "Too many support requests. Please try again in X minutes."
}
```

#### Email Failed but Ticket Created

```json
{
  "success": true,
  "ticketId": "uuid-here",
  "warning": "Ticket created but email notification failed. Support team will check pending tickets."
}
```

## Monitoring

### View Support Tickets

```sql
-- All tickets
SELECT * FROM support_tickets
ORDER BY created_at DESC;

-- Pending tickets
SELECT * FROM support_tickets
WHERE status = 'pending'
ORDER BY created_at ASC;

-- Failed email tickets
SELECT * FROM support_tickets
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check Rate Limiting

```sql
-- Recent requests by user
SELECT * FROM support_tickets
WHERE user_id = 'USER_UUID'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Rate limit entries
SELECT * FROM rate_limiting_support
WHERE user_id = 'USER_UUID'
ORDER BY created_at DESC;
```

## Security Features

### Rate Limiting

- Maximum 3 support emails per hour per user
- Tracked in `rate_limiting_support` table
- Enforced at database level with security definer function

### Input Validation

- Message must be 10-5000 characters
- HTML tags are stripped
- Special characters are escaped
- Message is trimmed

### Authentication

- Requires valid Supabase JWT token
- Verifies user exists in database
- Fetches user profile for email details

### Performance Optimizations

- RLS policies use wrapped `(SELECT auth.uid())` for caching
- Security definer functions bypass RLS overhead
- Proper indexes on frequently queried columns
- Denormalized user data in tickets for fast admin access

## Troubleshooting

### "Table does not exist" error

Run the migration from `supabase/migrations/support_tickets.sql`

### "RESEND_API_KEY not configured"

Add the Resend API key in Supabase Edge Functions Secrets

### CORS errors

Verify `ALLOWED_ORIGIN` matches your frontend URL exactly (including protocol)

### Rate limit not working

- Ensure `rate_limiting_support` table exists
- Check that RLS policies are enabled
- Verify the `check_support_rate_limit` function exists

### Email not sending but ticket created

This is by design - the system creates a ticket even if email fails. Check:

- Resend API key is valid
- Domain is verified in Resend (for production)
- Check Edge Function logs: `supabase functions logs send-support-email`

## Production Checklist

- [ ] Run `support_tickets.sql` migration
- [ ] Deploy edge function
- [ ] Set RESEND_API_KEY environment variable
- [ ] Set ALLOWED_ORIGIN to production domain
- [ ] Verify email domain in Resend
- [ ] Test rate limiting
- [ ] Test email delivery
- [ ] Monitor initial requests in logs
- [ ] Set up email inbox monitoring for discover50ai@gmail.com

## Files Overview

- `index.ts` - Edge Function with modern Deno/npm imports
- `supabase/migrations/support_tickets.sql` - Production-ready database schema
- `src/components/EmailSupportDialog.tsx` - React dialog component
- `src/lib/supportEmail.ts` - Client-side support API helper
