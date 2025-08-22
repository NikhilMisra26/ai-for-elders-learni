// This file runs on Deno (Supabase Edge Functions) but is type-checked in a Node/tsc project.
// Provide light ambient typings so tsc doesn't error while keeping Deno runtime behavior.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

// tsc in this workspace cannot resolve Deno's npm: specifier; ignore for types only.
// @ts-expect-error: Deno npm: specifier not supported by Node.js TypeScript compiler
import { createClient } from 'npm:@supabase/supabase-js@2';
import { RateLimiter, applyRateLimit, getClientIp } from '../_shared/rateLimit.ts';

// Type definitions
interface SupportEmailRequest {
  message: string;
}

// CORS headers for your domain
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Legacy constants (can be removed in future versions)
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3;

// Initialize server-side rate limiters
// IP-based rate limiter: stricter limits to prevent abuse
const ipRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 requests per minute per IP
  keyPrefix: 'support:ip:',
});

// User-based rate limiter: more lenient for authenticated users
const userRateLimiter = new RateLimiter({
  windowMs: 3600000, // 1 hour
  maxRequests: 5, // 5 support requests per hour per user
  keyPrefix: 'support:user:',
});

// Sanitize input to prevent XSS
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/[&'"]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        "'": '&#39;',
        '"': '&quot;',
      };
      return escapeMap[char] ?? char;
    })
    .trim()
    .slice(0, 5000); // Limit message length
}

// Sanitize email subject to prevent header injection
function sanitizeEmailSubject(subject: string): string {
  return subject
    .replace(/[\r\n\t]/g, '') // Remove CRLF and tabs to prevent header injection
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .slice(0, 200); // Limit subject length
}

// Validate email format (basic validation)
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Legacy rate limiting function removed - now using Redis-based rate limiting above

// Send email via Resend API
async function sendEmail(
  userEmail: string,
  userName: string,
  userId: string,
  message: string,
  ticketId: string,
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const supportFrom = Deno.env.get('SUPPORT_FROM_EMAIL') ?? 'onboarding@resend.dev';
  const supportInbox = Deno.env.get('SUPPORT_INBOX_EMAIL') ?? 'support@example.com';

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  // Validate email addresses
  if (!isValidEmail(userEmail)) {
    console.error('Invalid user email format:', userEmail);
    return { success: false, error: 'Invalid email format' };
  }

  if (!isValidEmail(supportInbox)) {
    console.error('Invalid support inbox email format:', supportInbox);
    return { success: false, error: 'Support email configuration invalid' };
  }

  // Sanitize subject line to prevent header injection
  const sanitizedSubject = sanitizeEmailSubject(`Support Request from ${userName}`);

  const emailBody = `
User: ${userName} (${userEmail})
User ID: ${userId}
Ticket ID: ${ticketId}
Date: ${new Date().toISOString()}

Message:
${message}

---
This is an automated support ticket from DISCOVER 50 AI
To reply to this user, send an email to: ${userEmail}
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: supportFrom,
        to: [supportInbox],
        subject: sanitizedSubject,
        text: emailBody,
        reply_to: userEmail,
      }),
    });

    // Check response.ok before attempting to parse
    if (!response.ok) {
      let errorMessage = 'Failed to send email';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText.substring(0, 200); // Limit error message length
          }
        }
      } catch (parseError) {
        console.error('Failed to parse Resend error response:', parseError);
      }

      console.error('Resend API error:', response.status, errorMessage);
      return { success: false, error: errorMessage };
    }

    // Parse successful response
    let emailId = 'unknown';
    try {
      const data = await response.json();
      emailId = data.id || 'unknown';
    } catch (parseError) {
      console.error('Failed to parse Resend success response:', parseError);
      // Still treat as success if status was ok
    }

    console.log('Email sent successfully:', emailId);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Main handler using Deno.serve (modern pattern)
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Apply IP-based rate limiting first (before authentication)
    const ipLimit = await applyRateLimit(req, ipRateLimiter, {
      identifierType: 'ip',
    });

    if (!ipLimit.allowed) {
      return new Response(JSON.stringify({ success: false, error: ipLimit.message }), {
        status: 429,
        headers: {
          ...corsHeaders,
          ...Object.fromEntries(ipLimit.headers.entries()),
          'Content-Type': 'application/json',
        },
      });
    }

    // Initialize Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);

    // Verify the JWT and get user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply user-based rate limiting after authentication
    const userLimit = await applyRateLimit(req, userRateLimiter, {
      identifierType: 'user',
      userId: user.id,
    });

    if (!userLimit.allowed) {
      return new Response(JSON.stringify({ success: false, error: userLimit.message }), {
        status: 429,
        headers: {
          ...corsHeaders,
          ...Object.fromEntries(userLimit.headers.entries()),
          'Content-Type': 'application/json',
        },
      });
    }

    // Parse and validate request body
    let body: SupportEmailRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Comprehensive message validation
    if (!body.message || typeof body.message !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Additional validation for message structure
    if (body.message.length > 10000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too long (maximum 10000 characters)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Check for potential injection attempts
    const suspiciousPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /<iframe[^>]*>/gi,
    ];
    if (suspiciousPatterns.some((pattern) => pattern.test(body.message))) {
      console.warn('Suspicious content detected in support message');
      return new Response(
        JSON.stringify({ success: false, error: 'Message contains invalid content' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(body.message);

    if (sanitizedMessage.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message too short (minimum 10 characters)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Note: Redis-based rate limiting is already applied above
    // Database-based rate limiting is kept as secondary check for database consistency

    // Get user profile details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('name, email, tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch user profile:', profileError);
      // Continue with user email if profile not found
    }

    // Create support ticket record
    const ticketData = {
      user_id: user.id,
      user_email: profile?.email || user.email || 'unknown@email.com',
      user_name: profile?.name || 'User',
      user_tier: profile?.tier || 'free',
      message: sanitizedMessage,
      status: 'pending' as const,
    };

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('Failed to create support ticket:', ticketError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create support ticket' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Rate limiting is now handled by Redis above
    // Support ticket is created - this serves as audit trail

    // Send email
    const emailResult = await sendEmail(
      ticketData.user_email,
      ticketData.user_name,
      user.id,
      sanitizedMessage,
      ticket.id,
    );

    if (!emailResult.success) {
      // Update ticket status to failed
      await supabaseAdmin
        .from('support_tickets')
        .update({ status: 'failed', error_message: emailResult.error })
        .eq('id', ticket.id);

      // Still return success for ticket creation, but note email failure
      return new Response(
        JSON.stringify({
          success: true,
          ticketId: ticket.id,
          warning:
            'Ticket created but email notification failed. Support team will check pending tickets.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Log security action if security_logs table exists
    try {
      await supabaseAdmin.from('security_logs').insert({
        user_id: user.id,
        action: 'support_email_sent',
        details: { ticket_id: ticket.id },
        success: true,
      });
    } catch (error) {
      // Ignore if security_logs table doesn't exist
      console.log('Security logging skipped:', error);
    }

    // Return success response
    return new Response(JSON.stringify({ success: true, ticketId: ticket.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ success: false, error: 'An unexpected error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
