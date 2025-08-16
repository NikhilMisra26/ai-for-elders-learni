# Send Support Email Edge Function

This Supabase Edge Function handles secure support email sending with rate limiting, input validation, and audit logging.

## Features

- JWT authentication verification
- Rate limiting (3 requests per hour per user)
- Input sanitization to prevent XSS
- Email sending via Resend API
- Support ticket tracking in database
- Security audit logging
- CORS configuration for your domain

## Setup Instructions

### 1. Apply Database Migration

First, apply the support_tickets table migration:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20250116_support_tickets.sql
```

### 2. Deploy Edge Function

Deploy the function to your Supabase project:

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy send-support-email
```

### 3. Set Environment Variables

In Supabase Dashboard > Edge Functions > Settings, set:

```bash
# Required - Get from https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Your frontend domain (for CORS)
ALLOWED_ORIGIN=https://yourdomain.com  # Production
# or
ALLOWED_ORIGIN=http://localhost:5173   # Development

# These are automatically set by Supabase:
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
```

### 4. Configure Resend

1. Create account at [Resend](https://resend.com)
2. Verify your domain or use their testing domain
3. Create an API key
4. Update the `from` email in the function if using custom domain

## Testing

### Local Testing with Supabase CLI

```bash
# Serve function locally
supabase functions serve send-support-email --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-support-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -d '{"message": "This is a test support message that needs help with login issues."}'
```

### Test from Frontend

```typescript
import { sendSupportEmail } from '@/lib/supportEmail';

const result = await sendSupportEmail({
  message: 'I need help with my subscription'
});

if (result.success) {
  console.log('Ticket ID:', result.ticketId);
} else {
  console.error('Error:', result.error);
}
```

### Test Rate Limiting

```bash
# Send 3 requests quickly (should succeed)
for i in {1..3}; do
  curl -X POST YOUR_FUNCTION_URL \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"message": "Test message number '$i'"}'
  echo ""
done

# 4th request should fail with 429 status
curl -X POST YOUR_FUNCTION_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "This should be rate limited"}'
```

## Security Features

### Rate Limiting
- Maximum 3 support emails per hour per user
- Prevents spam and abuse
- Returns friendly error messages with time until next allowed

### Input Validation
- Message must be 10-5000 characters
- HTML tags are stripped
- Special characters are escaped
- Message is trimmed

### Authentication
- Requires valid Supabase JWT token
- Verifies user exists in database
- Fetches user profile for email details

### Audit Trail
- All requests logged to security_logs table
- Tracks successful and failed attempts
- Stores ticket IDs for reference

## Response Format

### Success Response
```json
{
  "success": true,
  "ticketId": "uuid-here"
}
```

### Error Responses

#### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too many support requests. Please try again in X minutes."
}
```

#### Invalid Input (400)
```json
{
  "success": false,
  "error": "Message is too short (minimum 10 characters)"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "error": "Invalid session"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "error": "Failed to send email"
}
```

## Email Template

Emails are sent to `discover50ai@gmail.com` with:
- Subject: "Support Request from [User Name]"
- From: noreply@discover50ai.com
- Reply-To: User's email address
- Body includes: User details, ticket ID, timestamp, and message

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

-- User's tickets
SELECT * FROM support_tickets
WHERE user_id = 'USER_UUID'
ORDER BY created_at DESC;
```

### Check Rate Limiting
```sql
-- Recent requests by user
SELECT * FROM support_tickets
WHERE user_id = 'USER_UUID'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Security Audit
```sql
-- Support email actions
SELECT * FROM security_logs
WHERE action = 'support_email_sent'
ORDER BY created_at DESC
LIMIT 100;
```

## Troubleshooting

### Function Not Found
- Ensure function is deployed: `supabase functions list`
- Check function URL format

### CORS Errors
- Verify ALLOWED_ORIGIN environment variable
- Must match your frontend URL exactly (including protocol)

### Email Not Sending
- Check RESEND_API_KEY is valid
- Verify Resend domain/email configuration
- Check function logs: `supabase functions logs send-support-email`

### Rate Limit Not Working
- Ensure support_tickets table exists
- Check user_id is being passed correctly
- Verify RLS policies are not blocking reads

## Production Checklist

- [ ] Deploy database migration
- [ ] Deploy edge function
- [ ] Set RESEND_API_KEY environment variable
- [ ] Set ALLOWED_ORIGIN to production domain
- [ ] Verify email from address in Resend
- [ ] Test rate limiting
- [ ] Test email delivery
- [ ] Monitor initial requests in logs
- [ ] Set up email inbox monitoring for discover50ai@gmail.com